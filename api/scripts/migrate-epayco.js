#!/usr/bin/env node
"use strict";

/**
 * Migration: add ePayco columns to book_orders + lang column
 * Run once on server:  node api/scripts/migrate-epayco.js
 */

const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`
      ALTER TABLE book_orders
        ADD COLUMN IF NOT EXISTS lang                  VARCHAR(5)   NOT NULL DEFAULT 'es',
        ADD COLUMN IF NOT EXISTS epayco_customer_id    TEXT,
        ADD COLUMN IF NOT EXISTS epayco_ref            TEXT,
        ADD COLUMN IF NOT EXISTS epayco_transaction_id TEXT,
        ADD COLUMN IF NOT EXISTS epayco_estado         TEXT,
        ADD COLUMN IF NOT EXISTS amount_cop            INTEGER;
    `);

    // Index to look up orders by epayco_ref in webhook handler
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_book_orders_epayco_ref
        ON book_orders (epayco_ref)
        WHERE epayco_ref IS NOT NULL;
    `);

    await client.query("COMMIT");
    console.log("Migration complete: ePayco columns added to book_orders");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
