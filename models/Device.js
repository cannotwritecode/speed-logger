const jwt = require("jsonwebtoken");
const db = require("../db/config");
const crypto = require("crypto");

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

const create = async (data) => {
  if (!data) {
    throw new Error("Data object is required to create a device");
  }

  const { device_id, name, location = null } = data;

  // Additional validation
  if (!device_id || !name) {
    throw new Error("device_id and name are required fields");
  }

  // Generate a secure API key
  const apiKey = crypto.randomBytes(24).toString("hex");

  try {
    const query = `
      INSERT INTO devices 
      (device_id, name, api_key, location)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [device_id, name, apiKey, location];
    const { rows } = await db.query(query, values);

    return rows[0];
  } catch (error) {
    throw error;
  }
};

const getAll = async () => {
  try {
    const query = `
      SELECT id, device_id, name, location, status, 
             created_at, updated_at
      FROM devices
      ORDER BY name ASC
    `;

    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error fetches all devices:", error);
    throw error;
  }
};

const getById = async (id) => {
  try {
    const query = `
    SELECT id, device_id, name, location, status,
          created_at, updated_at
    FROM devices
    WHERE id=${id} LIMIT 1;
    `;
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error fetches all devices:", error);
    throw error;
  }
};

const update = async (id, updateData) => {
  const { name, location, status } = updateData;
  try {
    const query = `
      UPDATE devices
      SET name = $1, location = $2, status = $3
      WHERE id = $4
      RETURNING *;
    `;
    const values = [name, location, status, id];
    const { rows } = await db.query(query, values);
    return rows[0]; // return the updated row
  } catch (error) {
    console.error(`Error in Device.update for ID ${id}:`, error);
    throw error; // Re-throw the error to be handled upstream
  }
};

const regenerateApiKey = async (id) => {
  const newApiKey = crypto.randomBytes(32).toString("hex"); // generate a 64-character hex string
  try {
    const query = `
        UPDATE devices
        SET api_key = $1
        WHERE id = $2
        RETURNING id AS device_id, api_key;
      `;
    const values = [newApiKey, id];
    const { rows } = await db.query(query, values);
    return rows[0]; // null if no row matched
  } catch (error) {
    console.error(`Error in Device.regenerateApiKey for ID ${id}:`, error);
    throw error;
  }
};

module.exports = {
  authenticateDevice,
  create,
  getAll,
  getById,
  update,
  regenerateApiKey,
};
