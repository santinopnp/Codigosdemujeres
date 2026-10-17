"use strict";
const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production";

const poolConfig = {
  connectionString: process.env.DATABASE_URL,

  // Pool sizing
  min: parseInt(process.env.PG_POOL_MIN, 10) || 2,
  max: parseInt(process.env.PG_POOL_MAX, 10) || 10,

  // Timeouts
  idleTimeoutMillis: 30_000,        // close idle clients after 30s
  connectionTimeoutMillis: 5_000,   // fail if connect takes > 5s
  allowExitOnIdle: false,           // keep pool alive
};

// SSL support for production (set DATABASE_SSL=true or use sslmode in URL)
// rejectUnauthorized: true is intentional — disabling it would nullify TLS protection
if (process.env.DATABASE_SSL === "true") {
  poolConfig.ssl = { rejectUnauthorized: true };
}

const pool = new Pool(poolConfig);

// ─── Connection error logging ────────────────────────────────────────────────
pool.on("error", (err, client) => {
  console.error("[pg] Unexpected idle-client error:", err.message);
});

pool.on("connect", () => {
  if (!isProduction) console.log("[pg] New client connected");
});

// ─── Core query function ─────────────────────────────────────────────────────
async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

// ─── Health check ────────────────────────────────────────────────────────────
async function healthCheck() {
  try {
    const { rows } = await pool.query("SELECT 1 AS ok, NOW() AS server_time");
    return {
      healthy: true,
      serverTime: rows[0].server_time,
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    };
  } catch (err) {
    return {
      healthy: false,
      error: err.message,
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    };
  }
}

// ─── Graceful shutdown ───────────────────────────────────────────────────────
function setupGracefulShutdown() {
  const shutdown = async (signal) => {
    console.log(`[pg] ${signal} received — draining pool...`);
    try {
      await pool.end();
      console.log("[pg] Pool drained, exiting.");
    } catch (err) {
      console.error("[pg] Error draining pool:", err.message);
    }
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

setupGracefulShutdown();

module.exports = { query, pool, healthCheck };
