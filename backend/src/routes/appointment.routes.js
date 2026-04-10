const express = require("express");
const Appointment = require("../models/Appointment");
const User = require("../models/User");

const router = express.Router();

/**
 * 📌 BOOK APPOINTMENT
 * POST /api/appointments   (root — matches what the frontend sends)
 * POST /api/appointments/book  (legacy alias)
 */
async function bookAppointment(req, res) {
  try {
    const { patientId, doctorId, doctorName, date, time } = req.body;

    if (!patientId || !doctorId || !date || !time) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Resolve doctorName if not supplied by the frontend
    let resolvedDoctorName = doctorName;
    if (!resolvedDoctorName) {
      const doc = await User.findOne({ doctorId });
      resolvedDoctorName = doc ? doc.name : "Doctor";
    }

    // ✅ Create appointment directly — no availability check (no seeded slots)
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      doctorName: resolvedDoctorName,
      date,
      time,
      status: "BOOKED",
    });

    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

router.post("/", bookAppointment);      // ← what PatientDashboard.js calls
router.post("/book", bookAppointment);  // ← legacy alias

/**
 * 📌 GET PATIENT APPOINTMENTS
 * GET /api/appointments/patient/:patientId
 */
router.get("/patient/:patientId", async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patientId: req.params.patientId,
    }).sort({ date: 1, time: 1 });

    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 📌 GET DOCTOR APPOINTMENTS
 * GET /api/appointments/doctor/:doctorId
 */
router.get("/doctor/:doctorId", async (req, res) => {
  try {
    const appointments = await Appointment.find({
      doctorId: req.params.doctorId,
    }).sort({ date: 1, time: 1 });

    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 📌 CANCEL APPOINTMENT
 * DELETE /api/appointments/:appointmentId
 */
router.delete("/:appointmentId", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // 🔓 Release slot
    await DoctorAvailability.updateOne(
      {
        doctorId: appointment.doctorId,
        date: appointment.date,
        "slots.time": appointment.time,
      },
      { $set: { "slots.$.isBooked": false } }
    );

    await appointment.deleteOne();

    res.json({ message: "Appointment cancelled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 📌 RESCHEDULE APPOINTMENT
 * PUT /api/appointments/reschedule/:appointmentId
 */
router.put("/reschedule/:appointmentId", async (req, res) => {
  try {
    const { newTime } = req.body;

    const appointment = await Appointment.findById(req.params.appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // 🔓 Release old slot
    await DoctorAvailability.updateOne(
      {
        doctorId: appointment.doctorId,
        date: appointment.date,
        "slots.time": appointment.time,
      },
      { $set: { "slots.$.isBooked": false } }
    );

    // 🔒 Book new slot
    const updated = await DoctorAvailability.updateOne(
      {
        doctorId: appointment.doctorId,
        date: appointment.date,
        "slots.time": newTime,
        "slots.isBooked": false,
      },
      { $set: { "slots.$.isBooked": true } }
    );

    if (updated.modifiedCount === 0) {
      return res.status(400).json({ message: "New slot not available" });
    }

    appointment.time = newTime;
    await appointment.save();

    res.json({ message: "Appointment rescheduled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
