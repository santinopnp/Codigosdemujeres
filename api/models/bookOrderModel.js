"use strict";
const { query } = require("../db");
const siteConfig = require("../config/site");

const PRICES = siteConfig.formats;

const VALID_FORMATS  = new Set([
  "ebook", "audio", "bundle",
  "coaching_orient", "coaching_single", "coaching_pack", "coaching_monthly",
  "workbook", "masterclass",
]);
const VALID_METHODS  = new Set(["card"]);

function assertFormat(f) {
  if (!VALID_FORMATS.has(f)) throw new Error(`Invalid format: ${f}`);
}
function assertMethod(m) {
  if (!VALID_METHODS.has(m)) throw new Error(`Invalid payment method: ${m}`);
}

async function create({ email, format, paymentMethod, lang, utmSource, utmMedium, utmCampaign }) {
  assertFormat(format);
  assertMethod(paymentMethod);
  const amount = PRICES[format];
  const { rows } = await query(
    `INSERT INTO book_orders (email, format, amount_usd, payment_method, lang, utm_source, utm_medium, utm_campaign)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, email, format, download_token, amount_usd, status, lang`,
    [email.trim().toLowerCase(), format, amount, paymentMethod, lang || "es", utmSource || null, utmMedium || null, utmCampaign || null]
  );
  return rows[0];
}

async function findById(id) {
  const { rows } = await query(
    "SELECT * FROM book_orders WHERE id = $1",
    [id]
  );
  return rows[0] ?? null;
}

async function findByToken(token) {
  const { rows } = await query(
    "SELECT * FROM book_orders WHERE download_token = $1",
    [token]
  );
  return rows[0] ?? null;
}

async function markPaid(id, { providerRef, provider }) {
  const { rows } = await query(
    `UPDATE book_orders
     SET status = 'paid',
         paid_at = NOW(),
         download_expires_at = NULL,
         provider_ref = $2,
         payment_provider = $3
     WHERE id = $1 AND status != 'paid'
     RETURNING *`,
    [id, providerRef, provider]
  );
  return rows[0] ?? null;
}

async function markFailed(id) {
  await query(
    "UPDATE book_orders SET status = 'failed' WHERE id = $1",
    [id]
  );
}

async function listAll({ status, limit = 100, offset = 0 } = {}) {
  const conditions = [];
  const values     = [];
  if (status) { conditions.push(`status = $${values.push(status)}`); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await query(
    `SELECT id, email, format, amount_usd, payment_method, payment_provider,
            status, paid_at, created_at, provider_ref
     FROM book_orders
     ${where}
     ORDER BY created_at DESC
     LIMIT $${values.push(limit)} OFFSET $${values.push(offset)}`,
    values
  );
  return rows;
}

async function markRefunded(id) {
  const { rows } = await query(
    "UPDATE book_orders SET status = 'refunded' WHERE id = $1 AND status = 'paid' RETURNING id",
    [id]
  );
  return rows[0] ?? null;
}

async function revenue() {
  const { rows } = await query(
    "SELECT COALESCE(SUM(amount_usd), 0) AS total FROM book_orders WHERE status = 'paid'"
  );
  return Number(rows[0].total);
}

async function revenueByPeriod() {
  const { rows } = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN paid_at >= CURRENT_DATE THEN amount_usd END), 0) AS today,
       COALESCE(SUM(CASE WHEN paid_at >= DATE_TRUNC('week', CURRENT_DATE) THEN amount_usd END), 0) AS week,
       COALESCE(SUM(CASE WHEN paid_at >= DATE_TRUNC('month', CURRENT_DATE) THEN amount_usd END), 0) AS month,
       COALESCE(SUM(amount_usd), 0) AS total
     FROM book_orders WHERE status = 'paid'`
  );
  const r = rows[0];
  return { today: Number(r.today), week: Number(r.week), month: Number(r.month), total: Number(r.total) };
}

async function ordersByDay(days = 30) {
  const { rows } = await query(
    `SELECT DATE(created_at) AS date, COUNT(*)::int AS count,
            COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_usd END), 0) AS revenue
     FROM book_orders
     WHERE created_at >= NOW() - $1::int * INTERVAL '1 day'
     GROUP BY DATE(created_at)
     ORDER BY date`,
    [days]
  );
  return rows.map(r => ({ ...r, revenue: Number(r.revenue) }));
}

async function ordersByFormat() {
  const { rows } = await query(
    `SELECT format, COUNT(*)::int AS count,
            COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_usd END), 0) AS revenue
     FROM book_orders
     GROUP BY format
     ORDER BY count DESC`
  );
  return rows.map(r => ({ ...r, revenue: Number(r.revenue) }));
}

async function conversionFunnel() {
  const { rows } = await query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(CASE WHEN status = 'pending' THEN 1 END)::int AS pending,
       COUNT(CASE WHEN status = 'paid' THEN 1 END)::int AS paid,
       COUNT(CASE WHEN status = 'failed' THEN 1 END)::int AS failed,
       COUNT(CASE WHEN status = 'refunded' THEN 1 END)::int AS refunded
     FROM book_orders`
  );
  return rows[0];
}

async function recentOrders(limit = 5) {
  const { rows } = await query(
    `SELECT id, email, format, amount_usd, status, created_at
     FROM book_orders ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

async function getStats() {
  const { rows } = await query(
    `WITH revenue_periods AS (
       SELECT
         COALESCE(SUM(amount_usd), 0)                                                        AS total,
         COALESCE(SUM(CASE WHEN paid_at >= DATE_TRUNC('month', CURRENT_DATE) THEN amount_usd END), 0) AS this_month,
         COALESCE(SUM(CASE WHEN paid_at >= DATE_TRUNC('week',  CURRENT_DATE) THEN amount_usd END), 0) AS this_week,
         COALESCE(SUM(CASE WHEN paid_at >= CURRENT_DATE                      THEN amount_usd END), 0) AS today
       FROM book_orders
       WHERE status = 'paid'
     ),
     status_counts AS (
       SELECT
         COUNT(*)::int                                              AS total_orders,
         COUNT(CASE WHEN status = 'pending'  THEN 1 END)::int      AS pending,
         COUNT(CASE WHEN status = 'paid'     THEN 1 END)::int      AS paid,
         COUNT(CASE WHEN status = 'failed'   THEN 1 END)::int      AS failed,
         COUNT(CASE WHEN status = 'refunded' THEN 1 END)::int      AS refunded
       FROM book_orders
     ),
     avg_order AS (
       SELECT COALESCE(AVG(amount_usd), 0) AS avg_value
       FROM book_orders
       WHERE status = 'paid'
     ),
     best_format AS (
       SELECT format, COUNT(*)::int AS sold
       FROM book_orders
       WHERE status = 'paid'
       GROUP BY format
       ORDER BY sold DESC
       LIMIT 1
     ),
     trend AS (
       SELECT
         COALESCE(SUM(CASE WHEN paid_at >= CURRENT_DATE - INTERVAL '7 days'  THEN amount_usd END), 0) AS last_7,
         COALESCE(SUM(CASE WHEN paid_at >= CURRENT_DATE - INTERVAL '14 days'
                             AND paid_at <  CURRENT_DATE - INTERVAL '7 days'  THEN amount_usd END), 0) AS prev_7
       FROM book_orders
       WHERE status = 'paid'
     )
     SELECT
       rp.total        AS revenue_total,
       rp.this_month   AS revenue_month,
       rp.this_week    AS revenue_week,
       rp.today        AS revenue_today,
       sc.total_orders,
       sc.pending,
       sc.paid,
       sc.failed,
       sc.refunded,
       ROUND(ao.avg_value, 2) AS avg_order_value,
       bf.format       AS best_format,
       bf.sold         AS best_format_sold,
       t.last_7        AS trend_last_7,
       t.prev_7        AS trend_prev_7,
       CASE
         WHEN t.prev_7 = 0 AND t.last_7 > 0 THEN 100.0
         WHEN t.prev_7 = 0 THEN 0.0
         ELSE ROUND(((t.last_7 - t.prev_7) / t.prev_7) * 100, 1)
       END             AS trend_pct_change
     FROM revenue_periods rp
     CROSS JOIN status_counts sc
     CROSS JOIN avg_order ao
     CROSS JOIN trend t
     LEFT JOIN best_format bf ON true`
  );

  const r = rows[0];
  return {
    revenue: {
      total: Number(r.revenue_total),
      thisMonth: Number(r.revenue_month),
      thisWeek: Number(r.revenue_week),
      today: Number(r.revenue_today),
    },
    orders: {
      total: r.total_orders,
      pending: r.pending,
      paid: r.paid,
      failed: r.failed,
      refunded: r.refunded,
    },
    avgOrderValue: Number(r.avg_order_value),
    bestSellingFormat: r.best_format || null,
    bestSellingFormatCount: r.best_format_sold || 0,
    trend: {
      last7Days: Number(r.trend_last_7),
      previous7Days: Number(r.trend_prev_7),
      percentChange: Number(r.trend_pct_change),
    },
  };
}

module.exports = {
  create, findById, findByToken,
  markPaid, markFailed, markRefunded, listAll, revenue, PRICES,
  revenueByPeriod, ordersByDay, ordersByFormat, conversionFunnel, recentOrders, getStats,
};
