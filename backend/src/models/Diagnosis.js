const mongoose = require("mongoose");

/**
 * Stores per-patient FL predictions for a training job.
 * One document per patient row per job run.
 */
const diagnosisSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      index: true,
    },
    patientRowId: {
      type: String,   // Changed from Number to String to support ObjectIds
      required: true,
    },
    age: { type: Number },
    sex: { type: Number },
    // Rule-based label assigned during preprocessing
    assignedDisorder: { type: String },
    // FL model prediction
    predictedDisorder: { type: String, required: true },
    // Softmax confidence 0–100
    confidence: { type: Number },
    // Final epoch accuracy (%) for this job
    finalAccuracy: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Diagnosis", diagnosisSchema, "diagnoses");
