const express = require("express");
const router = express.Router();

const auth = require("../middlewares/authMiddleware");
const { getAdminAnalytics, getAiAnalytics } = require("../controllers/analyticsController");
const { getAiRuntimeMetrics } = require("../services/ai/aiMetrics");

// Standard analytics
router.get("/analytics", auth, getAdminAnalytics);

// AI-powered analytics — category distribution, confidence, critical trends
router.get("/analytics/ai", auth, getAiAnalytics);

// AI runtime metrics for DockOps monitoring (latency, failure rate, throughput)
router.get("/ai/metrics", auth, (req, res) => {
  if (!["admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({ message: "Admin/Manager only" });
  }
  return res.json({ success: true, data: getAiRuntimeMetrics() });
});

module.exports = router;
