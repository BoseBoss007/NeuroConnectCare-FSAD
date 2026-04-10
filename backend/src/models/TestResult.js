const mongoose = require("mongoose");

const testResultSchema = new mongoose.Schema(
  {
    patientId: {
      type: String, // MongoDB _id as string
      required: true,
    },
    doctorId: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    reportFile: {
      type: String, // PDF file name
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "TestResult",
  testResultSchema,
  "testResults" // ✅ EXACT collection name from MongoDB
);

