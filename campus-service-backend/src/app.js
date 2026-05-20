
const express = require("express");
const cors = require("cors");

// Route imports
const complaintRoutes = require("./routes/complaintRoutes");
const authRoutes = require("./routes/authRoutes");
const auditRoutes = require("./routes/auditRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Middleware imports
const errorHandler = require("./middlewares/errorHandler");
const requestLogger = require("./middlewares/requestLogger");
const corsConfig = require("./config/corsConfig");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const sanitizeMiddleware = require("./middlewares/sanitizer");

const app = express();

const normalizeMountPath = (value) => {
  const raw = String(value || "").trim();
  if (!raw || raw === "/") return "";
  return `/${raw.replace(/^\/+|\/+$/g, "")}`;
};

const appBasePath = normalizeMountPath(process.env.APP_BASE_PATH || "/apartment");

// ----------------------------------------
// Global Middlewares
// ----------------------------------------
app.use(helmet());
app.use(compression());
app.use(cors(corsConfig));
app.options("*", cors(corsConfig)); // Pre-flight requests

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // limit each IP to 300 reqs per window
    message: { message: "Too many requests, please try again later." },
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(mongoSanitize());
app.use(sanitizeMiddleware);
app.use(requestLogger);

// ----------------------------------------
// Public & Health Check Routes
// ----------------------------------------
app.get("/health", (req, res) => {
  res.json({ status: "Server running 🚀" });
});

if (appBasePath) {
  app.get(`${appBasePath}/health`, (req, res) => {
    res.json({ status: "Server running 🚀" });
  });
}

// ----------------------------------------
// API Routes
// ----------------------------------------
const apiRouter = express.Router();

// Mount the various resource routes
apiRouter.use("/auth", authRoutes);
apiRouter.use("/complaints", complaintRoutes);
apiRouter.use("/audit", auditRoutes);
apiRouter.use("/notifications", notificationRoutes);
apiRouter.use("/admin", adminRoutes);

// All API routes will be prefixed with /api
app.use("/api", apiRouter);
if (appBasePath) {
  app.use(`${appBasePath}/api`, apiRouter);
}

// ----------------------------------------
// Error Handling Middleware (must be last)
// ----------------------------------------
app.use(errorHandler);

module.exports = app;
