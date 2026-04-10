const express = require("express");
const User = require("../models/User");

const router = express.Router();

/**
 * REGISTER PATIENT
 * Required: name, dob, contactNumber, email, password
 */
router.post("/register-patient", async (req, res) => {
  try {
    const { name, dateOfBirth, contactNumber, email, password } = req.body;

    if (!name || !dateOfBirth || !contactNumber || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const patient = await User.create({
      name,
      dateOfBirth,
      contactNumber,
      email,
      password, // plain text
      role: "patient",
    });

    res.status(201).json({
      message: "Patient registered successfully",
      patientId: patient._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * LOGIN PATIENT  ✅ ONLY ONE
 **/
router.post("/login-patient", async (req, res) => {
  try {
    const { email, password } = req.body;

    const patient = await User.findOne({ email, role: "patient" });

    if (!patient) {
      return res.status(400).json({ message: "Patient not found" });
    }

    if (password !== patient.password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Patient login successful",
      patientId: patient._id.toString(), // MongoDB _id as patientId
      name: patient.name,
      role: "patient",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * REGISTER DOCTOR
 * Auto-generates doctorId (DOC1, DOC2, etc)
 */
router.post("/register-doctor", async (req, res) => {
  try {
    const { name, email, contactNumber, dateOfBirth, password } = req.body;

    if (!name || !email || !contactNumber || !dateOfBirth || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Auto-generate DoctorId DOC1, DOC2 etc.
    const doctorCount = await User.countDocuments({ role: "doctor" });
    const doctorId = `DOC${doctorCount + 1}`;

    const doctor = await User.create({
      name,
      email,
      contactNumber,
      dateOfBirth,
      password,
      role: "doctor",
      doctorId,
    });

    res.status(201).json({
      message: "Doctor registered successfully",
      doctorId: doctor.doctorId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * LOGIN DOCTOR
 * Required: doctorId, password
 */
router.post("/login-doctor", async (req, res) => {
  try {
    const { doctorId, password } = req.body;

    const doctor = await User.findOne({
      doctorId,
      role: "doctor",
    });

    if (!doctor) {
      return res.status(400).json({ message: "Doctor not found" });
    }

    if (password !== doctor.password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Doctor login successful",
      doctorId: doctor.doctorId,
      doctorName: doctor.name,
      email: doctor.email,
      contactNumber: doctor.contactNumber,
      role: "doctor",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
/**
 * GET appointments for a patient
 * /api/appointments/patient/:patientId
 */
router.get("/patient/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

    const appointments = await Appointment.find({ patientId });

    res.json({
      patientId,
      appointments,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * UPDATE patient profile
 */
router.put("/patient/profile/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    const { name, email, dateOfBirth } = req.body;

    const patient = await User.findByIdAndUpdate(
      patientId,
      { name, email, dateOfBirth },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({
      message: "Profile updated successfully",
      patient,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET patient profile
router.get("/patient/profile/:id", async (req, res) => {
  try {
    const patient = await User.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE patient profile
router.put("/patient/profile/:id", async (req, res) => {
  try {
    const { name, email, dateOfBirth } = req.body;

    await User.findByIdAndUpdate(req.params.id, {
      name,
      email,
      dateOfBirth,
    });

    res.json({ message: "Profile updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET doctor profile
router.get("/doctor/profile/:doctorId", async (req, res) => {
  try {
    const doctor = await User.findOne({
      doctorId: req.params.doctorId,
      role: "doctor",
    });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE doctor profile
router.put("/doctor/profile/:doctorId", async (req, res) => {
  try {
    const { name, email, contactNumber } = req.body;
    await User.findOneAndUpdate(
      { doctorId: req.params.doctorId, role: "doctor" },
      { name, email, contactNumber }
    );
    res.json({ message: "Profile updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all registered doctors for booking
router.get("/doctors", async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" }, "name doctorId email");
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
