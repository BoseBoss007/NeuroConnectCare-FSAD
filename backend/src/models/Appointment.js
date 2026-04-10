const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
  },
  doctorId: {
    type: String,
    required: true,
  },
  doctorName: {               // ✅ ADD THIS
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "BOOKED",
  },
});
module.exports = mongoose.model(
  "Appointment",
  appointmentSchema,
  "appointments"
);
