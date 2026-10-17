"use strict";

const crypto     = require("crypto");
const WA_API_URL = "https://graph.facebook.com/v19.0";

function getConfig() {
  return {
    token: process.env.WHATSAPP_TOKEN,
    phoneId: process.env.WHATSAPP_PHONE_ID,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    ownerPhone: process.env.WHATSAPP_OWNER_PHONE,
  };
}

// Send a text message via WhatsApp Cloud API
async function sendMessage(to, text) {
  const { token, phoneId } = getConfig();
  if (!token || !phoneId) throw new Error("whatsapp_not_configured");

  const res = await fetch(`${WA_API_URL}/${phoneId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[whatsapp] send error:", res.status, err);
    throw new Error(`WhatsApp send failed: ${res.status}`);
  }

  return await res.json();
}

// Notify the store owner (Dayana) that a conversation needs human attention
async function notifyOwner(customerPhone, customerName, lastMessage) {
  const { ownerPhone } = getConfig();
  if (!ownerPhone) return;

  const text = `🔔 *Daya necesita tu ayuda*\n\nCliente: ${customerName || customerPhone}\nMensaje: "${lastMessage}"\n\nResponde directamente al cliente: wa.me/${customerPhone}`;

  try {
    await sendMessage(ownerPhone, text);
  } catch (err) {
    console.error("[whatsapp] notify owner failed:", err.message);
  }
}

// Notify the store owner of a new sale
async function notifySale(order) {
  const { ownerPhone } = getConfig();
  if (!ownerPhone) return;

  const fmt = { ebook: "E-book (PDF+ePub)", audio: "Audiolibro (MP3)", bundle: "Bundle (E-book + Audio)" }[order.format] || order.format;
  const text = `🎉 *¡Nueva venta en Códigos!*\n\nFormato: ${fmt}\nMonto: $${Number(order.amount_usd).toFixed(2)} USD\nCliente: ${order.email}\n\nRevisa el admin para más detalles.`;

  try {
    await sendMessage(ownerPhone, text);
  } catch (err) {
    console.error("[whatsapp] notifySale failed:", err.message);
  }
}

// Verify webhook (GET request from Meta) — timing-safe token comparison
function verifyWebhook(req) {
  const { verifyToken } = getConfig();
  const mode      = req.query["hub.mode"];
  const token     = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode !== "subscribe" || !token || !verifyToken) return { valid: false };

  let match = false;
  try {
    match = token.length === verifyToken.length &&
            crypto.timingSafeEqual(Buffer.from(token), Buffer.from(verifyToken));
  } catch { match = false; }

  if (match) return { valid: true, challenge };
  return { valid: false };
}

// Verify incoming POST webhook HMAC signature (prevents spoofed payloads)
function verifyHmacSignature(rawBody, signatureHeader) {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return true; // skip if not configured (dev mode)
  if (!signatureHeader) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
  try {
    return expected.length === signatureHeader.length &&
           crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch { return false; }
}

// Parse incoming webhook payload from WhatsApp
function parseWebhookPayload(body) {
  try {
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value?.messages?.length) return null;

    const msg = value.messages[0];
    const contact = value.contacts?.[0];

    // Only handle text messages
    if (msg.type !== "text") return null;

    return {
      from: msg.from,                    // phone number
      name: contact?.profile?.name || null,
      text: msg.text?.body || "",
      messageId: msg.id,
      timestamp: msg.timestamp,
    };
  } catch {
    return null;
  }
}

module.exports = { sendMessage, notifyOwner, notifySale, verifyWebhook, verifyHmacSignature, parseWebhookPayload };
