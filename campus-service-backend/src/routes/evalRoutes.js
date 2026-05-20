const express = require("express");
const { generateComplaintAnalysis } = require("../services/ai/geminiClient");
const { recordAiProcessing } = require("../services/ai/aiMetrics");
const logger = require("../utils/logger");

const router = express.Router();

const verifyEvalSecret = (req, res, next) => {
  const secret = process.env.EVAL_SERVICE_SECRET;
  if (!secret) return next();
  const provided = req.headers["x-eval-secret"] || req.headers["x-service-secret"];
  if (provided !== secret) {
    return res.status(401).json({ error: "Unauthorized: invalid eval service secret" });
  }
  next();
};

router.post("/categorize", verifyEvalSecret, async (req, res) => {
  const { text, title, description } = req.body || {};

  const complaintText = text || description || "";
  const complaintTitle = title || complaintText.slice(0, 80);

  if (!complaintText.trim()) {
    return res.status(400).json({ error: "text or description is required" });
  }

  const startedAt = Date.now();

  try {
    const analysis = await generateComplaintAnalysis({
      title: complaintTitle,
      description: complaintText,
      category: null,
    });

    const latencyMs = Date.now() - startedAt;
    recordAiProcessing({ status: "success", latencyMs: analysis.latencyMs });

    return res.json({
      category: analysis.category,
      priority: analysis.priority,
      confidence: analysis.confidence,
      tags: analysis.tags,
      summary: analysis.summary,
      model: analysis.model,
      latencyMs: analysis.latencyMs,
      provider: "gemini",
    });
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    recordAiProcessing({
      status: error?.code === "AI_CONFIG_MISSING" ? "fallback" : "failure",
      latencyMs,
    });

    logger.error("Eval categorize failed", {
      code: error?.code,
      message: error?.message,
      latencyMs,
    });

    if (error?.code === "AI_CONFIG_MISSING") {
      return res.status(503).json({
        error: "AI service not configured",
        code: "AI_CONFIG_MISSING",
        latencyMs,
      });
    }

    return res.status(502).json({
      error: "AI categorization failed",
      code: error?.code || "AI_ERROR",
      latencyMs,
    });
  }
});

module.exports = router;
