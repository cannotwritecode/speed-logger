const jwt = require("jsonwebtoken");
const db = require("../db/config");

// Middleware to authenticate devices using API key
async function authenticateDevice(req, res, next) {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res
        .status(401)
        .json({ success: false, message: "API key required" });
    }

    // Check if API key exists
    const { rows } = await db.query(
      "SELECT id, device_id FROM devices WHERE api_key = $1 AND status = $2",
      [apiKey, "active"]
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid API key" });
    }

    // Add device info to request
    req.device = rows[0];
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ success: false, message: "Authentication error" });
  }
}

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

function authenticateAdmin(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== ADMIN_API_KEY) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  next();
}

module.exports = { authenticateDevice, authenticateAdmin };
