"use strict";
const { query } = require("../db");

const VALID_FORMATS = new Set(["ebook", "audio"]);

function assertFormat(f) {
  if (!VALID_FORMATS.has(f)) throw new Error(`Invalid chapter format: ${f}`);
}

/**
 * List all chapters for a given format, ordered by chapter_number.
 */
async function listByFormat(format) {
  assertFormat(format);
  const { rows } = await query(
    `SELECT id, format, chapter_number, title_es, title_en,
            body_es, body_en, audio_url, duration_seconds, created_at
     FROM book_chapters
     WHERE format = $1
     ORDER BY chapter_number ASC`,
    [format]
  );
  return rows;
}

/**
 * Fetch a single chapter by format + chapter_number.
 */
async function getChapter(format, chapterNumber) {
  assertFormat(format);
  const { rows } = await query(
    `SELECT id, format, chapter_number, title_es, title_en,
            body_es, body_en, audio_url, duration_seconds, created_at
     FROM book_chapters
     WHERE format = $1 AND chapter_number = $2`,
    [format, chapterNumber]
  );
  return rows[0] ?? null;
}

/**
 * UPSERT a chapter. On conflict of (format, chapter_number), updates all fields.
 */
async function create({ format, chapterNumber, titleEs, titleEn, bodyEs, bodyEn, audioUrl, durationSeconds }) {
  assertFormat(format);
  const { rows } = await query(
    `INSERT INTO book_chapters (format, chapter_number, title_es, title_en, body_es, body_en, audio_url, duration_seconds)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (format, chapter_number) DO UPDATE SET
       title_es          = EXCLUDED.title_es,
       title_en          = EXCLUDED.title_en,
       body_es           = EXCLUDED.body_es,
       body_en           = EXCLUDED.body_en,
       audio_url         = EXCLUDED.audio_url,
       duration_seconds  = EXCLUDED.duration_seconds
     RETURNING *`,
    [format, chapterNumber, titleEs, titleEn || null, bodyEs || null, bodyEn || null, audioUrl || null, durationSeconds || null]
  );
  return rows[0];
}

/**
 * Update specific allowed fields on a chapter by id.
 */
async function update(id, fields) {
  const ALLOWED = new Set(["title_es", "title_en", "body_es", "body_en", "audio_url", "duration_seconds"]);
  const setClauses = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(fields)) {
    if (!ALLOWED.has(key)) continue;
    setClauses.push(`${key} = $${idx}`);
    values.push(value);
    idx++;
  }

  if (setClauses.length === 0) throw new Error("No valid fields to update");

  values.push(id);
  const { rows } = await query(
    `UPDATE book_chapters SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

/**
 * Delete a chapter by id.
 */
async function del(id) {
  const { rows } = await query(
    "DELETE FROM book_chapters WHERE id = $1 RETURNING id",
    [id]
  );
  return rows[0] ?? null;
}

/**
 * Count chapters grouped by format. Returns { ebook: N, audio: N }.
 */
async function countByFormat() {
  const { rows } = await query(
    `SELECT format, COUNT(*)::int AS count
     FROM book_chapters
     GROUP BY format`
  );
  const result = { ebook: 0, audio: 0 };
  for (const row of rows) {
    result[row.format] = row.count;
  }
  return result;
}

/**
 * List all chapters across all formats, ordered by format then chapter_number.
 */
async function listAll() {
  const { rows } = await query(
    `SELECT id, format, chapter_number, title_es, title_en,
            audio_url, duration_seconds, created_at
     FROM book_chapters
     ORDER BY format ASC, chapter_number ASC`
  );
  return rows;
}

module.exports = {
  listByFormat,
  listAll,
  getChapter,
  create,
  update,
  delete: del,
  countByFormat,
};
