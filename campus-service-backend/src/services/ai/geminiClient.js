const logger = require("../../utils/logger");
const { complaintAiResponseSchema } = require("./complaintAiSchema");
const { validateComplaintAiOutput } = require("./complaintAiValidator");

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRIES = 2;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildPrompt = ({ title, description, category }) => `
You are an operations assistant for an apartment maintenance platform.
Classify the request for dispatch and safety triage.

Use only the provided schema and supported enum values.
Prefer safety escalation when the text mentions fire, smoke, gas, sparking, exposed wiring,
flooding, structural collapse, security breach, or immediate resident risk.

Tenant supplied category, if any: ${category || "not provided"}
Title: ${title}
Description: ${description}
`;

const extractText = (data) =>
  data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join("")
    .trim() || "";

const safeParseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text || "").match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Gemini response did not contain JSON");
    return JSON.parse(match[0]);
  }
};

const generateComplaintAnalysis = async (input, options = {}) => {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  const model = options.model || process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const timeoutMs = Number(options.timeoutMs || process.env.GEMINI_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const retries = Number(options.retries ?? process.env.GEMINI_RETRIES ?? DEFAULT_RETRIES);

  if (!apiKey) {
    const error = new Error("Gemini API key is not configured");
    error.code = "AI_CONFIG_MISSING";
    throw error;
  }

  const url = `${GEMINI_ENDPOINT}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: buildPrompt(input) }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: complaintAiResponseSchema,
      temperature: 0.1,
      maxOutputTokens: 1024,
    },
  };

  let lastError;
  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const startedAt = Date.now();
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const latencyMs = Date.now() - startedAt;
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const err = new Error(data?.error?.message || `Gemini request failed with ${response.status}`);
        err.code = `GEMINI_${response.status}`;
        err.retryable = response.status === 429 || response.status >= 500;
        throw err;
      }

      const text = extractText(data);
      const parsed = validateComplaintAiOutput(safeParseJson(text));

      return {
        ...parsed,
        model,
        latencyMs,
        raw: {
          finishReason: data?.candidates?.[0]?.finishReason || null,
          usageMetadata: data?.usageMetadata || null,
        },
      };
    } catch (error) {
      lastError = error;
      logger.warn("Gemini complaint analysis attempt failed", {
        attempt,
        code: error.code || error.name,
        message: error.message,
      });

      const retryable = error.name === "AbortError" || error.retryable;
      if (!retryable || attempt > retries) break;
      await sleep(250 * attempt);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
};

module.exports = {
  generateComplaintAnalysis,
};
