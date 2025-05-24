const jwt = require("jsonwebtoken");
const db = require("../db/config");

const SpeedEvent = {
  // Create a new speed event
  create: async (data) => {
    const { device_id, vehicle_id, speed, speed_limit, image_url } = data;

    const query = `
      INSERT INTO speed_events (
        device_id, vehicle_id, speed, speed_limit, image_url
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [
      device_id,
      vehicle_id || null,
      speed,
      speed_limit,
      image_url || null,
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  // Get all speed events with optional filters and pagination
  getAll: async (filters, pagination) => {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (filters.device_id) {
      conditions.push(`device_id = $${idx++}`);
      values.push(filters.device_id);
    }

    if (filters.min_speed) {
      conditions.push(`speed >= $${idx++}`);
      values.push(filters.min_speed);
    }

    if (filters.date_from) {
      conditions.push(`timestamp >= $${idx++}`);
      values.push(filters.date_from);
    }

    if (filters.date_to) {
      conditions.push(`timestamp <= $${idx++}`);
      values.push(filters.date_to);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const limit = pagination.limit;
    const offset = (pagination.page - 1) * limit;

    // Save count of filter parameters before adding pagination values
    const filterParamCount = values.length;

    // Add limit and offset
    values.push(limit, offset);

    const query = `
      SELECT * FROM speed_events
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${idx++} OFFSET $${idx++};
    `;

    const { rows } = await db.query(query, values);

    // Count query only uses filter parameters
    const countQuery = `SELECT COUNT(*) FROM speed_events ${whereClause};`;
    const countResult = await db.query(
      countQuery,
      values.slice(0, filterParamCount)
    );
    const total = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(total / limit);

    return {
      events: rows,
      pagination: {
        total,
        page: pagination.page,
        totalPages,
        limit,
      },
    };
  },

  // Get a speed event by ID
  getById: async (id) => {
    const query = `SELECT * FROM speed_events WHERE id = $1;`;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },

  // Mark a speed event as processed
  markAsProcessed: async (id) => {
    const query = `
      UPDATE speed_events
      SET processed = true
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },
};

module.exports = SpeedEvent;
