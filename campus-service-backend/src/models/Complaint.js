const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    token: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
      index: true,
    },

    image: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["NEW", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CLOSED", "REJECTED"],
      default: "NEW",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    priorityManuallyOverridden: {
      type: Boolean,
      default: false,
    },

    category: {
      type: String,
      default: "general",
    },

    aiStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "SKIPPED"],
      default: "PENDING",
      index: true,
    },

    aiCategory: {
      type: String,
      default: null,
      index: true,
    },

    aiPriority: {
      type: String,
      default: null,
      index: true,
    },

    aiConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },

    aiTags: {
      type: [String],
      default: [],
    },

    aiSummary: {
      type: String,
      default: "",
    },

    aiSuggestedRouting: {
      type: String,
      default: "",
    },

    aiProcessedAt: {
      type: Date,
      default: null,
    },

    aiErrorCode: {
      type: String,
      default: "",
    },

    aiModel: {
      type: String,
      default: "",
    },

    aiLatencyMs: {
      type: Number,
      default: null,
    },

    aiAttempts: {
      type: Number,
      default: 0,
    },

    aiMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      select: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rejectReason: {
      type: String,
      default: "",
    },

    resolutionNote: {
      type: String,
      default: "",
    },

    assignedAt: {
      type: Date,
      default: null,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// indexes for performance
complaintSchema.index({ status: 1 });
complaintSchema.index({ assignedTo: 1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ aiCategory: 1, aiPriority: 1 });

module.exports = mongoose.model("Complaint", complaintSchema, "requests");
