require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const speedEventsRoutes = require("./routes/speedEvents");
const devicesRoutes = require("./routes/devices");
const settingsRoutes = require("./routes/settings");
const { authenticateAdmin } = require("./middleware/auth");

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS for React frontend
app.use(express.json()); // Parse JSON request body

// Routes
app.use("/api/speedEvents", authenticateAdmin, speedEventsRoutes);
app.use("/api/devices", authenticateAdmin, devicesRoutes);
app.use("/api/settings", authenticateAdmin, settingsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "An error occurred",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
