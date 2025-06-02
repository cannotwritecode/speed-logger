// routes/speedEvents.js - Enhanced version with additional endpoints
const express = require("express");
const router = express.Router();
const SpeedEvent = require("../models/SpeedEvent");
const Joi = require("joi");

// Validation schemas
const speedEventSchema = Joi.object({
  vehicle_id: Joi.string().max(50),
  speed: Joi.number().min(0).required(),
  speed_limit: Joi.number().min(0).required(),
  image_url: Joi.string().uri().max(255).allow(null, ""),
});

const filtersSchema = Joi.object({
  device_id: Joi.string().max(50),
  min_speed: Joi.number().min(0),
  date_from: Joi.date().iso(),
  date_to: Joi.date().iso().min(Joi.ref("date_from")),
  processed: Joi.boolean(),
  violations_only: Joi.boolean(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// POST - Create a new speed event (from Raspberry Pi)
router.post("/", async (req, res) => {
  try {
    const { error, value } = speedEventSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    value.device_id = req.device?.id || req.body.device_id;

    const speedEvent = await SpeedEvent.create(value);

    res.status(201).json({
      success: true,
      message: "Speed event recorded successfully",
      data: speedEvent,
    });
  } catch (error) {
    console.error("Error creating speed event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record speed event",
    });
  }
});

// GET - Retrieve all speed events with filtering and pagination
router.get("/", async (req, res) => {
  try {
    const { error, value } = filtersSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { page, limit, ...filters } = value;

    // Remove undefined values
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const result = await SpeedEvent.getAll(filters, { page, limit });

    res.json({
      success: true,
      data: result.events,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching speed events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch speed events",
    });
  }
});

// GET - NEW: Speed distribution endpoint (your original request)
router.get("/distribution", async (req, res) => {
  try {
    const { device_id, date_from, date_to, interval = "hour" } = req.query;

    if (!device_id || !date_from || !date_to) {
      return res.status(400).json({
        success: false,
        message: "device_id, date_from, and date_to are required",
      });
    }

    const filters = { device_id, date_from, date_to };
    const distribution = await SpeedEvent.getSpeedDistribution(
      filters,
      interval
    );

    res.json({
      success: true,
      data: distribution,
      meta: {
        device_id,
        date_from,
        date_to,
        interval,
        total_periods: distribution.length,
      },
    });
  } catch (error) {
    console.error("Error fetching speed distribution:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching speed distribution",
    });
  }
});

// GET - Statistics endpoint (existing but enhanced)
router.get("/stats", async (req, res) => {
  try {
    const filters = {
      device_id: req.query.device_id,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
    };

    Object.keys(filters).forEach((key) => {
      if (filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });

    const stats = await SpeedEvent.getStats(filters);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching speed event stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch speed event statistics",
    });
  }
});

// GET - Recent events endpoint (existing but enhanced)
router.get("/recent", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const device_id = req.query.device_id;
    const violations_only = req.query.violations_only === "true";

    const filters = {};
    if (device_id) filters.device_id = device_id;
    if (violations_only) filters.violations_only = true;

    const result = await SpeedEvent.getRecent(filters, limit);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching recent speed events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent speed events",
    });
  }
});

// GET - Retrieve a specific speed event by ID
router.get("/:id", async (req, res) => {
  try {
    const speedEvent = await SpeedEvent.getById(req.params.id);

    if (!speedEvent) {
      return res.status(404).json({
        success: false,
        message: "Speed event not found",
      });
    }

    res.json({
      success: true,
      data: speedEvent,
    });
  } catch (error) {
    console.error("Error fetching speed event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch speed event",
    });
  }
});

// PUT - Mark a speed event as processed
router.put("/:id/process", async (req, res) => {
  try {
    const speedEvent = await SpeedEvent.markAsProcessed(req.params.id);

    if (!speedEvent) {
      return res.status(404).json({
        success: false,
        message: "Speed event not found",
      });
    }

    res.json({
      success: true,
      message: "Speed event marked as processed",
      data: speedEvent,
    });
  } catch (error) {
    console.error("Error updating speed event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update speed event",
    });
  }
});

// PUT - NEW: Bulk mark as processed
router.put("/bulk/process", async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "ids array is required and cannot be empty",
      });
    }

    const processedIds = await SpeedEvent.bulkMarkAsProcessed(ids);

    res.json({
      success: true,
      message: `${processedIds.length} speed events marked as processed`,
      data: { processed_ids: processedIds },
    });
  } catch (error) {
    console.error("Error bulk updating speed events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk update speed events",
    });
  }
});

module.exports = router;
