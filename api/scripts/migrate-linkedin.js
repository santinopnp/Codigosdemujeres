#!/usr/bin/env node
"use strict";

/**
 * Migration: add LinkedIn columns to blog_posts
 * Run once on the server:  node api/scripts/migrate-linkedin.js
 */

const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`
      ALTER TABLE blog_posts
        ADD COLUMN IF NOT EXISTS publish_to_li BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS li_post_id    TEXT;
    `);

    await client.query("COMMIT");
    console.log("Migration complete: publish_to_li + li_post_id added to blog_posts");
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
