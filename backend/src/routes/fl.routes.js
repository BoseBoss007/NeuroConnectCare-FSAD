/**
 * NeuroCare Connect – Federated Learning API Routes
 *
 * POST /api/fl/upload      – accepts CSV, spawns FL server + client
 * GET  /api/fl/status/:id  – returns live training progress
 * GET  /api/fl/results/:id – returns final predictions JSON
 */

const express   = require("express");
const router    = express.Router();
const multer    = require("multer");
const path      = require("path");
const fs        = require("fs");
const { spawn } = require("child_process");
const { v4: uuidv4 } = require("uuid");
const Diagnosis = require("../models/Diagnosis");

// ── Multer: store uploaded CSV in /tmp/fl_uploads ─────────────
const uploadDir = path.join("/tmp", "fl_uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"), false);
    }
  },
});

// ── Helpers ───────────────────────────────────────────────────
const FL_SERVER_URL  = "http://localhost:5050";
const FL_SERVER_PORT = 5050;
const PYTHON_BIN     = "/Library/Developer/CommandLineTools/usr/bin/python3";
const FL_SERVER_PATH = path.join(__dirname, "../../fl/fl_server.py");
const FL_CLIENT_PATH = path.join(__dirname, "../../fl/fl_client.py");

// Track running FL-server PID so we don't double-start it
let flServerProcess = null;

function ensureFlServerRunning() {
  if (flServerProcess && !flServerProcess.killed) return;

  console.log("[FL] Starting FL Server on port", FL_SERVER_PORT);
  flServerProcess = spawn(PYTHON_BIN, [FL_SERVER_PATH], {
    detached: false,
    stdio: ["ignore", "pipe", "pipe"],
  });

  flServerProcess.stdout.on("data", d => process.stdout.write(`[fl-server] ${d}`));
  flServerProcess.stderr.on("data", d => process.stderr.write(`[fl-server] ${d}`));
  flServerProcess.on("exit", (code) => {
    console.log(`[FL] FL Server exited with code ${code}`);
    flServerProcess = null;
  });
}

function waitForServer(url, retries = 20, delay = 1500) {
  return new Promise((resolve, reject) => {
    const http = require("http");
    let attempts = 0;

    const check = () => {
      attempts++;
      http.get(`${url}/health`, (res) => {
        if (res.statusCode === 200) resolve();
        else tryAgain();
      }).on("error", () => {
        if (attempts >= retries) reject(new Error("FL Server did not start in time"));
        else setTimeout(check, delay);
      });
    };

    const tryAgain = () => {
      if (attempts >= retries) reject(new Error("FL Server not ready"));
      else setTimeout(check, delay);
    };

    check();
  });
}

// ── POST /api/fl/upload ───────────────────────────────────────
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No CSV file uploaded" });
  }

  const jobId  = uuidv4();
  const jobDir = path.join("/tmp", "fl_jobs", jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  const csvPath = req.file.path;

  // Write initial progress so the frontend can start polling immediately
  fs.writeFileSync(
    path.join(jobDir, "progress.json"),
    JSON.stringify({ epoch: 0, total_epochs: 10, accuracy: 0, status: "starting" })
  );

  // ✅ Respond immediately so the UI can start polling — don't block on FL startup
  res.json({ jobId, message: "Training started" });

  // ── Async: start FL server + client in the background ─────────
  (async () => {
    // Kill any previous zombie FL server
    ensureFlServerRunning();

    // Give Python server a moment to bind its port
    try {
      await waitForServer(FL_SERVER_URL);
    } catch (e) {
      console.warn("[FL] Server health check timed out — client will continue locally:", e.message);
    }

    const client = spawn(PYTHON_BIN, [FL_CLIENT_PATH, FL_SERVER_URL, csvPath, jobDir], {
      detached: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    client.stdout.on("data", d => process.stdout.write(`[fl-client:${jobId.slice(0,8)}] ${d}`));
    client.stderr.on("data", d => {
      fs.appendFileSync(path.join(jobDir, "client_error.log"), d.toString());
      process.stderr.write(`[fl-client:${jobId.slice(0,8)}] ${d}`);
    });

    client.on("exit", async (code) => {
      console.log(`[FL] Client job ${jobId} exited with code ${code}`);
      try {
        const resultsPath = path.join(jobDir, "results.json");
        if (fs.existsSync(resultsPath)) {
          const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
          const docs = results.predictions.map(p => ({
            jobId,
            patientRowId:       p.patient_id,
            age:                p.age,
            sex:                p.sex,
            assignedDisorder:   p.mental_disorder,
            predictedDisorder:  p.predicted_disorder,
            confidence:         p.confidence,
            finalAccuracy:      results.final_accuracy,
          }));
          await Diagnosis.insertMany(docs);
          console.log(`[FL] Saved ${docs.length} predictions to MongoDB.`);
        }
      } catch (err) {
        console.error("[FL] Failed to save predictions:", err.message);
      }
    });
  })();
});

// ── GET /api/fl/status/:jobId ─────────────────────────────────
router.get("/status/:jobId", (req, res) => {
  const { jobId } = req.params;
  const progressPath = path.join("/tmp", "fl_jobs", jobId, "progress.json");

  if (!fs.existsSync(progressPath)) {
    return res.status(404).json({ error: "Job not found" });
  }

  try {
    const progress = JSON.parse(fs.readFileSync(progressPath, "utf8"));
    res.json(progress);
  } catch (e) {
    res.status(500).json({ error: "Could not read progress" });
  }
});

// ── GET /api/fl/results/:jobId ────────────────────────────────
router.get("/results/:jobId", (req, res) => {
  const { jobId } = req.params;
  const resultsPath = path.join("/tmp", "fl_jobs", jobId, "results.json");

  if (!fs.existsSync(resultsPath)) {
    return res.status(404).json({ error: "Results not ready yet" });
  }

  try {
    const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: "Could not read results" });
  }
});

// ── POST /api/fl/predict-single ───────────────────────────────
router.post("/predict-single", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No CSV file uploaded for prediction" });
  }
  const { patientId } = req.body;
  if (!patientId) {
    return res.status(400).json({ error: "patientId is required" });
  }

  const csvPath = req.file.path;
  const FL_PREDICT_PATH = path.join(__dirname, "../../fl/fl_predict.py");

  const predictProcess = spawn(PYTHON_BIN, [FL_PREDICT_PATH, csvPath]);
  
  let pythonOutput = "";
  predictProcess.stdout.on("data", (data) => {
    pythonOutput += data.toString();
  });
  
  let pythonError = "";
  predictProcess.stderr.on("data", (data) => {
    pythonError += data.toString();
  });

  predictProcess.on("close", async (code) => {
    if (code !== 0) {
      console.error("[FL Predict] Error Output:", pythonError);
      return res.status(500).json({ error: "Prediction script failed" });
    }

    let resultObj;
    try {
      // Extract the LAST non-empty line — that's always our JSON
      const jsonLine = pythonOutput.trim().split("\n").filter(l => l.trim()).pop() || "";
      resultObj = JSON.parse(jsonLine);
    } catch (e) {
      console.error("[FL Predict] Failed to parse output:", pythonOutput);
      return res.status(500).json({ error: "Failed to parse prediction output" });
    }

    if (resultObj.error) {
      return res.status(400).json({ error: resultObj.error });
    }

    try {
      // Save to Diagnosis matching patientId
      await Diagnosis.create({
        jobId: "SINGLE_PREDICTION_" + Date.now(),
        patientRowId: patientId, // Strings or ObjectIds allowed due to schema update
        predictedDisorder: resultObj.predicted_disorder,
        assignedDisorder: "Unknown", 
        confidence: resultObj.severity_percentage,
        finalAccuracy: 0,
      });

      res.json(resultObj);
    } catch (dbErr) {
      console.error("[FL Predict] Database save failed:", dbErr);
      // Still return the result so the UI works even if history saving fails
      res.json(resultObj);
    }
  });
});

module.exports = router;
