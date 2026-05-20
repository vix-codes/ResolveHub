const {
  AI_CATEGORIES,
  AI_PRIORITIES,
} = require("../../config/ai/complaintTaxonomy");

const complaintAiResponseSchema = {
  type: "object",
  propertyOrdering: ["category", "priority", "confidence", "tags", "summary"],
  properties: {
    category: {
      type: "string",
      enum: AI_CATEGORIES,
    },
    priority: {
      type: "string",
      enum: AI_PRIORITIES,
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
    },
    tags: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 8,
    },
    summary: {
      type: "string",
      maxLength: 320,
    },
  },
  required: ["category", "priority", "confidence", "tags", "summary"],
};

module.exports = {
  complaintAiResponseSchema,
};
