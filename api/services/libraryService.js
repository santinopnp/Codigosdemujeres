"use strict";
const orderModel   = require("../models/bookOrderModel");
const chapterModel = require("../models/chapterModel");
const { query }    = require("../db");

// Maps purchased format to which content formats the buyer can access
const FORMAT_ACCESS = {
  ebook:  ["ebook"],
  audio:  ["audio"],
  bundle: ["ebook", "audio"],
};

// ─── Access validation ──────────────────────────────────────────────────────

/**
 * Validate a download token and return the order + allowed formats.
 * Throws descriptive errors on failure.
 */
async function validateAccess(token) {
  if (!token || typeof token !== "string") {
    const err = new Error("Token is required");
    err.status = 400;
    throw err;
  }

  const order = await orderModel.findByToken(token);

  if (!order) {
    const err = new Error("not_found");
    err.status = 404;
    throw err;
  }

  if (order.status !== "paid") {
    const err = new Error("not_paid");
    err.status = 402;
    throw err;
  }

  const allowedFormats = FORMAT_ACCESS[order.format];
  if (!allowedFormats) {
    const err = new Error("Unknown order format");
    err.status = 500;
    throw err;
  }

  return { order, allowedFormats };
}

// ─── Chapter content delivery ───────────────────────────────────────────────

/**
 * Fetch a chapter's ebook content for a token holder.
 * Watermarks the HTML body with the buyer's email for traceability.
 */
async function getChapterContent(token, chapterNumber, lang) {
  const { order, allowedFormats } = await validateAccess(token);

  if (!allowedFormats.includes("ebook")) {
    const err = new Error("Your purchase does not include ebook access");
    err.status = 403;
    throw err;
  }

  const chapter = await chapterModel.getChapter("ebook", chapterNumber);
  if (!chapter) {
    const err = new Error("Chapter not found");
    err.status = 404;
    throw err;
  }

  // Select language-appropriate fields (es / en / it — fallback chain: it→en→es)
  const isIt = lang === "it";
  const isEn = lang === "en";
  const title = isIt
    ? (chapter.title_it || chapter.title_en || chapter.title_es)
    : isEn
      ? (chapter.title_en || chapter.title_es)
      : chapter.title_es;
  const rawBody = (isIt
    ? (chapter.body_it || chapter.body_en || chapter.body_es)
    : isEn
      ? (chapter.body_en || chapter.body_es)
      : chapter.body_es) || "";

  // Watermark the body with buyer's email
  const body = injectWatermark(rawBody, order.email);

  // Get total chapter count for navigation
  const counts = await chapterModel.countByFormat();

  return {
    chapter_number: chapter.chapter_number,
    title,
    body,
    totalChapters: counts.ebook,
  };
}

// ─── Watermark injection ────────────────────────────────────────────────────

/**
 * Inject an invisible watermark into HTML content.
 * The buyer's email is repeated diagonally across the content area,
 * making screenshots traceable to the specific purchaser.
 */
function injectWatermark(html, email) {
  if (!html || !email) return html;

  // Create multiple repetitions of the email for full coverage
  const repeatedEmail = Array(12).fill(email).join("  \u00B7  ");

  // Build multiple watermark lines at different vertical positions
  const lines = [];
  for (let i = 0; i < 8; i++) {
    lines.push(
      `<div style="position:absolute;top:${i * 12.5}%;left:-10%;` +
      `width:140%;white-space:nowrap;` +
      `color:rgba(0,0,0,0.03);font-size:11px;font-family:monospace;` +
      `transform:rotate(-30deg);transform-origin:center center;` +
      `pointer-events:none;user-select:none;z-index:1;` +
      `line-height:1;">${repeatedEmail}</div>`
    );
  }

  const watermarkOverlay =
    `<div style="position:absolute;top:0;left:0;width:100%;height:100%;` +
    `overflow:hidden;pointer-events:none;user-select:none;z-index:1;">` +
    lines.join("") +
    `</div>`;

  // Wrap content in a relative container with watermark overlay
  return `<div style="position:relative;">${html}${watermarkOverlay}</div>`;
}

// ─── Reading progress ───────────────────────────────────────────────────────

/**
 * Get all reading progress entries for an order (all formats).
 */
async function getProgress(orderId) {
  const { rows } = await query(
    `SELECT format, chapter_number, position, updated_at
     FROM reading_progress
     WHERE order_id = $1`,
    [orderId]
  );
  return rows;
}

/**
 * Save (upsert) reading progress.
 * Validates that format is a positive integer chapter and an allowed format for this order.
 */
async function saveProgress(orderId, format, chapterNumber, position, allowedFormats) {
  if (allowedFormats && !allowedFormats.includes(format)) {
    const err = new Error("format_not_allowed");
    err.status = 403;
    throw err;
  }
  if (!Number.isInteger(chapterNumber) || chapterNumber < 1) {
    const err = new Error("invalid_chapter_number");
    err.status = 400;
    throw err;
  }
  const safePosition = typeof position === "number" && isFinite(position) ? Math.max(0, position) : 0;
  const { rows } = await query(
    `INSERT INTO reading_progress (order_id, format, chapter_number, position, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (order_id, format) DO UPDATE SET
       chapter_number = EXCLUDED.chapter_number,
       position       = EXCLUDED.position,
       updated_at     = NOW()
     RETURNING chapter_number, position, updated_at`,
    [orderId, format, chapterNumber, safePosition]
  );
  return rows[0];
}

module.exports = {
  validateAccess,
  getChapterContent,
  injectWatermark,
  getProgress,
  saveProgress,
};
