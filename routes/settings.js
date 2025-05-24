const express = require("express");
const router = express.Router();
const Setting = require("../models/Setting");
const Joi = require("joi");

// Validation schema for settings
const settingSchema = Joi.object({
  key: Joi.string().max(50).required(),
  value: Joi.string().required(),
});

// GET - Get all global settings
router.get("/", async (req, res) => {
  try {
    const settings = await Setting.getAll();

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch settings" });
  }
});

// GET - Get a specific setting
router.get("/:key", async (req, res) => {
  try {
    const value = await Setting.get(req.params.key);

    if (value === null) {
      return res
        .status(404)
        .json({ success: false, message: "Setting not found" });
    }

    res.json({
      success: true,
      data: {
        key: req.params.key,
        value,
      },
    });
  } catch (error) {
    console.error("Error fetching setting:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch setting" });
  }
});

// POST - Create or update a global setting
router.post("/", async (req, res) => {
  try {
    // Validate request body
    const { error, value } = settingSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    // Set setting
    const setting = await Setting.set(value.key, value.value);

    res.status(201).json({
      success: true,
      message: "Setting saved successfully",
      data: setting,
    });
  } catch (error) {
    console.error("Error saving setting:", error);
    res.status(500).json({ success: false, message: "Failed to save setting" });
  }
});

// DELETE - Delete a global setting
router.delete("/:key", async (req, res) => {
  try {
    const setting = await Setting.delete(req.params.key);

    if (!setting) {
      return res
        .status(404)
        .json({ success: false, message: "Setting not found" });
    }

    res.json({
      success: true,
      message: "Setting deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting setting:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete setting" });
  }
});

// --- Device-specific settings ---

// GET - Get all settings for a device
router.get("/device/:deviceId", async (req, res) => {
  try {
    const settings = await Setting.getAll(req.params.deviceId);

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching device settings:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch device settings" });
  }
});

// GET - Get a specific setting for a device by key
router.get("/device/:deviceId/:key", async (req, res) => {
  try {
    const value = await Setting.get(req.params.key, req.params.deviceId);

    if (value === null) {
      return res
        .status(404)
        .json({ success: false, message: "Setting not found" });
    }

    res.json({
      success: true,
      data: {
        key: req.params.key,
        value,
        device_id: req.params.deviceId,
      },
    });
  } catch (error) {
    console.error("Error fetching device setting:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch device setting" });
  }
});

// POST - Create or update a device setting
router.post("/device/:deviceId", async (req, res) => {
  try {
    // Validate request body
    const { error, value } = settingSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    // Set setting for device
    const setting = await Setting.set(
      value.key,
      value.value,
      req.params.deviceId
    );

    res.status(201).json({
      success: true,
      message: "Device setting saved successfully",
      data: setting,
    });
  } catch (error) {
    console.error("Error saving device setting:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to save device setting" });
  }
});

router.delete("/device/:deviceId/:key", async (req, res) => {
  try {
    const setting = await Setting.delete(req.params.key, req.params.deviceId);

    if (!setting) {
      return res
        .status(404)
        .json({ success: false, message: "Setting not found" });
    }

    res.json({
      success: true,
      message: "Device setting saved successfully",
      data: setting,
    });
  } catch (error) {
    console.error("Error deleting device setting:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete device setting" });
  }
});

module.exports = router;
