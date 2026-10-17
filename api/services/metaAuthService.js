"use strict";

const crypto = require("crypto");
const { query } = require("../db");

function appSecretProof(token) {
  const secret = process.env.FACEBOOK_APP_SECRET;
  if (!secret) return "";
  return "&appsecret_proof=" + crypto.createHmac("sha256", secret).update(token).digest("hex");
}

// ─── In-memory state store (CSRF protection for OAuth flow) ──────────────────
// Keys expire after 10 minutes automatically
const _states = new Map();

function _cleanStates() {
  const now = Date.now();
  for (const [k, v] of _states) {
    if (now - v > 10 * 60 * 1000) _states.delete(k);
  }
}

// ─── Generate Facebook OAuth URL ─────────────────────────────────────────────
function generateOAuthUrl() {
  const appId = process.env.FACEBOOK_APP_ID;
  if (!appId) throw new Error("FACEBOOK_APP_ID not configured — add it to your .env on the VPS");

  const state = crypto.randomBytes(20).toString("hex");
  _states.set(state, Date.now());
  _cleanStates();

  const redirect = `${process.env.API_BASE_URL}/api/admin/meta/callback`;
  const scope = [
    "pages_manage_posts",
    "pages_read_engagement",
    "pages_show_list",
    "instagram_content_publish",
  ].join(",");

  const url = `https://www.facebook.com/v19.0/dialog/oauth` +
    `?client_id=${encodeURIComponent(appId)}` +
    `&redirect_uri=${encodeURIComponent(redirect)}` +
    `&state=${state}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&response_type=code`;

  return { url, state };
}

// ─── Validate state token (one-time use) ─────────────────────────────────────
function validateState(state) {
  if (!state || !_states.has(state)) return false;
  const ts = _states.get(state);
  _states.delete(state);
  return Date.now() - ts < 10 * 60 * 1000;
}

// ─── Exchange code → long-lived user token ────────────────────────────────────
async function exchangeCodeForToken(code) {
  const appId     = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appId || !appSecret) throw new Error("FACEBOOK_APP_ID or FACEBOOK_APP_SECRET not configured");

  const redirect = `${process.env.API_BASE_URL}/api/admin/meta/callback`;

  // Step 1: short-lived user token
  const shortRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token` +
    `?client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirect)}` +
    `&client_secret=${appSecret}` +
    `&code=${code}`
  );
  const shortData = await shortRes.json();
  if (!shortData.access_token) {
    throw new Error(shortData.error?.message ?? "Failed to exchange code for token");
  }

  // Step 2: exchange for long-lived user token (60 days)
  const llRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token` +
    `?grant_type=fb_exchange_token` +
    `&client_id=${appId}` +
    `&client_secret=${appSecret}` +
    `&fb_exchange_token=${shortData.access_token}`
  );
  const llData = await llRes.json();

  // Page Access Tokens derived from a long-lived token do not expire
  return llData.access_token ?? shortData.access_token;
}

// ─── Fetch pages, get IG account, save to DB ─────────────────────────────────
async function fetchAndSavePages(userToken) {
  // Get all pages this user manages
  const pagesRes = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts` +
    `?fields=id,name,access_token` +
    `&access_token=${userToken}` +
    appSecretProof(userToken)
  );
  const pagesData = await pagesRes.json();

  if (pagesData.error) throw new Error(pagesData.error.message);
  if (!pagesData.data || pagesData.data.length === 0) {
    throw new Error(
      "No Facebook Pages found for this account. " +
      "Make sure you're logged in as the admin of the Codigos de Mujeres page."
    );
  }

  // Prefer the page ID configured in env, otherwise take first
  const preferredId = process.env.FACEBOOK_PAGE_ID;
  const page = (preferredId && pagesData.data.find(p => p.id === preferredId))
    ?? pagesData.data[0];

  // Get Instagram Business Account linked to this page
  const igRes = await fetch(
    `https://graph.facebook.com/v19.0/${page.id}` +
    `?fields=instagram_business_account` +
    `&access_token=${page.access_token}` +
    appSecretProof(page.access_token)
  );
  const igData = await igRes.json();
  const igAccountId = igData.instagram_business_account?.id ?? null;

  // Upsert into DB
  await query(
    `INSERT INTO meta_credentials (page_id, page_name, page_access_token, instagram_account_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (page_id) DO UPDATE SET
       page_name            = EXCLUDED.page_name,
       page_access_token    = EXCLUDED.page_access_token,
       instagram_account_id = EXCLUDED.instagram_account_id,
       updated_at           = NOW()`,
    [page.id, page.name, page.access_token, igAccountId]
  );

  console.log(`[meta-auth] Connected: page "${page.name}" (${page.id}), IG: ${igAccountId ?? "none"}`);

  return {
    pageId:      page.id,
    pageName:    page.name,
    igAccountId,
    allPages:    pagesData.data.map(p => ({ id: p.id, name: p.name })),
  };
}

// ─── Load credentials (env first, then DB) ───────────────────────────────────
async function getCredentials() {
  // Env vars take priority (set directly on server)
  if (process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID) {
    return {
      pageId:      process.env.FACEBOOK_PAGE_ID,
      pageName:    null,
      pageToken:   process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
      igAccountId: process.env.INSTAGRAM_ACCOUNT_ID || null,
      source:      "env",
    };
  }

  // Fall back to DB (set via OAuth flow)
  const { rows } = await query(
    "SELECT * FROM meta_credentials ORDER BY updated_at DESC LIMIT 1"
  );
  if (!rows.length) return null;

  return {
    pageId:      rows[0].page_id,
    pageName:    rows[0].page_name,
    pageToken:   rows[0].page_access_token,
    igAccountId: rows[0].instagram_account_id,
    source:      "db",
    updatedAt:   rows[0].updated_at,
  };
}

// ─── Remove saved credentials ─────────────────────────────────────────────────
async function deleteCredentials() {
  await query("DELETE FROM meta_credentials");
}

module.exports = {
  generateOAuthUrl,
  validateState,
  exchangeCodeForToken,
  fetchAndSavePages,
  getCredentials,
  deleteCredentials,
};
