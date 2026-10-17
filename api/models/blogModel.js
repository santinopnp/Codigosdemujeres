"use strict";
const { query } = require("../db");

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ─── Blog Posts ───────────────────────────────────────────────────────────────
async function listPosts({ publishedOnly = true, postType, limit = 50, offset = 0 } = {}) {
  const conditions = [];
  const values = [];
  if (publishedOnly) conditions.push("published = true");
  if (postType) { values.push(postType); conditions.push(`post_type = $${values.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  values.push(limit, offset);
  const { rows } = await query(
    `SELECT id, slug, title_es, title_en, title_it, excerpt_es, excerpt_en, excerpt_it,
            image_url, read_min, published, published_at, fb_post_id, ig_post_id,
            post_type, hashtags, created_at
     FROM blog_posts ${where}
     ORDER BY published_at DESC NULLS LAST, created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return rows;
}

async function getPost(slug) {
  const { rows } = await query(
    "SELECT * FROM blog_posts WHERE slug = $1",
    [slug]
  );
  return rows[0] ?? null;
}

async function getPostById(id) {
  const { rows } = await query("SELECT * FROM blog_posts WHERE id = $1", [id]);
  return rows[0] ?? null;
}

async function createPost({ title_es, title_en = "", excerpt_es = "", excerpt_en = "",
                             body_es = "", body_en = "", image_url = null, read_min = 3,
                             post_type = "article", hashtags = "", published = false,
                             scheduled_at = null, publish_to_ig = false, publish_to_fb = false,
                             publish_to_li = false,
                             tone = "casual", content_type = "social", campaign_id = null,
                             ai_generated = false }) {
  const baseSlug = slugify(title_es || "social-post");
  // Ensure unique slug
  let slug = baseSlug;
  let attempt = 0;
  while (true) {
    const { rows } = await query("SELECT 1 FROM blog_posts WHERE slug = $1", [slug]);
    if (rows.length === 0) break;
    attempt++;
    if (attempt > 50) throw new Error(`Could not generate unique slug for "${baseSlug}" after 50 attempts`);
    slug = `${baseSlug}-${attempt}`;
  }

  const { rows } = await query(
    `INSERT INTO blog_posts (slug, title_es, title_en, excerpt_es, excerpt_en,
                             body_es, body_en, image_url, read_min, post_type, hashtags,
                             published, published_at,
                             scheduled_at, publish_to_ig, publish_to_fb, publish_to_li,
                             tone, content_type, campaign_id, ai_generated)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
     RETURNING *`,
    [slug, title_es, title_en, excerpt_es, excerpt_en, body_es, body_en, image_url, read_min,
     post_type, hashtags, published, published ? new Date() : null,
     scheduled_at, publish_to_ig, publish_to_fb, publish_to_li, tone, content_type, campaign_id, ai_generated]
  );
  return rows[0];
}

async function updatePost(id, fields) {
  const allowed = ["title_es","title_en","excerpt_es","excerpt_en",
                   "body_es","body_en","image_url","read_min","published",
                   "fb_post_id","ig_post_id","li_post_id","post_type","hashtags",
                   "scheduled_at","publish_to_ig","publish_to_fb","publish_to_li",
                   "tone","content_type","campaign_id","ai_generated"];
  const keys   = Object.keys(fields).filter(k => allowed.includes(k));
  if (keys.length === 0) return getPostById(id);

  const sets   = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  const values = keys.map(k => fields[k]);

  // Auto-set published_at when first publishing
  let extraSet = "";
  if (fields.published === true) {
    extraSet = ", published_at = COALESCE(published_at, NOW())";
  }

  const { rows } = await query(
    `UPDATE blog_posts SET ${sets}${extraSet} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return rows[0] ?? null;
}

async function deletePost(id) {
  await query("DELETE FROM blog_posts WHERE id = $1", [id]);
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
async function listTestimonials({ activeOnly = true } = {}) {
  const where = activeOnly ? "WHERE active = true" : "";
  const { rows } = await query(
    `SELECT * FROM testimonials ${where} ORDER BY sort_order ASC, created_at ASC`
  );
  return rows;
}

async function createTestimonial({ author, location = "", text_es, text_en = "", stars = 5, sort_order = 0 }) {
  const { rows } = await query(
    `INSERT INTO testimonials (author, location, text_es, text_en, stars, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [author, location, text_es, text_en, stars, sort_order]
  );
  return rows[0];
}

async function updateTestimonial(id, fields) {
  const allowed = ["author","location","text_es","text_en","stars","sort_order","active"];
  const keys    = Object.keys(fields).filter(k => allowed.includes(k));
  if (keys.length === 0) return;
  const sets   = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  const values = keys.map(k => fields[k]);
  const { rows } = await query(
    `UPDATE testimonials SET ${sets} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return rows[0] ?? null;
}

async function deleteTestimonial(id) {
  await query("DELETE FROM testimonials WHERE id = $1", [id]);
}

async function listScheduled() {
  const { rows } = await query(
    `SELECT id, slug, title_es, title_en, excerpt_es, excerpt_en,
            image_url, scheduled_at, publish_to_ig, publish_to_fb, publish_to_li,
            tone, content_type, campaign_id, ai_generated, created_at
     FROM blog_posts
     WHERE scheduled_at IS NOT NULL AND published = false
     ORDER BY scheduled_at ASC`
  );
  return rows;
}

module.exports = {
  listPosts, getPost, getPostById, createPost, updatePost, deletePost,
  listScheduled,
  listTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
};
