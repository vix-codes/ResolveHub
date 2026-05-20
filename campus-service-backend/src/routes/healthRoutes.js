const express = require("express");
const mongoose = require("mongoose");
const { getAiRuntimeMetrics } = require("../services/ai/aiMetrics");

const router = express.Router();

const getMongoStatus = () => {
  const states = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  return states[mongoose.connection.readyState] || "unknown";
};

router.get("/", async (req, res) => {
  const mongoStatus = getMongoStatus();
  const healthy = mongoStatus === "connected";

  const payload = {
    status: healthy ? "ok" : "degraded",
    service: "resolvehub",
    version: process.env.npm_package_version || "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || "development",
    dependencies: {
      mongodb: { status: mongoStatus, healthy: mongoStatus === "connected" },
      ai: {
        provider: "gemini",
        configured: Boolean(process.env.GEMINI_API_KEY),
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      },
    },
  };

  res.status(healthy ? 200 : 503).json(payload);
});

router.get("/metrics", async (req, res) => {
  const memUsage = process.memoryUsage();
  const aiMetrics = getAiRuntimeMetrics();

  res.json({
    service: "resolvehub",
    timestamp: new Date().toISOString(),
    process: {
      uptime: Math.floor(process.uptime()),
      memoryMb: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      },
      pid: process.pid,
      nodeVersion: process.version,
    },
    database: {
      status: getMongoStatus(),
      name: mongoose.connection.name || "resolvehub",
    },
    ai: aiMetrics,
  });
});

module.exports = router;
