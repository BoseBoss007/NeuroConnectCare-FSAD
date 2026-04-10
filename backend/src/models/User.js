const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Common fields
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["doctor", "patient"],
      required: true,
    },

    // Patient-specific
    dateOfBirth: {
      type: String, // keep string for simplicity (YYYY-MM-DD)
      default: null,
    },

    // Doctor-specific
    doctorId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
