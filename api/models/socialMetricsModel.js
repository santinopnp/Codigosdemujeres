"use strict";
const { query } = require("../db");

// ─── Social Metrics ──────────────────────────────────────────────────────────

async function saveSnapshot({ postId, platform, likes = 0, comments = 0, shares = 0, reach = 0, impressions = 0 }) {
  const engagementRate = reach > 0
    ? Math.round(((likes + comments + shares) / reach) * 100 * 100) / 100
    : 0;

  const { rows } = await query(
    `INSERT INTO social_metrics (post_id, platform, likes, comments, shares, reach, impressions, engagement_rate)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [postId, platform, likes, comments, shares, reach, impressions, engagementRate]
  );
  return rows[0];
}

async function getPostMetrics(postId) {
  const { rows } = await query(
    `SELECT DISTINCT ON (platform)
            id, post_id, platform, likes, comments, shares,
            reach, impressions, engagement_rate, fetched_at
     FROM social_metrics
     WHERE post_id = $1
     ORDER BY platform, fetched_at DESC`,
    [postId]
  );
  return rows;
}

async function getOverview({ days = 30 } = {}) {
  const { rows } = await query(
    `SELECT
       COUNT(DISTINCT post_id)::int              AS total_posts,
       COUNT(*)::int                              AS total_snapshots,
       COALESCE(SUM(likes), 0)::int              AS total_likes,
       COALESCE(SUM(comments), 0)::int           AS total_comments,
       COALESCE(SUM(shares), 0)::int             AS total_shares,
       COALESCE(SUM(reach), 0)::int              AS total_reach,
       COALESCE(SUM(impressions), 0)::int        AS total_impressions,
       ROUND(AVG(engagement_rate), 2)::float     AS avg_engagement_rate
     FROM (
       SELECT DISTINCT ON (post_id, platform)
              post_id, likes, comments, shares, reach, impressions, engagement_rate
       FROM social_metrics
       WHERE fetched_at >= NOW() - make_interval(days => $1)
       ORDER BY post_id, platform, fetched_at DESC
     ) latest`,
    [days]
  );
  return rows[0];
}

async function getTopPosts({ limit = 10, platform } = {}) {
  const conditions = ["sm.fetched_at >= NOW() - INTERVAL '90 days'"];
  const values = [];

  if (platform) {
    values.push(platform);
    conditions.push(`sm.platform = $${values.length}`);
  }

  values.push(limit);
  const limitIdx = values.length;

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await query(
    `SELECT
       bp.id, bp.slug, bp.title_es, bp.image_url,
       sm.platform, sm.likes, sm.comments, sm.shares,
       sm.reach, sm.impressions, sm.engagement_rate, sm.fetched_at
     FROM social_metrics sm
     JOIN blog_posts bp ON bp.id = sm.post_id
     ${where}
     AND sm.fetched_at = (
       SELECT MAX(s2.fetched_at)
       FROM social_metrics s2
       WHERE s2.post_id = sm.post_id AND s2.platform = sm.platform
     )
     ORDER BY sm.engagement_rate DESC
     LIMIT $${limitIdx}`,
    values
  );
  return rows;
}

module.exports = { saveSnapshot, getPostMetrics, getOverview, getTopPosts };
