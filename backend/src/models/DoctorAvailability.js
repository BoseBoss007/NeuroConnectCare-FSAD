const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  time: String,
  isBooked: { type: Boolean, default: false },
});

const doctorAvailabilitySchema = new mongoose.Schema({
  doctorId: String,
  date: String, // YYYY-MM-DD
  slots: [slotSchema],
});

module.exports = mongoose.model(
  "DoctorAvailability",
  doctorAvailabilitySchema,
  "doctorsAvailability"
);
