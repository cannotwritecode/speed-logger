const jwt = require("jsonwebtoken");
const db = require("../db/config");
const crypto = require("crypto");

// Middleware to authenticate devices using API key

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
      SELECT device_id, name, location, status, 
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
      SELECT device_id, name, location, status,
             created_at, updated_at
      FROM devices
      WHERE device_id = $1
      LIMIT 1;
    `;
    const result = await db.query(query, [id]);
    return result.rows[0]; // Also return the first row, not an array
  } catch (error) {
    console.error("Error fetching device by ID:", error);
    throw error;
  }
};

const update = async (id, updateData) => {
  const { name, location, status } = updateData;
  try {
    const query = `
      UPDATE devices
      SET name = $1, location = $2, status = $3
      WHERE device_id = $4
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

module.exports = {
  create,
  getAll,
  getById,
  update,
};
