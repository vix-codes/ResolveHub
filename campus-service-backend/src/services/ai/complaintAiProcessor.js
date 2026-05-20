const Complaint = require("../../models/Complaint");
const logger = require("../../utils/logger");
const { CATEGORY_ROUTING } = require("../../config/ai/complaintTaxonomy");
const { generateComplaintAnalysis } = require("./geminiClient");
const { recordAiProcessing } = require("./aiMetrics");

const toManualPriority = (aiPriority) => String(aiPriority || "MEDIUM").toLowerCase();

const buildScoringInput = (complaint) => ({
  complaintId: String(complaint._id),
  token: complaint.token,
  title: complaint.title,
  description: complaint.description,
  suppliedCategory: complaint.category,
  createdAt: complaint.createdAt,
});

const buildScoringOutput = (analysis) => ({
  category: analysis.category,
  priority: analysis.priority,
  confidence: analysis.confidence,
  tags: analysis.tags,
  summary: analysis.summary,
});

const markAiPending = async (complaintId) =>
  Complaint.findByIdAndUpdate(complaintId, {
    aiStatus: "PENDING",
    aiErrorCode: "",
  });

const applyAiAnalysis = async (complaintId, analysis) => {
  const update = {
    aiStatus: "COMPLETED",
    aiCategory: analysis.category,
    aiPriority: analysis.priority,
    aiConfidence: analysis.confidence,
    aiTags: analysis.tags,
    aiSummary: analysis.summary,
    aiSuggestedRouting: CATEGORY_ROUTING[analysis.category],
    aiProcessedAt: new Date(),
    aiErrorCode: "",
    aiModel: analysis.model,
    aiLatencyMs: analysis.latencyMs,
    aiAttempts: { $inc: 1 },
    aiMetadata: {
      provider: "gemini",
      model: analysis.model,
      finishReason: analysis.raw?.finishReason || null,
      usageMetadata: analysis.raw?.usageMetadata || null,
      scoring: {
        output: buildScoringOutput(analysis),
      },
    },
  };

  const complaint = await Complaint.findById(complaintId);
  if (!complaint) return null;

  Object.entries(update).forEach(([key, value]) => {
    if (key !== "aiAttempts") complaint[key] = value;
  });
  complaint.aiAttempts = Number(complaint.aiAttempts || 0) + 1;

  if (!complaint.priorityManuallyOverridden) {
    complaint.priority = toManualPriority(analysis.priority);
  }

  return complaint.save();
};

const markAiFailed = async (complaintId, error, latencyMs) => {
  await Complaint.findByIdAndUpdate(complaintId, {
    $set: {
      aiStatus: error?.code === "AI_CONFIG_MISSING" ? "SKIPPED" : "FAILED",
      aiErrorCode: error?.code || error?.name || "AI_PROCESSING_FAILED",
      aiProcessedAt: new Date(),
      aiLatencyMs: latencyMs,
      aiMetadata: {
        provider: "gemini",
        errorCode: error?.code || error?.name || "AI_PROCESSING_FAILED",
        scoring: { output: null },
      },
    },
    $inc: { aiAttempts: 1 },
  });
};

const processComplaintAi = async (complaintOrId) => {
  const startedAt = Date.now();
  const complaint =
    typeof complaintOrId === "object"
      ? complaintOrId
      : await Complaint.findById(complaintOrId);

  if (!complaint) return null;

  await markAiPending(complaint._id);

  try {
    const scoringInput = buildScoringInput(complaint);
    const analysis = await generateComplaintAnalysis(scoringInput);
    analysis.raw = {
      ...analysis.raw,
      scoringInput: {
        complaintId: scoringInput.complaintId,
        token: scoringInput.token,
        suppliedCategory: scoringInput.suppliedCategory,
      },
    };

    const updated = await applyAiAnalysis(complaint._id, analysis);
    recordAiProcessing({ status: "success", latencyMs: analysis.latencyMs });
    logger.info("AI complaint analysis completed", {
      complaintId: String(complaint._id),
      token: complaint.token,
      category: analysis.category,
      priority: analysis.priority,
      confidence: analysis.confidence,
      latencyMs: analysis.latencyMs,
    });
    return updated;
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    await markAiFailed(complaint._id, error, latencyMs);
    recordAiProcessing({
      status: error?.code === "AI_CONFIG_MISSING" ? "fallback" : "failure",
      latencyMs,
    });
    logger.error("AI complaint analysis failed", {
      complaintId: String(complaint._id),
      token: complaint.token,
      code: error?.code || error?.name,
      message: error.message,
      latencyMs,
    });
    return null;
  }
};

const enqueueComplaintAiProcessing = (complaint) => {
  setImmediate(() => {
    processComplaintAi(complaint).catch((error) => {
      logger.error("AI complaint background processor crashed", {
        complaintId: String(complaint?._id || ""),
        message: error.message,
      });
    });
  });
};

module.exports = {
  buildScoringInput,
  buildScoringOutput,
  enqueueComplaintAiProcessing,
  processComplaintAi,
};
