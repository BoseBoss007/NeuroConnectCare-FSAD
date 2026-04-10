require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const appointmentRoutes = require("./routes/appointment.routes");
const resultRoutes = require("./routes/results.routes");
const availabilityRoutes = require("./routes/availability.routes");
const doctorRoutes = require("./routes/doctor.routes");
const flRoutes = require("./routes/fl.routes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// 🔗 ROUTE MOUNTS (VERY IMPORTANT)
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/fl", flRoutes);

// Multer / file upload errors
app.use((err, req, res, next) => {
  if (err && err.message) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});
// Health check
app.get("/", (req, res) => {
  res.send("NeuroCare Connect Backend Running");
});

module.exports = app;
