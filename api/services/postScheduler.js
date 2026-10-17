"use strict";

const { query } = require("../db");
const { postToFacebook, postToInstagram, buildSocialCaption } = require("./socialService");
const { postToLinkedIn } = require("./linkedinService");

const POLL_INTERVAL_MS = 60_000; // 60 seconds

let intervalId = null;

// ─── Tick: check and publish due posts ───────────────────────────────────────
async function tick() {
  let duePosts;
  try {
    const { rows } = await query(
      `SELECT id, slug, title_es, title_en, excerpt_es, excerpt_en,
              body_es, image_url, publish_to_ig, publish_to_fb, publish_to_li, hashtags,
              content_type, tone
       FROM blog_posts
       WHERE scheduled_at <= NOW()
         AND published = false
         AND scheduled_at IS NOT NULL
       ORDER BY scheduled_at ASC
       LIMIT 20`,
    );
    duePosts = rows;
  } catch (err) {
    console.error("[scheduler] Failed to query scheduled posts:", err.message);
    return;
  }

  if (duePosts.length === 0) return;

  console.log(`[scheduler] Found ${duePosts.length} post(s) due for publishing`);

  for (const post of duePosts) {
    const updates = {};
    const errors = [];

    // Build the social text (caption for IG, message for FB)
    const socialText = buildSocialCaption(post, "es");

    // ─── Instagram ─────────────────────────────────────────────────────
    if (post.publish_to_ig && post.image_url) {
      try {
        const igPostId = await postToInstagram({
          caption: socialText,
          imageUrl: post.image_url,
        });
        updates.ig_post_id = igPostId;
        console.log(`[scheduler] Post ${post.id} published to Instagram: ${igPostId}`);
      } catch (err) {
        errors.push(`IG: ${err.message}`);
        console.error(`[scheduler] Post ${post.id} Instagram publish failed:`, err.message);
      }
    } else if (post.publish_to_ig && !post.image_url) {
      errors.push("IG: skipped, no image_url (Instagram requires an image)");
      console.warn(`[scheduler] Post ${post.id} skipped for IG: no image_url`);
    }

    // ─── Facebook ──────────────────────────────────────────────────────
    if (post.publish_to_fb) {
      try {
        const fbPostId = await postToFacebook({
          message: socialText,
          imageUrl: post.image_url || null,
        });
        updates.fb_post_id = fbPostId;
        console.log(`[scheduler] Post ${post.id} published to Facebook: ${fbPostId}`);
      } catch (err) {
        errors.push(`FB: ${err.message}`);
        console.error(`[scheduler] Post ${post.id} Facebook publish failed:`, err.message);
      }
    }

    // ─── LinkedIn ──────────────────────────────────────────────────────
    if (post.publish_to_li) {
      try {
        const liPostId = await postToLinkedIn({
          text: socialText,
          imageUrl: post.image_url || null,
        });
        updates.li_post_id = liPostId;
        console.log(`[scheduler] Post ${post.id} published to LinkedIn: ${liPostId}`);
      } catch (err) {
        errors.push(`LI: ${err.message}`);
        console.error(`[scheduler] Post ${post.id} LinkedIn publish failed:`, err.message);
      }
    }

    // ─── Update the post record ────────────────────────────────────────
    try {
      const setClauses = ["published = true", "published_at = NOW()"];
      const values = [post.id];
      let paramIdx = 2;

      if (updates.ig_post_id) {
        setClauses.push(`ig_post_id = $${paramIdx}`);
        values.push(updates.ig_post_id);
        paramIdx++;
      }
      if (updates.fb_post_id) {
        setClauses.push(`fb_post_id = $${paramIdx}`);
        values.push(updates.fb_post_id);
        paramIdx++;
      }
      if (updates.li_post_id) {
        setClauses.push(`li_post_id = $${paramIdx}`);
        values.push(updates.li_post_id);
        paramIdx++;
      }

      await query(
        `UPDATE blog_posts SET ${setClauses.join(", ")} WHERE id = $1`,
        values,
      );
      console.log(`[scheduler] Post ${post.id} marked as published`);
    } catch (err) {
      console.error(`[scheduler] Post ${post.id} DB update failed:`, err.message);
    }

    // Log any partial failures
    if (errors.length > 0) {
      console.warn(`[scheduler] Post ${post.id} completed with errors:`, errors.join("; "));
    }
  }
}

// ─── Start / Stop ────────────────────────────────────────────────────────────

function start() {
  if (intervalId) {
    console.warn("[scheduler] Already running, ignoring duplicate start()");
    return;
  }
  console.log("[scheduler] Post scheduler started (polling every 60s)");

  // Run once immediately, then on interval
  tick().catch(err => console.error("[scheduler] Initial tick error:", err.message));
  intervalId = setInterval(() => {
    tick().catch(err => console.error("[scheduler] Tick error:", err.message));
  }, POLL_INTERVAL_MS);
}

function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[scheduler] Post scheduler stopped");
  }
}

module.exports = { start, stop };
