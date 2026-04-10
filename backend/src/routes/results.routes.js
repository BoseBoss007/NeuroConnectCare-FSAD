const express = require("express");
const router = express.Router();
const Diagnosis = require("../models/Diagnosis");

router.get("/patient/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

    console.log("QUERYING RESULTS FOR:", patientId);

    const results = await Diagnosis.find({ patientRowId: patientId }).sort({ createdAt: -1 });

    console.log("RESULTS FOUND:", results);

    res.json({
      patientId,
      total: results.length,
      results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
