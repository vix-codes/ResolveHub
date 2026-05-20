const AI_CATEGORIES = Object.freeze([
  "PLUMBING",
  "ELECTRICAL",
  "SECURITY",
  "CLEANING",
  "INTERNET",
  "HVAC",
  "STRUCTURAL",
  "GENERAL",
]);

const AI_PRIORITIES = Object.freeze(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

const CATEGORY_ROUTING = Object.freeze({
  PLUMBING: "Route to plumbing maintenance or facilities technician",
  ELECTRICAL: "Route to licensed electrical technician immediately",
  SECURITY: "Route to security operations or building management",
  CLEANING: "Route to housekeeping or sanitation team",
  INTERNET: "Route to network support or ISP escalation",
  HVAC: "Route to HVAC technician",
  STRUCTURAL: "Route to facilities engineer or structural contractor",
  GENERAL: "Route to property management triage",
});

module.exports = {
  AI_CATEGORIES,
  AI_PRIORITIES,
  CATEGORY_ROUTING,
};
