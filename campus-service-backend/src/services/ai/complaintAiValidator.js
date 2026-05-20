const {
  AI_CATEGORIES,
  AI_PRIORITIES,
} = require("../../config/ai/complaintTaxonomy");

const clampConfidence = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return Math.min(1, Math.max(0, n));
};

const normalizeToken = (value) => String(value || "").trim().toUpperCase();

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) =>
      String(tag || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "")
    )
    .filter(Boolean)
    .slice(0, 8);
};

const validateComplaintAiOutput = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("AI response must be a JSON object");
  }

  const category = normalizeToken(payload.category);
  const priority = normalizeToken(payload.priority);
  const confidence = clampConfidence(payload.confidence);
  const summary = String(payload.summary || "").trim();
  const tags = normalizeTags(payload.tags);

  if (!AI_CATEGORIES.includes(category)) {
    throw new Error(`Unsupported AI category: ${payload.category}`);
  }

  if (!AI_PRIORITIES.includes(priority)) {
    throw new Error(`Unsupported AI priority: ${payload.priority}`);
  }

  if (confidence === null) {
    throw new Error("AI confidence must be a number");
  }

  if (!summary || summary.length > 320) {
    throw new Error("AI summary must be present and under 320 characters");
  }

  return {
    category,
    priority,
    confidence,
    tags,
    summary,
  };
};

module.exports = {
  validateComplaintAiOutput,
};
