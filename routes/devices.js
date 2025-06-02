const express = require("express");
const router = express.Router();
const Device = require("../models/Device");
const Joi = require("joi");

// Validation schemas
const deviceSchema = Joi.object({
  device_id: Joi.string().max(50).required(),
  name: Joi.string().max(100).required(),
  location: Joi.string().max(255).allow(null, ""),
});

const updateDeviceSchema = Joi.object({
  name: Joi.string().max(100),
  location: Joi.string().max(255).allow(null, ""),
  status: Joi.string().valid("active", "inactive"),
});

// GET - List all devices
router.get("/", async (req, res) => {
  try {
    const devices = await Device.getAll();

    res.json({
      success: true,
      data: devices,
    });
  } catch (error) {
    console.error("Error fetching devices:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch devices" });
  }
});

// GET - Get device by ID
router.get("/:id", async (req, res) => {
  try {
    const device = await Device.getById(req.params.id);

    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: "Device not found" });
    }

    res.json({
      success: true,
      data: device,
    });
  } catch (error) {
    console.error("Error fetching device:", error);
    res.status(500).json({ success: false, message: "Failed to fetch device" });
  }
});

// POST - Create a new device
router.post("/", async (req, res) => {
  try {
    // Debug: Log what we're receiving
    console.log("Raw request body:", req.body);
    console.log("Request headers:", req.headers);
    console.log("Content-Type:", req.get("Content-Type"));

    // Validate request body
    const { error, value } = deviceSchema.validate(req.body);
    console.log(error, value);

    if (error) {
      console.log("Validation error:", error.details);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        received_data: req.body, // This will show what was actually received
      });
    }

    // Create device
    const device = await Device.create(value);

    res.status(201).json({
      success: true,
      message: "Device created successfully",
      data: device,
    });
  } catch (error) {
    console.error("Error creating device:", error);

    if (error.code === "23505") {
      return res
        .status(409)
        .json({ success: false, message: "Device ID already exists" });
    }

    res
      .status(500)
      .json({ success: false, message: "Failed to create device" });
  }
});

// PUT - Update device
router.put("/:id", async (req, res) => {
  try {
    // Validate request body
    const { error, value } = updateDeviceSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    // Update device
    const deviceExist = await Device.getById(req.params.id);
    if (!deviceExist) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Device you are trying to update does not exist",
        });
    }

    const device = await Device.update(req.params.id, value);

    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: "Device not found" });
    }

    res.json({
      success: true,
      message: "Device updated successfully",
      data: device,
    });
  } catch (error) {
    console.error("Error updating device:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update device" });
  }
});

module.exports = router;
