"use strict";
const { query } = require("../db");

// ─── Campaigns CRUD ──────────────────────────────────────────────────────────

async function create({ name, description = null, startDate = null, endDate = null }) {
  const { rows } = await query(
    `INSERT INTO campaigns (name, description, start_date, end_date)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, description, startDate, endDate]
  );
  return rows[0];
}

async function update(id, fields) {
  const allowed = ["name", "description", "status", "start_date", "end_date"];
  const keys = Object.keys(fields).filter(k => allowed.includes(k));
  if (keys.length === 0) return getById(id);

  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  const values = keys.map(k => fields[k]);

  const { rows } = await query(
    `UPDATE campaigns SET ${sets} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return rows[0] ?? null;
}

async function list({ status } = {}) {
  const conditions = [];
  const values = [];

  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await query(
    `SELECT * FROM campaigns ${where} ORDER BY created_at DESC`,
    values
  );
  return rows;
}

async function getById(id) {
  const { rows } = await query("SELECT * FROM campaigns WHERE id = $1", [id]);
  return rows[0] ?? null;
}

async function getWithPosts(id) {
  const campaign = await getById(id);
  if (!campaign) return null;

  const { rows: posts } = await query(
    `SELECT id, slug, title_es, title_en, excerpt_es, excerpt_en,
            image_url, published, published_at, scheduled_at,
            content_type, tone, publish_to_ig, publish_to_fb,
            ai_generated, created_at
     FROM blog_posts
     WHERE campaign_id = $1
     ORDER BY scheduled_at ASC NULLS LAST, created_at DESC`,
    [id]
  );

  return { ...campaign, posts };
}

async function remove(id) {
  // Unset campaign_id on related posts first
  await query("UPDATE blog_posts SET campaign_id = NULL WHERE campaign_id = $1", [id]);
  await query("DELETE FROM campaigns WHERE id = $1", [id]);
}

module.exports = { create, update, list, getById, getWithPosts, delete: remove };
