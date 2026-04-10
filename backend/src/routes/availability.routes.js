const express = require("express");
const DoctorAvailability = require("../models/DoctorAvailability");

const router = express.Router();

/**
 * GET available slots for a doctor on a date
 * /api/availability/:doctorId/:date
 */
router.get("/:doctorId/:date", async (req, res) => {
  try {
    const { doctorId, date } = req.params;

    const availability = await DoctorAvailability.findOne({
      doctorId,
      date,
    });

    if (!availability) {
      return res.status(404).json({
        message: "No availability found",
        slots: [],
      });
    }

    res.json({
      doctorId,
      date,
      slots: availability.slots,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
