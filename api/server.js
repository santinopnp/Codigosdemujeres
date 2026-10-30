"use strict";
require("dotenv").config();

// ─── Startup env var validation ───────────────────────────────────────────────
const REQUIRED_ENV = ["DATABASE_URL", "ADMIN_TOKEN", "CLIENT_URL", "UNSUBSCRIBE_SECRET"];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error("[startup] FATAL: missing required env vars:", missing.join(", "));
  process.exit(1);
}

const express       = require("express");
const cors          = require("cors");
const helmet        = require("helmet");
const crypto        = require("crypto");
const rateLimit     = require("express-rate-limit");
const model         = require("./models/bookOrderModel");
const blog          = require("./models/blogModel");
const service       = require("./services/bookOrderService");
const social        = require("./services/socialService");
const { buildSocialCaption } = require("./services/socialService");
const linkedin      = require("./services/linkedinService");
const leads         = require("./models/leadModel");
const chatSvc       = require("./services/chatService");
const chatModel     = require("./models/chatModel");
const whatsapp      = require("./services/whatsappService");
const { upload, saveFile, deleteFile, uploadErrorHandler } = require("./services/uploadService");
const requestLogger = require("./middleware/requestLogger");
const errorHandler  = require("./middleware/errorHandler");
const easySocial    = require("./services/easySocialService");
const metaAuth      = require("./services/metaAuthService");
const scheduler     = require("./services/postScheduler");
const campaigns     = require("./models/campaignModel");
const metrics       = require("./models/socialMetricsModel");
const aiGen         = require("./models/aiGenerationModel");
const chapters      = require("./models/chapterModel");
const library       = require("./services/libraryService");
const audioStreamer  = require("./services/audioStreamer");
const epubGenerator  = require("./services/epubGenerator");
const kindleSender   = require("./services/kindleSender");
const leadEmail      = require("./services/leadEmailService");
const dripScheduler  = require("./services/leadDripScheduler");

const app  = express();
const PORT = process.env.PORT ?? 3101;

// Trust the single Nginx reverse proxy in front of us
app.set("trust proxy", 1);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(requestLogger);
// Helmet BEFORE cors so security headers are applied to all responses including preflight
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", "https://checkout.epayco.co", "https://code.jquery.com"],
      styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:     ["'self'", "https://fonts.gstatic.com"],
      imgSrc:      ["'self'", "data:", "https://www.facebook.com", "https://graph.facebook.com", "blob:"],
      connectSrc:  ["'self'", "https://api.anthropic.com",
                    "https://api.secure.epayco.co", "https://secure.epayco.co"],
      // frameSrc must allow HTTPS iframes for 3DS 1.0 bank redirect (bank URLs are dynamic)
      frameSrc:    ["'self'", "https:"],
      // formAction must allow Cardinal Commerce Device Data Collection POST
      formAction:  ["'self'", "https:"],
      objectSrc:   ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // allow embedding from ePayco/Facebook iframes
}));
app.use(cors({ origin: process.env.CLIENT_URL ?? "http://localhost:3100", credentials: true }));

// ─── Rate limiting ────────────────────────────────────────────────────────────
// Order creation: max 10 orders per IP per 15 min (prevents order spam)
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
// Charge attempts: max 5 per IP per minute (prevents card testing)
const chargeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de pago. Espera un momento e intenta de nuevo." },
});
// General API: max 120 req per IP per minute
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
// Lead capture: max 5 per IP per minute (prevents email spam/blacklisting)
const leadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes. Espera un momento." },
});
// Chat: max 15 messages per IP per minute (protects Anthropic API credits)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados mensajes. Espera un momento." },
});
app.use("/api/", apiLimiter);
app.use("/api/store/order", orderLimiter);

// ePayco sends confirmation as application/x-www-form-urlencoded
app.use("/api/store/webhook/epayco", express.urlencoded({ extended: false }));
// All other routes use JSON bodies
app.use(express.json());

// ─── Health ───────────────────────────────────────────────────────────────────
app.get("/api/health", async (_req, res) => {
  try {
    const { pool } = require("./db");
    await pool.query("SELECT 1");
    res.json({ ok: true, db: "up" });
  } catch (err) {
    res.status(503).json({ ok: false, db: "down", error: err.message });
  }
});

// ─── Create order ─────────────────────────────────────────────────────────────
app.post("/api/store/order", async (req, res) => {
  try {
    const { email, format, paymentMethod, lang, utmSource, utmMedium, utmCampaign, firstName, lastName } = req.body;
    if (!email || !format || !paymentMethod) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    const result = await service.createOrder({ email, format, paymentMethod, lang, utmSource, utmMedium, utmCampaign, firstName, lastName });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("[store] createOrder error:", err.message);
    const status = err.message.startsWith("Invalid") ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

// ─── ePayco tokenized charge ─────────────────────────────────────────────────
app.post("/api/store/charge", chargeLimiter, async (req, res) => {
  try {
    const { orderId, tokenCard, firstName, lastName, browserInfo } = req.body;
    if (!orderId || !tokenCard) {
      return res.status(400).json({ error: "Missing orderId or tokenCard" });
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(orderId))) {
      return res.status(400).json({ error: "Invalid orderId" });
    }
    const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const result = await service.processCharge(orderId, {
      tokenCard, firstName, lastName, browserInfo, ip,
    });
    res.json(result);
  } catch (err) {
    console.error("[store] charge error:", err.message);
    res.status(500).json({ error: "Error procesando el pago. Intenta de nuevo." });
  }
});

// ─── ePayco webhook ───────────────────────────────────────────────────────────
app.post("/api/store/webhook/epayco", async (req, res) => {
  try {
    const result = await service.handleEpaycoWebhook(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("[store] epayco webhook error:", err.message);
    // Always 200 — ePayco retries on non-200 which can cause duplicate fulfillments
    res.status(200).json({ error: err.message });
  }
});

// ─── Facebook OAuth ───────────────────────────────────────────────────────────
// Only allow relative paths as the post-auth redirect target (prevents open redirect)
function sanitizeNext(raw) {
  const next = String(raw || "/checkout");
  // Must start with / and contain no protocol or host (no ://, //)
  return /^\/[^/]/.test(next) ? next : "/checkout";
}

// Initiates FB login; ?next= is the path to return to after auth
app.get("/api/auth/facebook", (req, res) => {
  const appId = process.env.FACEBOOK_APP_ID;
  if (!appId) return res.status(501).json({ error: "facebook_not_configured" });

  const next     = sanitizeNext(req.query.next);
  const state    = Buffer.from(JSON.stringify({ next })).toString("base64url");
  const redirect = `${process.env.API_BASE_URL}/api/auth/facebook/callback`;
  const scope    = "email,public_profile";
  const url      = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirect)}&state=${state}&scope=${scope}`;
  res.redirect(302, url);
});

app.get("/api/auth/facebook/callback", async (req, res) => {
  const appId     = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const clientUrl = process.env.CLIENT_URL ?? "https://codigosdemujeres.com";

  const { code, state, error: fbError } = req.query;
  if (fbError) return res.redirect(`${clientUrl}/checkout?auth_error=cancelled`);

  let next = "/checkout";
  try {
    const parsed = JSON.parse(Buffer.from(String(state || ""), "base64url").toString());
    next = sanitizeNext(parsed.next);
  } catch {}

  try {
    const redirect = `${process.env.API_BASE_URL}/api/auth/facebook/callback`;
    // Exchange code → access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirect)}&client_secret=${appSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error(tokenData.error?.message ?? "no_token");

    // Get user profile
    const meRes = await fetch(
      `https://graph.facebook.com/me?fields=email,first_name,last_name&access_token=${tokenData.access_token}`
    );
    const me = await meRes.json();

    const params = new URLSearchParams();
    if (me.email)      params.set("email",     me.email);
    if (me.first_name) params.set("firstName", me.first_name);
    if (me.last_name)  params.set("lastName",  me.last_name);
    params.set("auth", "facebook");

    const sep = next.includes("?") ? "&" : "?";
    res.redirect(`${clientUrl}${next}${sep}${params.toString()}`);
  } catch (err) {
    console.error("[fb-oauth]", err.message);
    res.redirect(`${clientUrl}/checkout?auth_error=failed`);
  }
});

// ─── Email capture (lead magnet) ─────────────────────────────────────────────
app.post("/api/store/leads", leadLimiter, async (req, res) => {
  const { email, lang, source, utmSource, utmMedium, utmCampaign, newsletterOptIn, firstName, phone } = req.body ?? {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: "invalid_email" });
  }
  const effectiveLang = lang === "en" ? "en" : lang === "it" ? "it" : "es";
  const clientUrl = process.env.CLIENT_URL || process.env.API_BASE_URL || "";
  const sampleUrl = process.env.BOOK_SAMPLE_URL || `${clientUrl}/api/store/sample?lang=${effectiveLang}`;

  // Normalize phone: strip spaces/dashes, keep + prefix
  const cleanPhone = phone ? phone.trim().replace(/[\s\-().]/g, "") : null;

  try {
    const lead = await leads.upsert({
      email: email.trim().toLowerCase(),
      lang: effectiveLang,
      source: source ?? "landing",
      utmSource, utmMedium, utmCampaign,
      newsletterOptIn: Boolean(newsletterOptIn),
      firstName: firstName?.trim() || null,
      phone: cleanPhone,
    });

    if (lead) {
      // Welcome email — only send if this is a new lead (last_emailed_at is null)
      if (!lead.last_emailed_at) {
        leadEmail.sendWelcomeEmail({ leadId: lead.id, email: lead.email, firstName: lead.first_name, lang: effectiveLang })
          .then(() => leads.markWelcomeSent(lead.id))
          .catch(err => console.error("[leads] welcome email failed:", err.message));
      }

      // WhatsApp welcome (only if phone provided and WA configured)
      if (cleanPhone && process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID) {
        const wa = require("./services/whatsappService");
        const name = lead.first_name || "amiga";
        const waMsg = effectiveLang === "en"
          ? `Hi ${name}! 👋 I just sent you Chapter 1 of CODIGOS free to your email. Any questions? I'm here! — Dayana`
          : `Hola ${name}! 👋 Te acabo de enviar el Capítulo 1 de CÓDIGOS gratis a tu correo. ¿Tienes preguntas? Estoy aquí. — Dayana`;
        wa.sendMessage(cleanPhone, waMsg).catch(err => console.error("[leads] WA message failed:", err.message));
      }

      const capi = require("./services/metaCAPIService");
      capi.trackLead(lead.email, req.ip, req.headers["user-agent"]).catch(() => {});
    }

    res.json({ success: true, sampleUrl });
  } catch (err) {
    console.error("[leads] db error:", err.message);
    res.status(500).json({ error: "server_error" });
  }
});

// ─── Abandoned cart — capture email before payment ────────────────────────────
app.post("/api/store/leads/abandoned", leadLimiter, async (req, res) => {
  const { email, lang, firstName, format, utmSource, utmMedium, utmCampaign } = req.body ?? {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: "invalid_email" });
  }
  try {
    await leads.upsert({
      email: email.trim().toLowerCase(),
      lang: lang === "en" ? "en" : lang === "it" ? "it" : "es",
      source: "checkout_abandoned",
      utmSource, utmMedium, utmCampaign,
      newsletterOptIn: false, // explicit opt-in only — GDPR/CASL compliance
      firstName: firstName?.trim() || null,
    });
    res.json({ success: true });
  } catch (err) {
    console.error("[leads] abandoned cart error:", err.message);
    res.status(500).json({ error: "server_error" });
  }
});

// ─── Unsubscribe ──────────────────────────────────────────────────────────────
app.get("/api/store/unsubscribe", async (req, res) => {
  const { email, token } = req.query;
  if (!email || !token) return res.status(400).send("Missing parameters.");

  const valid = leadEmail.verifyUnsubscribeToken(String(email), String(token));
  if (!valid) return res.status(403).send("Invalid or expired unsubscribe link.");

  try {
    await leads.markUnsubscribed(String(email));
    res.redirect(`${process.env.CLIENT_URL}/unsubscribe?success=1&email=${encodeURIComponent(email)}`);
  } catch (err) {
    console.error("[unsubscribe] db error:", err.message);
    res.status(500).send("Server error. Please try again.");
  }
});

// ─── Email open tracking pixel ────────────────────────────────────────────────
app.get("/api/store/track/open/:leadId", async (req, res) => {
  // Fire-and-forget — respond immediately with 1x1 GIF
  leads.trackOpen(req.params.leadId).catch(() => {});
  const gif = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
  res.set({ "Content-Type": "image/gif", "Cache-Control": "no-store, no-cache", "Pragma": "no-cache" });
  res.send(gif);
});

// ─── Email click tracking redirect ───────────────────────────────────────────
// Only redirect to our own domain to prevent open-redirect phishing
app.get("/api/store/track/click/:leadId", async (req, res) => {
  const url       = req.query.url;
  const clientUrl = (process.env.CLIENT_URL || "").replace(/\/$/, "");
  leads.trackClick(req.params.leadId).catch(() => {});
  if (
    !url ||
    typeof url !== "string" ||
    !clientUrl ||
    !url.startsWith(clientUrl + "/") && url !== clientUrl
  ) {
    return res.redirect(clientUrl || "/");
  }
  res.redirect(302, url);
});

// ─── Free sample (chapter 1 preview) ─────────────────────────────────────────
app.get("/api/store/sample", async (req, res) => {
  const url = process.env.BOOK_SAMPLE_URL;
  if (url) return res.redirect(302, url);
  // Serve chapter 1 as a free preview page
  try {
    const lang = (req.query.lang || "es").toString().toLowerCase();
    const ch = await chapters.getChapter("ebook", 1);
    if (!ch) return res.status(404).json({ error: "no_chapters" });
    const title = lang === "en" && ch.title_en ? ch.title_en : ch.title_es;
    const body = lang === "en" && ch.body_en ? ch.body_en : ch.body_es;
    const isEs = lang !== "en";
    res.send(`<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} — CÓDIGOS</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
  body{background:#FBF7F1;color:#3D2B1F;font-family:Nunito,sans-serif;margin:0;padding:0}
  .wrap{max-width:640px;margin:0 auto;padding:32px 20px 60px}
  .header{text-align:center;padding:20px 0;border-bottom:1px solid #F3EBE0;margin-bottom:32px}
  .header h1{font-family:'Playfair Display',Georgia,serif;color:#C2506A;font-size:14px;letter-spacing:.2em;margin:0}
  .header p{color:#A89882;font-size:11px;margin:4px 0 0;letter-spacing:.1em}
  .ch-title{font-family:'Playfair Display',Georgia,serif;font-size:22px;text-align:center;margin-bottom:32px;color:#3D2B1F}
  .content{font-size:16px;line-height:1.9}
  .content p{margin-bottom:1.5em;text-align:justify;hyphens:auto}
  .content blockquote{border-left:3px solid #C2506A;padding:.6em 1.2em;margin:1.8em 0;font-style:italic;font-family:Georgia,serif;color:#8B3A50;background:rgba(194,80,106,.05);border-radius:0 4px 4px 0}
  .content .ornament{text-align:center;margin:2em 0;letter-spacing:.6em;color:#C2506A;opacity:.5;font-size:12px}
  .content .dedicatoria{text-align:center;margin:1em 0 2em}
  .content .dedicatoria blockquote{border-left:none;border-top:1px solid rgba(194,80,106,.2);border-bottom:1px solid rgba(194,80,106,.2);background:none;text-align:center;padding:1em 0}
  .content .author-photo{text-align:center;margin:1.5em 0 2em}
  .content .author-photo img{width:160px;height:160px;border-radius:50%;object-fit:cover;object-position:center top;border:3px solid rgba(194,80,106,.2);box-shadow:0 8px 24px rgba(194,80,106,.15)}
  .content .author-signature{text-align:right;font-family:Georgia,serif;font-style:italic;color:#C2506A;margin-top:2em;padding-right:1em}
  .cta{text-align:center;margin-top:40px;padding:32px 20px;background:rgba(194,80,106,.06);border-radius:12px}
  .cta p{color:#7A6652;margin:0 0 16px;font-size:14px}
  .cta a{display:inline-block;background:#C2506A;color:#fff;font-family:'Playfair Display',Georgia,serif;font-weight:700;padding:14px 32px;text-decoration:none;letter-spacing:.08em;border-radius:6px}
  .badge{display:inline-block;background:#C2506A;color:#fff;font-size:10px;letter-spacing:.15em;padding:4px 12px;margin-bottom:12px;font-weight:700}
</style></head><body>
<div class="wrap">
  <div class="header"><h1>CÓDIGOS</h1><p>${isEs ? "CAPÍTULO GRATUITO" : "FREE CHAPTER"}</p></div>
  <div class="badge">${isEs ? "MUESTRA GRATIS" : "FREE PREVIEW"}</div>
  <h2 class="ch-title">${title}</h2>
  <div class="content">${body}</div>
  <div class="cta">
    <p>${isEs ? "¿Lista para descubrir los 15 capítulos completos?" : "Ready to discover all 15 chapters?"}</p>
    <a href="${process.env.CLIENT_URL || "/"}">${isEs ? "Comprar el libro completo" : "Buy the full book"}</a>
  </div>
</div></body></html>`);
  } catch (err) {
    console.error("[sample]", err.message);
    res.status(500).json({ error: "server_error" });
  }
});

// ─── Download file ────────────────────────────────────────────────────────────
// Download route → redirect to library reader (validates access before redirecting)
app.get("/api/store/download/:token", async (req, res) => {
  try {
    // validateAccess enforces paid status and expiry — prevents access for failed/expired orders
    await library.validateAccess(req.params.token);
    res.redirect(302, `${process.env.CLIENT_URL}/library/${req.params.token}`);
  } catch (err) {
    console.error("[store] download error:", err.message);
    res.status(err.status || 403).json({ error: err.message || "access_denied" });
  }
});

// ─── Poll checkout status (frontend polls after payment) ─────────────────────
app.get("/api/store/checkout/:orderId/status", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  try {
    const order = await model.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "not_found" });

    const resp = { status: order.status };
    if (order.status === "paid") {
      resp.message       = "¡Tu pago fue aprobado! Accediendo a tu biblioteca…";
      resp.downloadToken = order.download_token;
    } else if (order.status === "failed") {
      resp.message = "El pago fue rechazado. Por favor intenta de nuevo.";
    }
    res.json(resp);
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Order status ─────────────────────────────────────────────────────────────
app.get("/api/store/order/:id/status", async (req, res) => {
  try {
    const order = await model.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "not_found" });
    res.json({ status: order.status, format: order.format, paid_at: order.paid_at });
  } catch (err) {
    console.error("[store] status error:", err.message);
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Admin orders ─────────────────────────────────────────────────────────────
app.get("/api/store/admin/orders", async (req, res) => {
  // Basic token auth — replace with real auth in production
  const token = req.headers["x-admin-token"] ?? "";
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const { status } = req.query;
    const orders = await model.listAll({ status: status || undefined });
    const total  = await model.revenue();
    res.json({ success: true, orders, total, count: orders.length });
  } catch (err) {
    console.error("[store] admin orders error:", err.message);
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Refund order ─────────────────────────────────────────────────────────────
app.post("/api/store/order/:id/refund", async (req, res) => {
  const token = req.headers["x-admin-token"] ?? "";
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const updated = await model.markRefunded(req.params.id);
    if (!updated) return res.status(404).json({ error: "not_found_or_not_paid" });
    res.json({ success: true });
  } catch (err) {
    console.error("[store] refund error:", err.message);
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Public: Blog ─────────────────────────────────────────────────────────────
app.get("/api/blog/posts", async (req, res) => {
  try {
    const { type } = req.query;
    const postType = (type === "article" || type === "social") ? type : undefined;
    const posts = await blog.listPosts({ publishedOnly: true, postType });
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

app.get("/api/blog/posts/:slug", async (req, res) => {
  try {
    const post = await blog.getPost(req.params.slug);
    if (!post || !post.published) return res.status(404).json({ error: "not_found" });
    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Public: Testimonials ─────────────────────────────────────────────────────
app.get("/api/testimonials", async (req, res) => {
  try {
    const testimonials = await blog.listTestimonials({ activeOnly: true });
    res.json({ testimonials });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Admin auth middleware ─────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  // Accept token from header (API calls) or query param (browser media elements)
  const token    = req.headers["x-admin-token"] ?? req.query.token ?? "";
  const expected = process.env.ADMIN_TOKEN ?? "";
  // Timing-safe comparison prevents token enumeration via response-time attacks
  let valid = false;
  try {
    valid = token.length === expected.length &&
            crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch { valid = false; }
  if (!valid) return res.status(401).json({ error: "Unauthorized" });
  next();
}

// ─── Admin: All leads (with optional source filter) ───────────────────────────
app.get("/api/admin/leads", requireAdmin, async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit  || "500", 10), 1000);
    const offset = parseInt(req.query.offset || "0", 10);
    const source = req.query.source || undefined;
    const all = await leads.listAll({ limit, offset, source });
    res.json({ success: true, count: all.length, leads: all });
  } catch (err) {
    console.error("[admin] leads list error:", err.message);
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Admin: CSV export ────────────────────────────────────────────────────────
app.get("/api/admin/leads/export.csv", requireAdmin, async (req, res) => {
  try {
    const source = req.query.source || undefined;
    const all = await leads.listAll({ limit: 5000, offset: 0, source });
    const cols = ["email","first_name","phone","lang","source","utm_source","utm_medium","utm_campaign","newsletter_opt_in","email_sequence_step","open_count","click_count","converted_at","created_at"];
    const esc = v => v == null ? "" : `"${String(v).replace(/"/g, '""')}"`;
    const lines = [cols.join(","), ...all.map(r => cols.map(c => esc(r[c])).join(","))];
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="leads-${new Date().toISOString().slice(0,10)}.csv"`);
    res.send(lines.join("\r\n"));
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Admin: Newsletter subscribers ───────────────────────────────────────────
app.get("/api/admin/leads/newsletter", requireAdmin, async (req, res) => {
  try {
    const subscribers = await leads.listNewsletterSubscribers();
    res.json({ success: true, count: subscribers.length, subscribers });
  } catch (err) {
    console.error("[admin] newsletter subscribers error:", err.message);
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Admin: Broadcast email to newsletter subscribers ────────────────────────
app.post("/api/admin/leads/broadcast", requireAdmin, async (req, res) => {
  const { subject, htmlBody } = req.body ?? {};
  if (!subject?.trim() || !htmlBody?.trim()) {
    return res.status(400).json({ error: "subject and htmlBody are required" });
  }
  try {
    const subscribers = await leads.listNewsletterSubscribers();
    if (subscribers.length === 0) return res.json({ success: true, sent: 0 });

    // Batch send: 50/batch with 1s delay between batches to stay within SMTP rate limits
    const BATCH = 50;
    let sent = 0;
    let failed = 0;
    for (let i = 0; i < subscribers.length; i += BATCH) {
      const batch = subscribers.slice(i, i + BATCH);
      await Promise.allSettled(batch.map(async sub => {
        try {
          await leadEmail.sendBroadcast({ leadId: sub.id, email: sub.email, lang: sub.lang, subject, htmlBody });
          sent++;
        } catch (err) {
          failed++;
          console.error(`[broadcast] failed to ${sub.email}:`, err.message);
        }
      }));
      if (i + BATCH < subscribers.length) await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`[broadcast] done: ${sent} sent, ${failed} failed`);
    res.json({ success: true, sent, failed, total: subscribers.length });
  } catch (err) {
    console.error("[admin] broadcast error:", err.message);
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Admin: Dashboard ─────────────────────────────────────────────────────
app.get("/api/admin/dashboard", requireAdmin, async (req, res) => {
  try {
    const [revenue, byDay, byFormat, funnel, recent, leadsTotal, leadsByDay, postsAll] = await Promise.all([
      model.revenueByPeriod(),
      model.ordersByDay(30),
      model.ordersByFormat(),
      model.conversionFunnel(),
      model.recentOrders(5),
      leads.totalCount(),
      leads.countByDay(30),
      blog.listPosts({ publishedOnly: false }),
    ]);
    res.json({
      revenue, ordersByDay: byDay, ordersByFormat: byFormat, funnel, recentOrders: recent,
      leads: { total: leadsTotal, byDay: leadsByDay },
      posts: { total: postsAll.length, published: postsAll.filter(p => p.published).length, social: postsAll.filter(p => p.post_type === "social").length },
    });
  } catch (err) {
    console.error("[admin] dashboard error:", err.message);
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Admin: Blog CRUD ─────────────────────────────────────────────────────────
app.get("/api/admin/posts", requireAdmin, async (req, res) => {
  try {
    const { type } = req.query;
    const postType = (type === "article" || type === "social") ? type : undefined;
    const posts = await blog.listPosts({ publishedOnly: false, postType });
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

app.post("/api/admin/posts", requireAdmin, async (req, res) => {
  try {
    const post = await blog.createPost(req.body);
    const socialResults = { instagram: null, facebook: null, linkedin: null, errors: {} };

    // Auto-publish social posts when created as published
    if (post.post_type === "social" && post.published) {
      const caption = buildSocialCaption(post, "es");

      if (req.body.publishToInstagram && post.image_url) {
        try {
          const igId = await social.postToInstagram({ caption, imageUrl: post.image_url });
          await blog.updatePost(post.id, { ig_post_id: igId });
          socialResults.instagram = igId;
        } catch (err) {
          socialResults.errors.instagram = err.message;
        }
      }

      if (req.body.publishToFacebook) {
        try {
          const fbId = await social.postToFacebook({ message: caption, imageUrl: post.image_url || null });
          await blog.updatePost(post.id, { fb_post_id: fbId });
          socialResults.facebook = fbId;
        } catch (err) {
          socialResults.errors.facebook = err.message;
        }
      }

      if (req.body.publishToLinkedIn) {
        try {
          const liId = await linkedin.postToLinkedIn({ text: caption, imageUrl: post.image_url || null });
          await blog.updatePost(post.id, { li_post_id: liId });
          socialResults.linkedin = liId;
        } catch (err) {
          socialResults.errors.linkedin = err.message;
        }
      }
    }

    res.json({ success: true, post, social: socialResults });
  } catch (err) {
    console.error("[admin] createPost:", err.message);
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/admin/posts/:id", requireAdmin, async (req, res) => {
  try {
    const post = await blog.updatePost(req.params.id, req.body);
    if (!post) return res.status(404).json({ error: "not_found" });
    res.json({ success: true, post });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/admin/posts/:id", requireAdmin, async (req, res) => {
  try {
    await blog.deletePost(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Admin: Publish post to social networks ───────────────────────────────────
app.post("/api/admin/posts/:id/social", requireAdmin, async (req, res) => {
  const { facebook = false, instagram = false, linkedinPost = false, lang = "es", custom_text } = req.body;
  try {
    const post = await blog.getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: "not_found" });

    const text = custom_text || buildSocialCaption(post, lang);
    const results = { facebook: null, instagram: null, linkedin: null, errors: {} };

    if (facebook) {
      try {
        results.facebook = await social.postToFacebook({ message: text, imageUrl: post.image_url });
        await blog.updatePost(post.id, { fb_post_id: results.facebook });
      } catch (err) {
        results.errors.facebook = err.message;
      }
    }

    if (instagram) {
      try {
        results.instagram = await social.postToInstagram({ caption: text, imageUrl: post.image_url });
        await blog.updatePost(post.id, { ig_post_id: results.instagram });
      } catch (err) {
        results.errors.instagram = err.message;
      }
    }

    if (linkedinPost) {
      try {
        results.linkedin = await linkedin.postToLinkedIn({ text, imageUrl: post.image_url });
        await blog.updatePost(post.id, { li_post_id: results.linkedin });
      } catch (err) {
        results.errors.linkedin = err.message;
      }
    }

    res.json({ success: true, results });
  } catch (err) {
    console.error("[admin] social publish:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Testimonials CRUD ─────────────────────────────────────────────────
app.get("/api/admin/testimonials", requireAdmin, async (req, res) => {
  try {
    const testimonials = await blog.listTestimonials({ activeOnly: false });
    res.json({ testimonials });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

app.post("/api/admin/testimonials", requireAdmin, async (req, res) => {
  try {
    const t = await blog.createTestimonial(req.body);
    res.json({ success: true, testimonial: t });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/admin/testimonials/:id", requireAdmin, async (req, res) => {
  try {
    const t = await blog.updateTestimonial(req.params.id, req.body);
    if (!t) return res.status(404).json({ error: "not_found" });
    res.json({ success: true, testimonial: t });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/admin/testimonials/:id", requireAdmin, async (req, res) => {
  try {
    await blog.deleteTestimonial(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Chat: Website widget ─────────────────────────────────────────────────────
app.post("/api/chat/message", chatLimiter, async (req, res) => {
  const { sessionId, message, name, conversationId } = req.body ?? {};
  if (!message?.trim()) return res.status(400).json({ error: "message_required" });
  if (!sessionId) return res.status(400).json({ error: "sessionId_required" });
  if (typeof message !== "string" || message.length > 2000) {
    return res.status(400).json({ error: "message_too_long" });
  }
  try {
    const result = await chatSvc.chat({
      conversationId: conversationId || null,
      message: message.trim(),
      channel: "web",
      customerId: sessionId,
      customerName: name || null,
    });
    if (result.escalated) {
      whatsapp.notifyOwner(sessionId, name, message.trim()).catch(() => {});
    }
    res.json(result);
  } catch (err) {
    console.error("[chat] widget error:", err.message);
    res.status(500).json({ error: "chat_error" });
  }
});

// ─── Chat: WhatsApp webhook ───────────────────────────────────────────────────
app.get("/api/chat/webhook/whatsapp", (req, res) => {
  const { valid, challenge } = whatsapp.verifyWebhook(req);
  if (valid) return res.status(200).send(challenge);
  res.status(403).send("Forbidden");
});

app.post("/api/chat/webhook/whatsapp", async (req, res) => {
  // Verify Meta HMAC signature before processing
  const sig = req.headers["x-hub-signature-256"] ?? "";
  if (!whatsapp.verifyHmacSignature(JSON.stringify(req.body), sig)) {
    console.warn("[chat] WhatsApp webhook HMAC mismatch — ignoring");
    return res.status(403).send("Forbidden");
  }
  res.status(200).send("OK");
  const parsed = whatsapp.parseWebhookPayload(req.body);
  if (!parsed) return;
  try {
    const result = await chatSvc.chat({
      conversationId: null,
      message: parsed.text,
      channel: "whatsapp",
      customerId: parsed.from,
      customerName: parsed.name,
    });
    await whatsapp.sendMessage(parsed.from, result.reply);
    if (result.escalated) {
      await whatsapp.notifyOwner(parsed.from, parsed.name, parsed.text);
    }
  } catch (err) {
    console.error("[chat] whatsapp webhook error:", err.message);
  }
});

// ─── Admin: Conversations ─────────────────────────────────────────────────────
app.get("/api/admin/conversations", requireAdmin, async (req, res) => {
  try {
    const conversations = await chatModel.listConversations();
    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

app.get("/api/admin/conversations/:id/messages", requireAdmin, async (req, res) => {
  try {
    const messages = await chatModel.getHistory(req.params.id, 100);
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Admin: Image upload ──────────────────────────────────────────────────────
app.post("/api/admin/upload", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file provided" });
    const result = saveFile(req.file);
    res.json({ success: true, url: result.url, filename: result.filename, size: result.size });
  } catch (err) {
    console.error("[admin] upload error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admin/upload/:filename", requireAdmin, (req, res) => {
  const deleted = deleteFile(req.params.filename);
  res.json({ success: true, deleted });
});

// ─── Admin: Document vault ────────────────────────────────────────────────────
const DOCS_DIR = require("path").join(__dirname, "../uploads/docs");
if (!require("fs").existsSync(DOCS_DIR)) require("fs").mkdirSync(DOCS_DIR, { recursive: true });

const docUpload = require("multer")({
  storage: require("multer").memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
      "image/jpeg","image/png","image/gif","image/webp",
    ]);
    if (allowed.has(file.mimetype)) cb(null, true);
    else cb(new Error("Unsupported file type: " + file.mimetype));
  },
});

const { query: dbQuery } = require("./db");

app.get("/api/admin/documents", requireAdmin, async (req, res) => {
  try {
    const { rows } = await dbQuery(
      "SELECT id, label, filename, mime_type, size_bytes, category, uploaded_at FROM admin_documents ORDER BY uploaded_at DESC"
    );
    res.json({ documents: rows });
  } catch (err) {
    console.error("[docs] list error:", err.message);
    res.status(500).json({ error: "internal_error" });
  }
});

app.post("/api/admin/documents", requireAdmin, docUpload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "no_file" });
    const label    = (req.body.label || req.file.originalname).slice(0, 200);
    const category = (req.body.category || "general").slice(0, 50);
    const ext      = require("path").extname(req.file.originalname).toLowerCase() || "";
    const filename = `${crypto.randomUUID()}${ext}`;
    require("fs").writeFileSync(require("path").join(DOCS_DIR, filename), req.file.buffer);
    const { rows } = await dbQuery(
      "INSERT INTO admin_documents (filename, label, mime_type, size_bytes, category) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [filename, label, req.file.mimetype, req.file.size, category]
    );
    res.json({ success: true, document: rows[0] });
  } catch (err) {
    console.error("[docs] upload error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/documents/:id/download", requireAdmin, async (req, res) => {
  try {
    const { rows } = await dbQuery("SELECT * FROM admin_documents WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "not_found" });
    const doc      = rows[0];
    const filePath = require("path").join(DOCS_DIR, doc.filename);
    if (!require("fs").existsSync(filePath)) return res.status(404).json({ error: "file_missing" });
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(doc.label)}${require("path").extname(doc.filename)}"`);
    res.setHeader("Content-Type", doc.mime_type);
    res.sendFile(filePath);
  } catch (err) {
    console.error("[docs] download error:", err.message);
    res.status(500).json({ error: "internal_error" });
  }
});

app.delete("/api/admin/documents/:id", requireAdmin, async (req, res) => {
  try {
    const { rows } = await dbQuery("DELETE FROM admin_documents WHERE id = $1 RETURNING filename", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "not_found" });
    const filePath = require("path").join(DOCS_DIR, rows[0].filename);
    if (require("fs").existsSync(filePath)) require("fs").unlinkSync(filePath);
    res.json({ success: true });
  } catch (err) {
    console.error("[docs] delete error:", err.message);
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Easy Social: AI Content Generation ───────────────────────────────────────
app.post("/api/admin/easy-social/generate", requireAdmin, async (req, res) => {
  try {
    const { contentType, tone, topic, context, lang } = req.body;
    if (!topic) return res.status(400).json({ error: "topic_required" });
    const result = await easySocial.generateContent({ contentType, tone, topic, context, lang });
    const saved = await aiGen.save({ prompt: topic, tone: tone || "casual", contentType: contentType || "ig_post", generatedText: result.text });
    res.json({ ...result, generationId: saved.id });
  } catch (err) {
    console.error("[easy-social] generate error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/easy-social/improve", requireAdmin, async (req, res) => {
  try {
    const { text, contentType, instruction } = req.body;
    if (!text) return res.status(400).json({ error: "text_required" });
    const result = await easySocial.improveContent({ text, contentType, instruction });
    res.json(result);
  } catch (err) {
    console.error("[easy-social] improve error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/easy-social/hashtags", requireAdmin, async (req, res) => {
  try {
    const { text, niche, count } = req.body;
    const result = await easySocial.generateHashtags({ text, niche, count });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/easy-social/analyze", requireAdmin, async (req, res) => {
  try {
    const overview = await metrics.getOverview({ days: 30 });
    const topPosts = await metrics.getTopPosts({ limit: 10 });
    const recentPosts = await blog.listPosts({ publishedOnly: true, limit: 20 });
    const result = await easySocial.analyzeMetrics({ metrics: overview, recentPosts });
    res.json(result);
  } catch (err) {
    console.error("[easy-social] analyze error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/easy-social/campaign-plan", requireAdmin, async (req, res) => {
  try {
    const { goal, duration, platforms, tone, lang } = req.body;
    if (!goal) return res.status(400).json({ error: "goal_required" });
    const result = await easySocial.createCampaignPlan({ goal, duration, platforms, tone, lang });
    res.json(result);
  } catch (err) {
    console.error("[easy-social] campaign-plan error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/easy-social/chat", requireAdmin, async (req, res) => {
  try {
    const { message, history, context } = req.body;
    if (!message) return res.status(400).json({ error: "message_required" });
    const result = await easySocial.chat({ message, history, context });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Easy Social: Scheduled Posts ─────────────────────────────────────────────
app.get("/api/admin/easy-social/scheduled", requireAdmin, async (req, res) => {
  try {
    const posts = await blog.listScheduled();
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

app.patch("/api/admin/posts/:id/schedule", requireAdmin, async (req, res) => {
  try {
    const { scheduled_at, publish_to_ig, publish_to_fb, publish_to_li } = req.body;
    const post = await blog.updatePost(req.params.id, { scheduled_at, publish_to_ig, publish_to_fb, publish_to_li });
    if (!post) return res.status(404).json({ error: "not_found" });
    res.json({ success: true, post });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/admin/posts/:id/schedule", requireAdmin, async (req, res) => {
  try {
    const post = await blog.updatePost(req.params.id, { scheduled_at: null, publish_to_ig: false, publish_to_fb: false, publish_to_li: false });
    if (!post) return res.status(404).json({ error: "not_found" });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Easy Social: Campaigns ───────────────────────────────────────────────────
app.get("/api/admin/campaigns", requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const list = await campaigns.list({ status: status || undefined });
    res.json({ campaigns: list });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

app.post("/api/admin/campaigns", requireAdmin, async (req, res) => {
  try {
    const campaign = await campaigns.create(req.body);
    res.json({ success: true, campaign });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/admin/campaigns/:id", requireAdmin, async (req, res) => {
  try {
    const campaign = await campaigns.getWithPosts(req.params.id);
    if (!campaign) return res.status(404).json({ error: "not_found" });
    res.json({ campaign });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

app.patch("/api/admin/campaigns/:id", requireAdmin, async (req, res) => {
  try {
    const campaign = await campaigns.update(req.params.id, req.body);
    if (!campaign) return res.status(404).json({ error: "not_found" });
    res.json({ success: true, campaign });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/admin/campaigns/:id", requireAdmin, async (req, res) => {
  try {
    await campaigns.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Easy Social: Metrics ─────────────────────────────────────────────────────
app.get("/api/admin/easy-social/metrics", requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const overview = await metrics.getOverview({ days: Number(days) });
    const topPosts = await metrics.getTopPosts({ limit: 10 });
    res.json({ overview, topPosts });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

app.get("/api/admin/easy-social/metrics/:postId", requireAdmin, async (req, res) => {
  try {
    const postMetrics = await metrics.getPostMetrics(req.params.postId);
    res.json({ metrics: postMetrics });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Meta OAuth: Connect Facebook Page + Instagram ───────────────────────────

// Middleware variant that also accepts ?t= query param (needed for browser redirects)
function requireAdminQuery(req, res, next) {
  const token    = req.headers["x-admin-token"] ?? req.query.t ?? "";
  const expected = process.env.ADMIN_TOKEN ?? "";
  let valid = false;
  try {
    valid = token.length === expected.length &&
            crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch { valid = false; }
  if (!valid) return res.status(401).send("Unauthorized");
  next();
}

// Step 1: Admin clicks "Connect" — generates OAuth URL and redirects to Facebook
app.get("/api/admin/meta/connect", requireAdminQuery, (req, res) => {
  try {
    const { url } = metaAuth.generateOAuthUrl();
    res.redirect(302, url);
  } catch (err) {
    res.status(400).send(`<h3>Error: ${err.message}</h3>`);
  }
});

// Step 2: Facebook redirects back here with an auth code
app.get("/api/admin/meta/callback", async (req, res) => {
  const { code, state, error: fbError } = req.query;

  if (fbError) {
    return res.send(metaCallbackPage(false, null, `Facebook cancelled: ${fbError}`));
  }
  if (!metaAuth.validateState(String(state ?? ""))) {
    return res.send(metaCallbackPage(false, null, "Invalid or expired state token. Please try connecting again."));
  }

  try {
    const userToken = await metaAuth.exchangeCodeForToken(String(code));
    const result    = await metaAuth.fetchAndSavePages(userToken);
    res.send(metaCallbackPage(true, result, null));
  } catch (err) {
    console.error("[meta-oauth]", err.message);
    res.send(metaCallbackPage(false, null, err.message));
  }
});

function metaCallbackPage(ok, result, errMsg) {
  const body = ok
    ? `<h2 style="color:#34C759">✅ Connected!</h2>
       <p>Page: <strong>${result.pageName}</strong> (${result.pageId})</p>
       ${result.igAccountId
         ? `<p>Instagram: ✅ linked (${result.igAccountId})</p>`
         : `<p style="color:#FF9500">⚠️ No Instagram Business account found on this page</p>`}
       <p style="margin-top:20px;color:#888">This window will close automatically…</p>
       <script>setTimeout(()=>{window.opener&&window.opener.postMessage('meta_connected','*');window.close()},3000)</script>`
    : `<h2 style="color:#FF453A">❌ Connection failed</h2>
       <p>${errMsg}</p>
       <p><a href="javascript:window.close()">Close</a></p>`;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>body{font-family:sans-serif;padding:40px;background:#FBF7F1;color:#3D2B1F;text-align:center}</style>
    </head><body>${body}</body></html>`;
}

// Status: is Meta connected?
app.get("/api/admin/meta/status", requireAdmin, async (req, res) => {
  try {
    const creds = await metaAuth.getCredentials();
    if (!creds) return res.json({ connected: false });
    res.json({
      connected:   true,
      pageId:      creds.pageId,
      pageName:    creds.pageName,
      igConnected: !!creds.igAccountId,
      source:      creds.source,
      updatedAt:   creds.updatedAt ?? null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Disconnect
app.delete("/api/admin/meta/disconnect", requireAdmin, async (req, res) => {
  try {
    await metaAuth.deleteCredentials();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Library: Token-gated access ─────────────────────────────────────────────
app.get("/api/library/:token", async (req, res) => {
  try {
    const access = await library.validateAccess(req.params.token);
    const chapterList = [];
    for (const fmt of access.allowedFormats) {
      const rows = await chapters.listByFormat(fmt);
      chapterList.push(...rows);
    }
    res.json({
      order: { email: access.order.email, format: access.order.format, allowedFormats: access.allowedFormats },
      chapters: chapterList,
    });
  } catch (err) {
    console.error("[library] access error:", err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.get("/api/library/:token/chapter/:num", async (req, res) => {
  try {
    const chapter = await library.getChapterContent(req.params.token, Number(req.params.num), req.query.lang);
    res.json({ chapter });
  } catch (err) {
    console.error("[library] chapter error:", err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.get("/api/library/:token/stream/:num", async (req, res) => {
  try {
    const access = await library.validateAccess(req.params.token);
    if (!access.allowedFormats.includes("audio")) {
      return res.status(403).json({ error: "audio_not_allowed" });
    }
    const chapter = await chapters.getChapter("audio", Number(req.params.num));
    if (!chapter || !chapter.audio_url) {
      return res.status(404).json({ error: "not_found" });
    }
    // Serve language-specific audio: chapter-01-en.mp3 for English, chapter-01.mp3 for Spanish
    let audioFile = chapter.audio_url;
    const lang = (req.query.lang || "es").toString().toLowerCase();
    if (lang === "en") {
      const enFile = audioFile.replace(/\.mp3$/, "-en.mp3");
      try { audioStreamer.createStream(enFile, undefined); audioFile = enFile; } catch {}
    }
    const result = audioStreamer.createStream(audioFile, req.headers.range);
    res.writeHead(result.statusCode, result.headers);
    result.stream.pipe(res);
  } catch (err) {
    console.error("[library] stream error:", err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Admin audio preview — streams audio using admin token instead of purchase token
app.get("/api/library/admin-preview/:num", requireAdmin, async (req, res) => {
  try {
    const chapter = await chapters.getChapter("audio", Number(req.params.num));
    if (!chapter || !chapter.audio_url) return res.status(404).json({ error: "not_found" });
    const result = audioStreamer.createStream(chapter.audio_url, req.headers.range);
    res.writeHead(result.statusCode, result.headers);
    result.stream.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/library/:token/progress", async (req, res) => {
  try {
    const access = await library.validateAccess(req.params.token);
    const progress = await library.getProgress(access.order.id);
    res.json({ progress });
  } catch (err) {
    console.error("[library] get progress error:", err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.post("/api/library/:token/progress", async (req, res) => {
  try {
    const access = await library.validateAccess(req.params.token);
    const { format, chapterNumber, position } = req.body;
    if (!format || chapterNumber == null) {
      return res.status(400).json({ error: "format_and_chapter_required" });
    }
    await library.saveProgress(access.order.id, format, Number(chapterNumber), position ?? 0, access.allowedFormats);
    res.json({ success: true });
  } catch (err) {
    console.error("[library] save progress error:", err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── Library: EPUB export (watermarked) ─────────────────────────────────────
app.get("/api/library/:token/export/epub", async (req, res) => {
  try {
    const access = await library.validateAccess(req.params.token);
    if (!access.allowedFormats.includes("ebook")) {
      return res.status(403).json({ error: "ebook_not_allowed" });
    }
    const lang = req.query.lang || "es";
    const ebookChapters = await chapters.listByFormat("ebook");
    if (!ebookChapters.length) {
      return res.status(404).json({ error: "no_chapters_found" });
    }
    const epubBuffer = await epubGenerator.generateEpub(ebookChapters, {
      title:          "CODIGOS — Codigos que toda mujer necesita saber",
      author:         "Dayana Guerrero",
      lang,
      watermarkEmail: access.order.email,
    });
    res.set({
      "Content-Type": "application/epub+zip",
      "Content-Disposition": 'attachment; filename="codigos.epub"',
      "Content-Length": epubBuffer.length,
      "Cache-Control": "private, no-store",
    });
    res.send(epubBuffer);
  } catch (err) {
    console.error("[library] epub export error:", err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── Library: Send to Kindle ────────────────────────────────────────────────
app.post("/api/library/:token/send-to-kindle", async (req, res) => {
  try {
    const access = await library.validateAccess(req.params.token);
    if (!access.allowedFormats.includes("ebook")) {
      return res.status(403).json({ error: "ebook_not_allowed" });
    }
    const { kindleEmail } = req.body || {};
    if (!kindleEmail || !kindleEmail.includes("@")) {
      return res.status(400).json({ error: "valid_kindle_email_required" });
    }
    const lang = req.body.lang || "es";
    const ebookChapters = await chapters.listByFormat("ebook");
    if (!ebookChapters.length) {
      return res.status(404).json({ error: "no_chapters_found" });
    }
    const epubBuffer = await epubGenerator.generateEpub(ebookChapters, {
      title:          "CODIGOS — Codigos que toda mujer necesita saber",
      author:         "Dayana Guerrero",
      lang,
      watermarkEmail: access.order.email,
    });
    const senderEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    await kindleSender.sendToKindle(epubBuffer, kindleEmail, senderEmail);
    res.json({ success: true });
  } catch (err) {
    console.error("[library] send-to-kindle error:", err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── Library: Audio chapter download ────────────────────────────────────────
app.get("/api/library/:token/download-audio/:num", async (req, res) => {
  try {
    const access = await library.validateAccess(req.params.token);
    if (!access.allowedFormats.includes("audio")) {
      return res.status(403).json({ error: "audio_not_allowed" });
    }
    const chapter = await chapters.getChapter("audio", Number(req.params.num));
    if (!chapter || !chapter.audio_url) {
      return res.status(404).json({ error: "not_found" });
    }
    // Build a safe filename from chapter number + title
    const lang = (req.query.lang || "es").toString().toLowerCase();
    const chNum = String(chapter.chapter_number).padStart(2, "0");
    const titleSource = lang === "en" ? (chapter.title_en || chapter.title_es) : chapter.title_es;
    const titleSlug = (titleSource || "chapter")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const filename = `codigos-${chNum}-${titleSlug}.mp3`;

    // Serve language-specific audio file
    let audioFile = chapter.audio_url;
    if (lang === "en") {
      const enFile = audioFile.replace(/\.mp3$/, "-en.mp3");
      try { audioStreamer.createStream(enFile, undefined); audioFile = enFile; } catch {}
    }
    const stream = audioStreamer.createStream(audioFile, undefined);
    res.writeHead(stream.statusCode, {
      "Content-Type": "audio/mpeg",
      "Content-Length": stream.headers["Content-Length"],
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    });
    stream.stream.pipe(res);
  } catch (err) {
    console.error("[library] audio download error:", err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── Admin: Chapters CRUD ────────────────────────────────────────────────────
app.get("/api/admin/chapters", requireAdmin, async (req, res) => {
  try {
    const { format } = req.query;
    const validFormat = (format === "ebook" || format === "audio") ? format : undefined;
    const list = validFormat ? await chapters.listByFormat(validFormat) : await chapters.listAll();
    const counts = await chapters.countByFormat();
    res.json({ chapters: list, counts });
  } catch (err) {
    console.error("[admin] chapters list error:", err.message);
    res.status(500).json({ error: "internal_error" });
  }
});

app.post("/api/admin/chapters", requireAdmin, async (req, res) => {
  try {
    const { format, chapterNumber, titleEs, titleEn, bodyEs, bodyEn, audioUrl, durationSeconds } = req.body;
    if (!format || chapterNumber == null) {
      return res.status(400).json({ error: "format_and_chapterNumber_required" });
    }
    const chapter = await chapters.create({
      format, chapterNumber, titleEs, titleEn, bodyEs, bodyEn, audioUrl, durationSeconds,
    });
    res.json({ success: true, chapter });
  } catch (err) {
    console.error("[admin] chapter create error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/admin/chapters/:id", requireAdmin, async (req, res) => {
  try {
    const chapter = await chapters.update(req.params.id, req.body);
    if (!chapter) return res.status(404).json({ error: "not_found" });
    res.json({ success: true, chapter });
  } catch (err) {
    console.error("[admin] chapter update error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/admin/chapters/:id", requireAdmin, async (req, res) => {
  try {
    await chapters.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("[admin] chapter delete error:", err.message);
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── 404 for unmatched API routes (must be before errorHandler) ──────────────
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ─── Error handling (must be last) ────────────────────────────────────────────
app.use(uploadErrorHandler);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[codigos-api] Listening on port ${PORT}`);
  // Post scheduler: checks every 60s for posts due to publish
  scheduler.start();
  // Lead drip scheduler: sends nurture emails on day 3, 7, and 14
  dripScheduler.start();
});

module.exports = app;
