const express = require("express");
const User = require("../models/User");

const router = express.Router();

// GET ALL DOCTORS
router.get("/", async (req, res) => {
  try {
    const doctors = await User.find(
      { role: "doctor" },
      { doctorId: 1, doctorName: 1, _id: 0 }
    );

    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
