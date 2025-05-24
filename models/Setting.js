const db = require("../db/config");

class Setting {
  static async get(key, deviceId = null) {
    try {
      let query;
      let values;

      if (deviceId) {
        // Get device-specific setting or fall back to global setting
        query = `
          SELECT value
          FROM settings
          WHERE (device_id = $1 AND key = $2)
          OR (device_id IS NULL AND key = $2)
          ORDER BY device_id NULLS LAST
          LIMIT 1
        `;
        values = [deviceId, key];
      } else {
        // Get global setting
        query = `
          SELECT value
          FROM settings
          WHERE device_id IS NULL AND key = $1
        `;
        values = [key];
      }

      const { rows } = await db.query(query, values);
      return rows.length > 0 ? rows[0].value : null;
    } catch (error) {
      throw error;
    }
  }

  static async getAll(deviceId = null) {
    try {
      let query;
      let values;

      if (deviceId) {
        // Get all settings for a specific device + global settings
        query = `
          WITH device_settings AS (
            SELECT key, value, device_id FROM settings WHERE device_id = $1
          ),
          global_settings AS (
            SELECT key, value, device_id FROM settings WHERE device_id IS NULL
          )
          SELECT 
            COALESCE(d.key, g.key) as key,
            COALESCE(d.value, g.value) as value,
            CASE WHEN d.key IS NOT NULL THEN true ELSE false END as is_custom
          FROM global_settings g
          FULL OUTER JOIN device_settings d ON g.key = d.key
        `;
        values = [deviceId];
      } else {
        // Get all global settings
        query = `
          SELECT key, value
          FROM settings
          WHERE device_id IS NULL
          ORDER BY key
        `;
        values = [];
      }

      const { rows } = await db.query(query, values);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async set(key, value, deviceId = null) {
    try {
      // Use upsert (insert or update)
      const query = `
        INSERT INTO settings (device_id, key, value)
        VALUES ($1, $2, $3)
        ON CONFLICT (device_id, key) 
        DO UPDATE SET value = $3, updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      const values = [deviceId, key, value];
      const { rows } = await db.query(query, values);

      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async delete(key, deviceId = null) {
    try {
      const query = `
        DELETE FROM settings
        WHERE key = $1 AND device_id ${deviceId ? "= $2" : "IS NULL"}
        RETURNING *
      `;

      const values = deviceId ? [key, deviceId] : [key];
      const { rows } = await db.query(query, values);

      return rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Setting;
