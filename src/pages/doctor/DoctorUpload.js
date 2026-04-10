import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import DoctorSidebar from "../../components/DoctorSidebar";
import Header from "../../components/Header";

// ── sessionStorage helpers ─────────────────────────────────────
const SS = {
  get:    (k, fallback = null) => { try { const v = sessionStorage.getItem(k); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set:    (k, v)               => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} },
  remove: (...keys)            => { keys.forEach(k => { try { sessionStorage.removeItem(k); } catch {} }); },
};

// ── Utility: Line Chart ────────────────────────────────────────
function AccuracyChart({ history }) {
  if (!history || history.length < 2) return null;
  const W = 520, H = 160, PAD = 28;
  const maxAcc = Math.max(...history, 10);
  const pts = history.map((v, i) => {
    const x = PAD + (i / (history.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((v / maxAcc) * (H - PAD * 2));
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const areaPath = `M ${pts[0]} ${pts.slice(1).map(p => "L " + p).join(" ")} L ${W - PAD},${H - PAD} L ${PAD},${H - PAD} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0"  />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map(pct => {
        const y = H - PAD - (pct / maxAcc) * (H - PAD * 2);
        return (
          <g key={pct}>
            <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4,4" />
            <text x={PAD - 4} y={y + 4} fill="#64748b" fontSize="9" textAnchor="end">{pct}%</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#chartGrad)" />
      <polyline points={polyline} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round" />
      {pts.length > 0 && (() => {
        const [lx, ly] = pts[pts.length - 1].split(",").map(Number);
        return (
          <>
            <circle cx={lx} cy={ly} r={5} fill="#6366f1" />
            <text x={lx + 7} y={ly + 4} fill="#a5b4fc" fontSize="10" fontWeight="bold">
              {history[history.length - 1].toFixed(1)}%
            </text>
          </>
        );
      })()}
      {[1, 5, 10].map(ep => {
        const idx = Math.min(ep - 1, history.length - 1);
        const x = PAD + (idx / (history.length - 1 || 1)) * (W - PAD * 2);
        return <text key={ep} x={x} y={H - 6} fill="#64748b" fontSize="9" textAnchor="middle">{ep}</text>;
      })}
    </svg>
  );
}

const POLL_INTERVAL_MS = 1500;

export default function DoctorUpload() {
  // ── Restore from sessionStorage on initial load ───────────────
  const [file,            setFile]            = useState(null); // File object can't be serialized — always null on remount
  const [fileName,        setFileName]        = useState(() => SS.get("fl_fileName", null));
  const [dragging,        setDragging]        = useState(false);
  const [fileDataPreview, setFileDataPreview] = useState(() => SS.get("fl_previewData", []));
  const [fileHeaders,     setFileHeaders]     = useState(() => SS.get("fl_previewHeaders", []));

  const [jobId,    setJobId]    = useState(() => SS.get("fl_jobId", null));
  const [progress, setProgress] = useState(() => SS.get("fl_progress", null));
  const [error,    setError]    = useState(null);
  const [uploading,setUploading]= useState(false);

  const pollRef     = useRef(null);
  const fileInputRef= useRef(null);

  // ── Polling ──────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startPolling = useCallback((id) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`http://localhost:5001/api/fl/status/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        setProgress(data);
        SS.set("fl_progress", data);           // ← persist live progress

        if (data.status === "complete") {
          SS.set("fl_jobId", id);              // ← lock in completed jobId
          stopPolling();
        }
        if (data.status === "error") {
          stopPolling();
          setError("Training encountered an error. Please check server logs.");
        }
      } catch (_) {}
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  // ── If a job was in progress when we left, resume polling ────
  useEffect(() => {
    const savedJobId   = SS.get("fl_jobId", null);
    const savedProgress= SS.get("fl_progress", null);

    // If job exists but wasn't complete yet, resume polling
    if (savedJobId && savedProgress && savedProgress.status !== "complete") {
      startPolling(savedJobId);
    }
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  // ── CSV Parsing & Preview ────────────────────────────────────
  const parseCSVFile = (csvFile) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text  = evt.target.result;
      const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith("#"));
      if (lines.length > 0) {
        const headers = lines[0].split(",");
        const rows    = lines.slice(1, 101).map(l => l.split(","));

        setFileHeaders(headers);
        setFileDataPreview(rows);
        setFileName(csvFile.name);

        SS.set("fl_previewHeaders", headers);
        SS.set("fl_previewData",    rows);
        SS.set("fl_fileName",       csvFile.name);
      }
    };
    reader.readAsText(csvFile);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.name.endsWith(".csv")) { setFile(dropped); parseCSVFile(dropped); }
    else setError("Please drop a valid CSV file.");
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) { setFile(selected); setError(null); parseCSVFile(selected); }
  };

  // ── Upload & start training ───────────────────────────────────
  const handleUpload = async () => {
    if (!file) return;
    setError(null); setProgress(null);
    SS.remove("fl_progress");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res  = await fetch("http://localhost:5001/api/fl/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const initialProgress = { epoch: 0, total_epochs: 10, accuracy: 0, status: "starting" };
      setJobId(data.jobId);
      setProgress(initialProgress);
      SS.set("fl_jobId",    data.jobId);
      SS.set("fl_progress", initialProgress);
      startPolling(data.jobId);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  // ── Reset everything (start fresh) ───────────────────────────
  const handleReset = () => {
    stopPolling();
    setFile(null); setFileName(null); setFileDataPreview([]); setFileHeaders([]);
    setJobId(null); setProgress(null); setError(null);
    SS.remove("fl_jobId", "fl_progress", "fl_previewData", "fl_previewHeaders", "fl_fileName");
  };

  const isTraining = progress && progress.status !== "complete" && progress.status !== "error";
  const isComplete = progress && progress.status === "complete";
  const epochPct   = progress ? Math.round((progress.epoch / (progress.total_epochs || 10)) * 100) : 0;

  // If training is done, show the completed state (even without a File object after navigation)
  const showDropzone     = !isTraining && !isComplete;
  const showTrainButton  = !isTraining && !isComplete && (file != null);

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Header />
      <div className="flex">
        <DoctorSidebar />

        <div className="flex-1 p-8 max-w-7xl flex gap-8">

          {/* LEFT COLUMN: Upload & Progress */}
          <div className="w-1/2 flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                Upload Dataset
              </h1>
              <p className="text-slate-400 mt-1 text-sm">
                Upload an EEG/ERG dataset. Preview the records here, then begin the Federated Learning training run.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-3 text-red-300 text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* ── Dropzone (only when no active/completed job) ── */}
            {showDropzone && (
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => !file && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                  dragging ? 'border-indigo-500 bg-indigo-500/5' : file ? 'border-green-500 bg-slate-900/60' : 'border-slate-700 bg-slate-900/60'
                }`}
              >
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                {file ? (
                  <div>
                    <div className="text-4xl mb-2">📄</div>
                    <p className="text-green-500 font-semibold">{file.name}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      {(file.size / 1024).toFixed(1)} KB ·{" "}
                      <span onClick={e => { e.stopPropagation(); setFile(null); setFileName(null); setFileDataPreview([]); SS.remove("fl_previewData","fl_previewHeaders","fl_fileName"); }}
                        className="text-red-400 hover:text-red-300 underline ml-2 cursor-pointer">
                        Remove
                      </span>
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl mb-3">📂</div>
                    <p className="text-slate-400 font-medium text-sm">Drag &amp; drop CSV file, or click to browse</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Start Training Button ── */}
            {showTrainButton && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className={`py-3 px-6 rounded-lg font-semibold transition-all ${
                  uploading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 shadow-lg shadow-indigo-500/20'
                }`}
              >
                {uploading ? "⏳ Initializing..." : "🚀 Start FL Training"}
              </button>
            )}

            {/* ── Progress Panel ── */}
            {progress && (
              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-indigo-300 font-bold m-0">
                      {progress.status === "starting"   && "Initialising Network..."}
                      {progress.status === "training"   && `Training Epoch ${progress.epoch}/${progress.total_epochs}`}
                      {progress.status === "predicting" && "Generating Predictions..."}
                      {progress.status === "complete"   && "✅ Training Complete"}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">Federated Learning process running.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-indigo-400">{epochPct}%</span>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style={{ width: `${epochPct}%` }} />
                </div>

                {progress.history && progress.history.length > 1 && (
                  <div className="mt-6 mb-4">
                    <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Live Accuracy Graph</p>
                    <AccuracyChart history={progress.history} />
                  </div>
                )}

                {isComplete && (
                  <div className="mt-8 flex flex-col gap-3">
                    <p className="text-green-400 text-sm">
                      The model achieved {progress.accuracy?.toFixed(1)}% final accuracy and predictions are ready!
                    </p>
                    <Link
                      to={`/doctor/analytics?jobId=${jobId}`}
                      className="block w-full text-center py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-lg shadow-green-500/20 transition-all"
                    >
                      View Analytics Dashboard ➔
                    </Link>
                    <button
                      onClick={handleReset}
                      className="block w-full text-center py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm rounded-lg transition-all"
                    >
                      🔄 Train a New Dataset
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Prompt to upload if nothing loaded ── */}
            {!progress && !file && !fileName && (
              <p className="text-slate-600 text-sm text-center pt-4">Upload a CSV and click Start FL Training to begin.</p>
            )}
          </div>

          {/* RIGHT COLUMN: Dataset Preview */}
          <div className="w-1/2 flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-300">Dataset Preview</h3>
              <span className="text-xs text-slate-500">
                {fileName ? `${fileName} · ` : ""}
                {fileDataPreview.length > 0 ? `${fileDataPreview.length} rows loaded` : "No file"}
              </span>
            </div>

            <div className="flex-1 overflow-auto max-h-[600px] bg-[#0c111c]">
              {fileDataPreview.length > 0 ? (
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#0f172a] sticky top-0 shadow-sm z-10">
                    <tr>
                      {fileHeaders.map((header, idx) => (
                        <th key={idx} className="px-4 py-3 text-slate-400 font-semibold border-b border-slate-800">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {fileDataPreview.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className={`px-4 py-3 ${cIdx === 0 ? 'font-medium text-slate-300' : 'text-slate-500'}`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-600">
                  <div className="text-3xl mb-2">📋</div>
                  <p className="text-sm">Upload a dataset to see raw features here.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
