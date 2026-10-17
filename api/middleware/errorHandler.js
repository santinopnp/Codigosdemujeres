"use strict";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Structured error logging middleware.
 *
 * Mount as the LAST middleware in Express:
 *   app.use(errorHandler);
 *
 * Catches any unhandled errors thrown or passed via next(err),
 * logs them as structured JSON, and returns a clean response.
 */
function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;

  const logEntry = {
    timestamp: new Date().toISOString(),
    level: status >= 500 ? "error" : "warn",
    method: req.method,
    path: req.originalUrl || req.url,
    status,
    message: err.message || "Internal Server Error",
    requestId: req.headers["x-request-id"] || undefined,
  };

  // Include stack trace only in development
  if (!IS_PRODUCTION) {
    logEntry.stack = err.stack;
  }

  // Include request body context for non-GET errors (sanitized — no passwords)
  if (req.method !== "GET" && req.body && !IS_PRODUCTION) {
    const safeBody = Object.assign({}, req.body);
    // Strip sensitive fields
    delete safeBody.password;
    delete safeBody.token;
    delete safeBody.secret;
    delete safeBody.creditCard;
    logEntry.body = safeBody;
  }

  // Log as single structured JSON line for easy parsing by log aggregators
  console.error(JSON.stringify(logEntry));

  // ── Client response ──────────────────────────────────────────────────────
  const response = {
    error: IS_PRODUCTION && status >= 500
      ? "Internal Server Error"
      : err.message || "Internal Server Error",
  };

  // In dev, include extra debugging info
  if (!IS_PRODUCTION && status >= 500) {
    response.stack = err.stack;
  }

  res.status(status).json(response);
}

module.exports = errorHandler;
