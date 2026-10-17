"use strict";

const crypto   = require("crypto");
const metaAuth = require("./metaAuthService");

// ─── appsecret_proof (required when "Require App Secret" is ON) ───────────────
function appSecretProof(token) {
  const secret = process.env.FACEBOOK_APP_SECRET;
  if (!secret) return null;
  return crypto.createHmac("sha256", secret).update(token).digest("hex");
}

function withProof(token, params = {}) {
  const proof = appSecretProof(token);
  return proof ? { ...params, appsecret_proof: proof } : params;
}

// ─── Facebook Graph API ───────────────────────────────────────────────────────
async function postToFacebook({ message, imageUrl }) {
  const creds = await metaAuth.getCredentials();
  if (!creds) throw new Error("facebook_not_configured — connect via Admin → Meta");

  let endpoint, body;

  if (imageUrl) {
    endpoint = `https://graph.facebook.com/v19.0/${creds.pageId}/photos`;
    body = withProof(creds.pageToken, { caption: message, url: imageUrl, access_token: creds.pageToken });
  } else {
    endpoint = `https://graph.facebook.com/v19.0/${creds.pageId}/feed`;
    body = withProof(creds.pageToken, { message, access_token: creds.pageToken });
  }

  const res  = await fetch(endpoint, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message ?? `FB error ${res.status}`);
  return data.id ?? data.post_id;
}

// ─── Instagram Graph API ──────────────────────────────────────────────────────
// Instagram Business requires an image — text-only posts are not supported by Meta.
async function postToInstagram({ caption, imageUrl }) {
  const creds = await metaAuth.getCredentials();
  if (!creds)              throw new Error("instagram_not_configured — connect via Admin → Meta");
  if (!creds.igAccountId) throw new Error("instagram_not_configured — no IG Business account linked to your FB page");
  if (!imageUrl)           throw new Error("instagram_requires_image");

  // Step 1: Create media container
  const containerRes = await fetch(
    `https://graph.facebook.com/v19.0/${creds.igAccountId}/media`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(withProof(creds.pageToken, { image_url: imageUrl, caption, access_token: creds.pageToken })),
    }
  );
  const container = await containerRes.json();
  if (!containerRes.ok || container.error) {
    throw new Error(container.error?.message ?? `IG container error ${containerRes.status}`);
  }

  // Step 2: Publish the container
  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${creds.igAccountId}/media_publish`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(withProof(creds.pageToken, { creation_id: container.id, access_token: creds.pageToken })),
    }
  );
  const published = await publishRes.json();
  if (!publishRes.ok || published.error) {
    throw new Error(published.error?.message ?? `IG publish error ${publishRes.status}`);
  }
  return published.id;
}

// ─── Build caption/message for any post type ─────────────────────────────────
// Social posts (ig_post, fb_post, carousel, etc.) → use body_es directly.
// Blog articles → use title + excerpt + link.
// Always appends hashtags if present.
function buildSocialCaption(post, lang = "es") {
  const isArticle = post.content_type === "blog" || post.post_type === "article";
  let text;

  if (isArticle) {
    const title   = lang === "en" ? (post.title_en   || post.title_es)   : post.title_es;
    const excerpt = lang === "en" ? (post.excerpt_en || post.excerpt_es) : post.excerpt_es;
    const url     = `${process.env.CLIENT_URL}/blog/${post.slug}`;
    text = [title, excerpt, `→ ${url}`].filter(Boolean).join("\n\n");
  } else {
    // Easy Social generated content lives in body_es
    text = (lang === "en" ? post.body_en : post.body_es)
      || post.body_es
      || post.excerpt_es
      || post.title_es
      || "";
  }

  if (post.hashtags) {
    text += "\n\n" + post.hashtags;
  }

  return text.trim();
}

// Keep for backwards compatibility (used by blog article shares)
function composeSocialText(post, lang = "es") {
  return buildSocialCaption(post, lang);
}

module.exports = { postToFacebook, postToInstagram, buildSocialCaption, composeSocialText };
