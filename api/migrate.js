"use strict";
require("dotenv").config();

const fs   = require("fs");
const path = require("path");
const { pool } = require("./db");

async function migrate() {
  const migrationsDir = path.join(__dirname, "migrations");
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith(".sql"))
    .sort();

  const client = await pool.connect();
  try {
    // Track which migrations have already run
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        filename TEXT PRIMARY KEY,
        ran_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    for (const file of files) {
      const { rows } = await client.query(
        "SELECT 1 FROM _migrations WHERE filename = $1", [file]
      );
      if (rows.length > 0) {
        console.log(`[migrate] Skipping ${file} (already ran)`);
        continue;
      }

      console.log(`[migrate] Running ${file}…`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      await client.query(sql);
      await client.query("INSERT INTO _migrations (filename) VALUES ($1)", [file]);
      console.log(`[migrate] Done: ${file}`);
    }

    console.log("[migrate] All migrations complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("[migrate] FAILED:", err.message);
  process.exit(1);
});
