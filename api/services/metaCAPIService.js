"use strict";

const crypto = require("crypto");

// SHA-256 hash required by Meta for PII normalization
function sha256(value) {
  if (!value) return undefined;
  return crypto.createHash("sha256").update(String(value).trim().toLowerCase()).digest("hex");
}

/**
 * Send a server-side event to Meta Conversions API.
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 */
async function sendCAPIEvent({ eventName, email, amountUsd, currency = "USD", contentIds, eventSourceUrl, clientIpAddress, clientUserAgent, fbp, fbc }) {
  const pixelId     = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn("[capi] META_PIXEL_ID or META_CAPI_ACCESS_TOKEN not configured — skipping server event");
    return;
  }

  const userData = {};
  if (email)           userData.em  = sha256(email);
  if (clientIpAddress) userData.client_ip_address = clientIpAddress;
  if (clientUserAgent) userData.client_user_agent  = clientUserAgent;
  if (fbp)             userData.fbp = fbp;
  if (fbc)             userData.fbc = fbc;

  const event = {
    event_name:       eventName,
    event_time:       Math.floor(Date.now() / 1000),
    action_source:    "website",
    event_source_url: eventSourceUrl || process.env.CLIENT_URL || "https://codigosdemujeres.com",
    user_data:        userData,
  };

  if (eventName === "Purchase" && amountUsd != null) {
    event.custom_data = {
      value:        Number(amountUsd),
      currency,
      content_name: "Códigos que toda mujer necesita saber",
      content_type: "product",
      content_ids:  contentIds || ["codigos-libro"],
    };
  }

  const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`;

  try {
    const res  = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ data: [event] }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      console.error("[capi] API error:", data.error?.message ?? res.status);
    } else {
      console.log(`[capi] ${eventName} sent — events_received: ${data.events_received}`);
    }
  } catch (err) {
    console.error("[capi] fetch failed:", err.message);
  }
}

/**
 * Track a completed purchase (fire after markPaid succeeds).
 * @param {object} order - Row from book_orders (needs email, amount_usd, format)
 * @param {string} [clientIp]
 * @param {string} [clientUa]
 */
async function trackPurchase(order, clientIp, clientUa) {
  const contentId = `codigos-${order.format || "libro"}`;
  return sendCAPIEvent({
    eventName:       "Purchase",
    email:           order.email,
    amountUsd:       order.amount_usd,
    currency:        "USD",
    contentIds:      [contentId],
    eventSourceUrl:  `${process.env.CLIENT_URL || "https://codigosdemujeres.com"}/order/${order.id}`,
    clientIpAddress: clientIp,
    clientUserAgent: clientUa,
  });
}

/**
 * Track a lead (email capture / free chapter request).
 * @param {string} email
 * @param {string} [clientIp]
 * @param {string} [clientUa]
 */
async function trackLead(email, clientIp, clientUa) {
  return sendCAPIEvent({
    eventName:       "Lead",
    email,
    eventSourceUrl:  process.env.CLIENT_URL || "https://codigosdemujeres.com",
    clientIpAddress: clientIp,
    clientUserAgent: clientUa,
  });
}

module.exports = { trackPurchase, trackLead };
