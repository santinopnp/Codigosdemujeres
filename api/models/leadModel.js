"use strict";
const { query } = require("../db");

// ─── Upsert / create lead ─────────────────────────────────────────────────────
// newsletter_opt_in: OR logic — once true, stays true (sticky consent).
// Returns the full lead row.
async function upsert({ email, lang = "es", source = "landing", utmSource, utmMedium, utmCampaign, newsletterOptIn = false, firstName, phone }) {
  const { rows } = await query(
    `INSERT INTO leads (email, lang, source, utm_source, utm_medium, utm_campaign, newsletter_opt_in, first_name, phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (email) DO UPDATE SET
       newsletter_opt_in = leads.newsletter_opt_in OR $7,
       first_name = COALESCE($8, leads.first_name),
       phone      = COALESCE($9, leads.phone)
     RETURNING id, email, lang, first_name, phone, newsletter_opt_in, email_sequence_step, last_emailed_at, unsubscribed_at`,
    [email.trim().toLowerCase(), lang, source, utmSource || null, utmMedium || null, utmCampaign || null, Boolean(newsletterOptIn), firstName || null, phone || null]
  );
  return rows[0] ?? null;
}

// ─── Lookup ───────────────────────────────────────────────────────────────────
async function findByEmail(email) {
  const { rows } = await query(
    `SELECT id, email, lang, first_name, phone, newsletter_opt_in, email_sequence_step, last_emailed_at, unsubscribed_at, open_count, click_count, created_at
     FROM leads WHERE email = $1`,
    [email.trim().toLowerCase()]
  );
  return rows[0] ?? null;
}

// ─── Mark welcome email sent (step 0 → last_emailed_at set) ──────────────────
async function markWelcomeSent(id) {
  await query(
    `UPDATE leads SET last_emailed_at = NOW() WHERE id = $1`,
    [id]
  );
}

// ─── Mark a drip step as sent, advance sequence counter ──────────────────────
async function markEmailSent(id, step) {
  await query(
    `UPDATE leads SET email_sequence_step = $2, last_emailed_at = NOW() WHERE id = $1`,
    [id, step]
  );
}

// ─── Unsubscribe ──────────────────────────────────────────────────────────────
async function markUnsubscribed(email) {
  const { rows } = await query(
    `UPDATE leads SET unsubscribed_at = NOW(), newsletter_opt_in = false
     WHERE email = $1 AND unsubscribed_at IS NULL
     RETURNING id`,
    [email.trim().toLowerCase()]
  );
  return rows[0] ?? null;
}

// ─── Mark as converted (bought the book) ─────────────────────────────────────
async function markConverted(email) {
  await query(
    `UPDATE leads SET email_sequence_step = 99, converted_at = NOW() WHERE email = $1`,
    [email.trim().toLowerCase()]
  );
}

// ─── Engagement tracking ──────────────────────────────────────────────────────
async function trackOpen(leadId) {
  await query(
    `UPDATE leads SET open_count = open_count + 1 WHERE id = $1`,
    [leadId]
  );
}

async function trackClick(leadId) {
  await query(
    `UPDATE leads SET click_count = click_count + 1 WHERE id = $1`,
    [leadId]
  );
}

// ─── Drip scheduler queries ───────────────────────────────────────────────────
// Returns leads that are subscribed, not unsubscribed, at the given step,
// and whose last_emailed_at is at least minDays ago (or null → never emailed yet).
async function getLeadsDueForDrip(currentStep, minDaysAfterLast) {
  const { rows } = await query(
    `SELECT id, email, lang
     FROM leads
     WHERE newsletter_opt_in  = true
       AND unsubscribed_at    IS NULL
       AND email_sequence_step = $1
       AND last_emailed_at    IS NOT NULL
       AND last_emailed_at    < NOW() - $2::int * INTERVAL '1 day'`,
    [currentStep, parseInt(minDaysAfterLast, 10)]
  );
  return rows;
}

// ─── Admin list ───────────────────────────────────────────────────────────────
async function listAll({ limit = 500, offset = 0, source } = {}) {
  const params = [limit, offset];
  const where = source ? `WHERE source = $3` : "";
  if (source) params.push(source);
  const { rows } = await query(
    `SELECT id, email, first_name, phone, lang, source, utm_source, utm_medium, utm_campaign,
            newsletter_opt_in, email_sequence_step, last_emailed_at,
            unsubscribed_at, open_count, click_count, converted_at, created_at
     FROM leads
     ${where}
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    params
  );
  return rows;
}

async function listNewsletterSubscribers() {
  const { rows } = await query(
    `SELECT id, email, lang, open_count, click_count, email_sequence_step, created_at
     FROM leads
     WHERE newsletter_opt_in = true
       AND unsubscribed_at IS NULL
     ORDER BY created_at DESC`
  );
  return rows;
}

// ─── Stats ────────────────────────────────────────────────────────────────────
async function totalCount() {
  const { rows } = await query("SELECT COUNT(*)::int AS total FROM leads");
  return rows[0].total;
}

async function countByDay(days = 30) {
  const { rows } = await query(
    `SELECT DATE(created_at) AS date, COUNT(*)::int AS count
     FROM leads
     WHERE created_at >= NOW() - $1::int * INTERVAL '1 day'
     GROUP BY DATE(created_at)
     ORDER BY date`,
    [days]
  );
  return rows;
}

module.exports = {
  upsert,
  findByEmail,
  markWelcomeSent,
  markEmailSent,
  markUnsubscribed,
  markConverted,
  trackOpen,
  trackClick,
  getLeadsDueForDrip,
  listAll,
  listNewsletterSubscribers,
  totalCount,
  countByDay,
};
