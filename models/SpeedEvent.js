// models/SpeedEvent.js - Enhanced version with additional methods
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
      conditions.push(`created_at >= $${idx++}`);
      values.push(filters.date_from);
    }

    if (filters.date_to) {
      conditions.push(`created_at <= $${idx++}`);
      values.push(filters.date_to);
    }

    // Add processed filter
    if (filters.processed !== undefined) {
      conditions.push(`processed = $${idx++}`);
      values.push(filters.processed);
    }

    // Add speeding violations filter
    if (filters.violations_only) {
      conditions.push(`speed > speed_limit`);
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
      SELECT *, 
        (speed - speed_limit) as speed_excess,
        CASE 
          WHEN speed > speed_limit THEN true 
          ELSE false 
        END as is_violation
      FROM speed_events
      ${whereClause}
      ORDER BY created_at DESC
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
    const query = `
      SELECT *, 
        (speed - speed_limit) as speed_excess,
        CASE 
          WHEN speed > speed_limit THEN true 
          ELSE false 
        END as is_violation
      FROM speed_events 
      WHERE id = $1;
    `;
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

  // NEW: Get speed distribution by hour/day - This was your original request
  getSpeedDistribution: async (filters, interval = "hour") => {
    try {
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      if (filters.device_id) {
        whereConditions.push(`device_id = $${paramIndex++}`);
        queryParams.push(filters.device_id);
      }

      if (filters.date_from) {
        whereConditions.push(`created_at >= $${paramIndex++}`);
        queryParams.push(filters.date_from);
      }

      if (filters.date_to) {
        whereConditions.push(`created_at <= $${paramIndex++}`);
        queryParams.push(filters.date_to);
      }

      const whereClause = whereConditions.length
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

      const truncateFunction = interval === "day" ? "day" : "hour";

      const query = `
        SELECT 
          DATE_TRUNC('${truncateFunction}', created_at) as time_period, 
          COUNT(*) as count,
          AVG(speed) as avg_speed,
          MAX(speed) as max_speed,
          COUNT(CASE WHEN speed > speed_limit THEN 1 END) as violations
        FROM speed_events
        ${whereClause}
        GROUP BY time_period 
        ORDER BY time_period;
      `;

      const { rows } = await db.query(query, queryParams);
      return rows;
    } catch (error) {
      console.error("Error getting speed distribution:", error);
      throw error;
    }
  },

  // Enhanced stats method
  getStats: async (filters = {}) => {
    try {
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      if (filters.device_id) {
        whereConditions.push(`device_id = $${paramIndex++}`);
        queryParams.push(filters.device_id);
      }

      if (filters.date_from) {
        whereConditions.push(`created_at >= $${paramIndex++}`);
        queryParams.push(filters.date_from);
      }

      if (filters.date_to) {
        whereConditions.push(`created_at <= $${paramIndex++}`);
        queryParams.push(filters.date_to);
      }

      const whereClause = whereConditions.length
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

      const statsQuery = `
        SELECT 
          COUNT(*) as total_events,
          COUNT(CASE WHEN processed = false THEN 1 END) as unprocessed_events,
          COUNT(CASE WHEN speed > speed_limit THEN 1 END) as speeding_violations,
          AVG(speed) as avg_speed,
          MAX(speed) as max_speed,
          MIN(speed) as min_speed,
          AVG(speed_limit) as avg_speed_limit,
          AVG(speed - speed_limit) as avg_speed_excess,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY speed) as median_speed,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY speed) as p95_speed
        FROM speed_events 
        ${whereClause}
      `;

      const distributionQuery = `
        SELECT 
          CASE 
            WHEN speed - speed_limit <= 0 THEN 'within_limit'
            WHEN speed - speed_limit <= 10 THEN 'minor_violation'
            WHEN speed - speed_limit <= 20 THEN 'moderate_violation'
            ELSE 'severe_violation'
          END as violation_category,
          COUNT(*) as count,
          ROUND(AVG(speed - speed_limit), 2) as avg_excess
        FROM speed_events 
        ${whereClause}
        GROUP BY violation_category
        ORDER BY 
          CASE violation_category 
            WHEN 'within_limit' THEN 1
            WHEN 'minor_violation' THEN 2
            WHEN 'moderate_violation' THEN 3
            WHEN 'severe_violation' THEN 4
          END
      `;

      const trendQuery = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as events_count,
          AVG(speed) as avg_speed,
          COUNT(CASE WHEN speed > speed_limit THEN 1 END) as violations_count
        FROM speed_events 
        ${whereClause ? whereClause + " AND" : "WHERE"} 
          created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;

      const deviceStatsQuery = `
        SELECT 
          device_id,
          COUNT(*) as event_count,
          AVG(speed) as avg_speed,
          MAX(speed) as max_speed,
          COUNT(CASE WHEN speed > speed_limit THEN 1 END) as violations,
          ROUND((COUNT(CASE WHEN speed > speed_limit THEN 1 END)::float / COUNT(*) * 100), 2) as violation_rate
        FROM speed_events 
        ${whereClause}
        GROUP BY device_id
        ORDER BY event_count DESC
      `;

      const [statsResult, distributionResult, trendResult, deviceStatsResult] =
        await Promise.all([
          db.query(statsQuery, queryParams),
          db.query(distributionQuery, queryParams),
          db.query(trendQuery, queryParams),
          db.query(deviceStatsQuery, queryParams),
        ]);

      const stats = statsResult.rows[0];

      const formattedStats = {
        total_events: parseInt(stats.total_events),
        unprocessed_events: parseInt(stats.unprocessed_events),
        speeding_violations: parseInt(stats.speeding_violations),
        avg_speed: parseFloat(stats.avg_speed) || 0,
        max_speed: parseFloat(stats.max_speed) || 0,
        min_speed: parseFloat(stats.min_speed) || 0,
        median_speed: parseFloat(stats.median_speed) || 0,
        p95_speed: parseFloat(stats.p95_speed) || 0,
        avg_speed_limit: parseFloat(stats.avg_speed_limit) || 0,
        avg_speed_excess: parseFloat(stats.avg_speed_excess) || 0,
        violation_rate:
          stats.total_events > 0
            ? ((stats.speeding_violations / stats.total_events) * 100).toFixed(
                2
              )
            : 0,
      };

      return {
        overview: formattedStats,
        distribution: distributionResult.rows,
        trend: trendResult.rows,
        by_device: deviceStatsResult.rows,
      };
    } catch (error) {
      console.error("Error getting speed event stats:", error);
      throw error;
    }
  },

  // Enhanced recent events
  getRecent: async (filters = {}, limit = 10) => {
    try {
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      if (filters.device_id) {
        whereConditions.push(`device_id = $${paramIndex++}`);
        queryParams.push(filters.device_id);
      }

      if (filters.violations_only) {
        whereConditions.push(`speed > speed_limit`);
      }

      const whereClause = whereConditions.length
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

      queryParams.push(limit);

      const query = `
        SELECT 
          id,
          device_id,
          vehicle_id,
          speed,
          speed_limit,
          (speed - speed_limit) as speed_excess,
          image_url,
          processed,
          created_at,
          CASE 
            WHEN speed > speed_limit THEN true 
            ELSE false 
          END as is_violation
        FROM speed_events 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT $${paramIndex}
      `;

      const result = await db.query(query, queryParams);
      return result.rows;
    } catch (error) {
      console.error("Error getting recent speed events:", error);
      throw error;
    }
  },

  // NEW: Bulk operations
  bulkMarkAsProcessed: async (ids) => {
    try {
      const query = `
        UPDATE speed_events
        SET processed = true
        WHERE id = ANY($1)
        RETURNING id;
      `;
      const { rows } = await db.query(query, [ids]);
      return rows.map((row) => row.id);
    } catch (error) {
      console.error("Error bulk marking events as processed:", error);
      throw error;
    }
  },

  // NEW: Delete old events (for data retention)
  deleteOldEvents: async (daysOld = 90) => {
    try {
      const query = `
        DELETE FROM speed_events
        WHERE created_at < NOW() - INTERVAL '${daysOld} days'
        RETURNING COUNT(*);
      `;
      const { rows } = await db.query(query);
      return rows[0].count;
    } catch (error) {
      console.error("Error deleting old events:", error);
      throw error;
    }
  },
};

module.exports = SpeedEvent;
