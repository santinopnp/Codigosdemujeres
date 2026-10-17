"use strict";
const { query } = require("../db");

// ─── AI Generations ──────────────────────────────────────────────────────────

async function save({ prompt, tone, contentType, generatedText, postId = null }) {
  const { rows } = await query(
    `INSERT INTO ai_generations (prompt, tone, content_type, generated_text, post_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [prompt, tone, contentType, generatedText, postId]
  );
  return rows[0];
}

async function markAccepted(id, postId) {
  const { rows } = await query(
    `UPDATE ai_generations SET accepted = true, post_id = $2
     WHERE id = $1 RETURNING *`,
    [id, postId]
  );
  return rows[0] ?? null;
}

async function markRejected(id) {
  const { rows } = await query(
    `UPDATE ai_generations SET accepted = false
     WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0] ?? null;
}

async function getRecent({ contentType, limit = 20 } = {}) {
  const conditions = [];
  const values = [];

  if (contentType) {
    values.push(contentType);
    conditions.push(`content_type = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  values.push(limit);

  const { rows } = await query(
    `SELECT * FROM ai_generations ${where}
     ORDER BY created_at DESC
     LIMIT $${values.length}`,
    values
  );
  return rows;
}

module.exports = { save, markAccepted, markRejected, getRecent };
