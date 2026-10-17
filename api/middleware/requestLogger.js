"use strict";

/**
 * Request logger middleware.
 *
 * Logs each request as structured JSON with method, path, status, and response time.
 * Skips the /api/health endpoint to reduce noise from uptime monitors.
 *
 * Mount EARLY in the middleware chain:
 *   app.use(requestLogger);
 */
function requestLogger(req, res, next) {
  // Skip health checks — they fire every few seconds and pollute logs
  if (req.path === "/api/health") {
    return next();
  }

  const start = process.hrtime.bigint();

  // Hook into response finish to capture status and timing
  res.on("finish", () => {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationMs = (durationNs / 1e6).toFixed(2);

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      duration_ms: parseFloat(durationMs),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"] || undefined,
      requestId: req.headers["x-request-id"] || undefined,
    };

    // Use warn level for client errors, error for server errors
    if (res.statusCode >= 500) {
      logEntry.level = "error";
    } else if (res.statusCode >= 400) {
      logEntry.level = "warn";
    }

    console.log(JSON.stringify(logEntry));
  });

  next();
}

module.exports = requestLogger;
