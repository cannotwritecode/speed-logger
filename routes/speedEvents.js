const express = require("express");
const router = express.Router();
const SpeedEvent = require("../models/SpeedEvent");
const Joi = require("joi");

// Validation schema for speed events
const speedEventSchema = Joi.object({
  vehicle_id: Joi.string().max(50),
  speed: Joi.number().required(),
  speed_limit: Joi.number().required(),
  image_url: Joi.string().uri().max(255).allow(null, ""),
});

// POST - Create a new speed event (from Raspberry Pi)
router.post("/", async (req, res) => {
  try {
    // Validate request body
    const { error, value } = speedEventSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    // Add device_id from authenticated device
    value.device_id = req.device.id;

    // Create speed event
    const speedEvent = await SpeedEvent.create(value);

    res.status(201).json({
      success: true,
      message: "Speed event recorded successfully",
      data: speedEvent,
    });
  } catch (error) {
    console.error("Error creating speed event:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to record speed event" });
  }
});

// GET - Retrieve all speed events with filtering and pagination (for frontend)
router.get("/", async (req, res) => {
  try {
    // Parse query parameters
    const filters = {
      device_id: req.query.device_id,
      min_speed: req.query.min_speed ? parseFloat(req.query.min_speed) : null,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
    };

    // Remove null/undefined values
    Object.keys(filters).forEach((key) => {
      if (filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });

    // Parse pagination
    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    };

    // Get speed events
    const result = await SpeedEvent.getAll(filters, pagination);

    res.json({
      success: true,
      data: result.events,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching speed events:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch speed events" });
  }
});

// GET - Retrieve a specific speed event by ID
router.get("/:id", async (req, res) => {
  try {
    const speedEvent = await SpeedEvent.getById(req.params.id);

    if (!speedEvent) {
      return res
        .status(404)
        .json({ success: false, message: "Speed event not found" });
    }

    res.json({
      success: true,
      data: speedEvent,
    });
  } catch (error) {
    console.error("Error fetching speed event:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch speed event" });
  }
});

// PUT - Mark a speed event as processed
router.put("/:id/process", async (req, res) => {
  try {
    const speedEvent = await SpeedEvent.markAsProcessed(req.params.id);

    if (!speedEvent) {
      return res
        .status(404)
        .json({ success: false, message: "Speed event not found" });
    }

    res.json({
      success: true,
      message: "Speed event marked as processed",
      data: speedEvent,
    });
  } catch (error) {
    console.error("Error updating speed event:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update speed event" });
  }
});

module.exports = router;
