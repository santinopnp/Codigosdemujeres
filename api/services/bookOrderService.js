"use strict";
const crypto     = require("crypto");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const model      = require("../models/bookOrderModel");

// ─── Email (singleton transport — one pool per process) ───────────────────────
const _mailer = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// Human-readable label for each payment provider (used in invoice + email)
function paymentProviderLabel(provider, lang = "es") {
  const labels = {
    epayco:  { es: "Tarjeta · ePayco",      en: "Card · ePayco" },
    usdt:    { es: "Cripto · USDT (Daimo)", en: "Crypto · USDT (Daimo)" },
    daimo:   { es: "Cripto · USDT (Daimo)", en: "Crypto · USDT (Daimo)" },
    card:    { es: "Tarjeta de crédito",    en: "Credit Card" },
  };
  return (labels[provider] ?? {})[lang] ?? provider ?? "—";
}

const CDN = {
  ebook:  process.env.BOOK_EBOOK_CDN_URL,
  audio:  process.env.BOOK_AUDIO_CDN_URL,
  bundle: process.env.BOOK_BUNDLE_CDN_URL,
};

const siteConfig = require("../config/site");
const PRODUCT_TYPES = siteConfig.productTypes;

function formatLabel(format, lang) {
  const labels = {
    es: {
      ebook:            "Libro Digital (PDF + ePub)",
      audio:            "Audiolibro (MP3)",
      bundle:           "Bundle (Libro + Audiolibro)",
      coaching_orient:  "Sesión de Orientación — 30 min",
      coaching_single:  "Sesión Individual — 60 min",
      coaching_pack:    "Paquete 3 Sesiones",
      coaching_monthly: "Programa Mensual (4 sesiones)",
      workbook:         "Workbook de Autoestima (PDF)",
      masterclass:      "Masterclass: Tu Poder Femenino",
    },
    en: {
      ebook:            "Digital Book (PDF + ePub)",
      audio:            "Audiobook (MP3)",
      bundle:           "Bundle (Book + Audiobook)",
      coaching_orient:  "Orientation Session — 30 min",
      coaching_single:  "Individual Session — 60 min",
      coaching_pack:    "3-Session Package",
      coaching_monthly: "Monthly Program (4 sessions)",
      workbook:         "Self-Esteem Workbook (PDF)",
      masterclass:      "Masterclass: Your Feminine Power",
    },
    it: {
      ebook:            "Libro Digitale (PDF + ePub)",
      audio:            "Audiolibro (MP3)",
      bundle:           "Bundle (Libro + Audiolibro)",
      coaching_orient:  "Sessione di Orientamento — 30 min",
      coaching_single:  "Sessione Individuale — 60 min",
      coaching_pack:    "Pacchetto 3 Sessioni",
      coaching_monthly: "Programma Mensile (4 sessioni)",
      workbook:         "Workbook sull'Autostima (PDF)",
      masterclass:      "Masterclass: Il Tuo Potere Femminile",
    },
  };
  return (labels[lang] ?? labels.es)[format] ?? format;
}

function getProductType(format) {
  return PRODUCT_TYPES[format] ?? "book";
}

// ─── PDF Invoice Generator ────────────────────────────────────────────────────
function generateInvoicePdf(order, lang = "es") {
  return new Promise((resolve, reject) => {
    const isEs = lang !== "en";
    const doc  = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];
    doc.on("data",  chunk => chunks.push(chunk));
    doc.on("end",   ()    => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const accent  = "#C2506A";
    const dark    = "#3D2B1F";
    const muted   = "#7A6652";
    const light   = "#A89882";
    const border  = "#E8DDD4";

    const date = new Date(order.paid_at || Date.now())
      .toLocaleDateString(isEs ? "es-CO" : "en-US", { year: "numeric", month: "long", day: "numeric" });
    const orderNum = order.id.slice(0, 8).toUpperCase();

    // ── Header bar ──
    doc.rect(0, 0, doc.page.width, 80).fill("#FBF7F1");
    doc.fontSize(28).fillColor(accent).font("Helvetica-Bold")
       .text("CÓDIGOS", 50, 26, { align: "left" });
    doc.fontSize(9).fillColor(muted).font("Helvetica")
       .text("codigosdemujeres.com", 50, 58);

    // Order number top-right
    doc.fontSize(9).fillColor(muted)
       .text(isEs ? `N° DE ORDEN: ${orderNum}` : `ORDER NO: ${orderNum}`, 0, 30, { align: "right", width: doc.page.width - 50 });
    doc.fontSize(9).fillColor(light)
       .text(date, 0, 44, { align: "right", width: doc.page.width - 50 });

    // ── Title ──
    doc.moveDown(2.5);
    doc.fontSize(22).fillColor(dark).font("Helvetica-Bold")
       .text(isEs ? "Recibo de Compra" : "Purchase Receipt", { align: "center" });

    // Divider
    doc.moveDown(0.8);
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor(border).lineWidth(1).stroke();
    doc.moveDown(1);

    // ── Seller block ──
    const col1 = 50, col2 = 310;
    const startY = doc.y;

    doc.fontSize(8).fillColor(light).font("Helvetica-Bold")
       .text(isEs ? "VENDIDO POR" : "SOLD BY", col1, startY);
    doc.fontSize(10).fillColor(dark).font("Helvetica")
       .text("Women Coding LLC", col1, startY + 14)
       .text("Dayana Guerrero", col1, startY + 28)
       .text("+1 (817) 533-8934", col1, startY + 42)
       .text("hello@codigosdemujeres.com", col1, startY + 56);

    // ── Bill to ──
    doc.fontSize(8).fillColor(light).font("Helvetica-Bold")
       .text(isEs ? "CLIENTE" : "BILL TO", col2, startY);
    doc.fontSize(10).fillColor(dark).font("Helvetica")
       .text(order.email, col2, startY + 14);

    doc.y = startY + 80;
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor(border).lineWidth(1).stroke();
    doc.moveDown(1);

    // ── Line items table ──
    const tableTop = doc.y;
    const colDesc  = 50, colQty = 340, colPrice = 430;
    const rowH     = 24;

    // Table header
    doc.rect(50, tableTop, doc.page.width - 100, rowH).fill("#F3EBE0");
    doc.fontSize(8).fillColor(muted).font("Helvetica-Bold")
       .text(isEs ? "DESCRIPCIÓN" : "DESCRIPTION",   colDesc  + 8, tableTop + 8)
       .text(isEs ? "CANT."       : "QTY",            colQty,       tableTop + 8)
       .text(isEs ? "PRECIO"      : "PRICE",           colPrice,     tableTop + 8);

    // Table row
    const rowY = tableTop + rowH;
    doc.rect(50, rowY, doc.page.width - 100, rowH).fill("#FAFAFA");
    const productLabel = `CÓDIGOS — ${formatLabel(order.format, lang)}`;
    doc.fontSize(10).fillColor(dark).font("Helvetica")
       .text(productLabel,                           colDesc + 8, rowY + 7)
       .text("1",                                    colQty,      rowY + 7)
       .text(`$${Number(order.amount_usd).toFixed(2)}`, colPrice, rowY + 7);

    // Total row
    const totalY = rowY + rowH;
    doc.rect(50, totalY, doc.page.width - 100, rowH + 4).fill("#FBF7F1");
    doc.moveTo(50, totalY).lineTo(doc.page.width - 50, totalY).strokeColor(border).lineWidth(1).stroke();
    doc.fontSize(11).fillColor(dark).font("Helvetica-Bold")
       .text(isEs ? "TOTAL PAGADO" : "TOTAL PAID", colQty - 60, totalY + 8);
    doc.fontSize(13).fillColor(accent).font("Helvetica-Bold")
       .text(`$${Number(order.amount_usd).toFixed(2)} USD`, colPrice - 10, totalY + 6);

    doc.y = totalY + rowH + 20;
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor(border).lineWidth(1).stroke();
    doc.moveDown(1.2);

    // ── Payment info ──
    doc.fontSize(9).fillColor(muted).font("Helvetica")
       .text(
         isEs
           ? `Método de pago: ${paymentProviderLabel(order.payment_provider, "es")}`
           : `Payment method: ${paymentProviderLabel(order.payment_provider, "en")}`,
         { align: "center" }
       )
       .moveDown(0.4)
       .text(isEs ? "Acceso de por vida — tu enlace nunca expira." : "Lifetime access — your link never expires.", { align: "center" });

    // ── Footer ──
    doc.moveDown(3);
    doc.fontSize(8).fillColor(light)
       .text("Women Coding LLC · codigosdemujeres.com · hello@codigosdemujeres.com", { align: "center" });

    doc.end();
  });
}

async function sendDayanaNotification(order, lang = "es") {
  const ownerEmail = process.env.SMTP_USER;
  if (!ownerEmail) return;
  const productType = getProductType(order.format);
  const isCoaching = productType === "coaching";
  const subject = isCoaching
    ? `[NUEVA RESERVA] ${formatLabel(order.format, "es")} — ${order.email}`
    : `[NUEVA COMPRA] ${formatLabel(order.format, "es")} — ${order.email}`;
  const html = `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px;background:#FBF7F1;color:#3D2B1F;">
  <h2 style="color:#C2506A;margin:0 0 16px;">${isCoaching ? "🗓️ Nueva Reserva de Coaching" : "📦 Nueva Compra"}</h2>
  <table style="width:100%;font-size:14px;color:#7A6652;border-collapse:collapse;">
    <tr><td style="padding:6px 0;font-weight:700;color:#3D2B1F;">Producto</td><td>${formatLabel(order.format, "es")}</td></tr>
    <tr><td style="padding:6px 0;font-weight:700;color:#3D2B1F;">Monto</td><td>$${Number(order.amount_usd).toFixed(2)} USD</td></tr>
    <tr><td style="padding:6px 0;font-weight:700;color:#3D2B1F;">Email cliente</td><td>${order.email}</td></tr>
    <tr><td style="padding:6px 0;font-weight:700;color:#3D2B1F;">ID orden</td><td style="font-family:monospace;">${order.id.slice(0,8).toUpperCase()}</td></tr>
    <tr><td style="padding:6px 0;font-weight:700;color:#3D2B1F;">Idioma</td><td>${lang}</td></tr>
  </table>
  ${isCoaching ? `<p style="margin-top:16px;background:#F9EFF5;border-left:3px solid #C2506A;padding:12px;font-size:13px;">Contacta a <strong>${order.email}</strong> para agendar la sesión.</p>` : ""}
</div>`;
  await _mailer.sendMail({
    from:    `"CÓDIGOS Sistema" <${process.env.SMTP_FROM ?? ownerEmail}>`,
    to:      ownerEmail,
    subject,
    html,
  });
}

async function sendCoachingConfirmationEmail(order, lang = "es") {
  const isEs = lang !== "en";
  const isIt = lang === "it";
  const fmt  = order.format;
  const subject = isIt
    ? "Prenotazione confermata — CÓDIGOS"
    : isEs ? "¡Reserva confirmada! — CÓDIGOS" : "Booking confirmed! — CÓDIGOS";
  const html = `
<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8" /><style>
  body { background:#FBF7F1; color:#3D2B1F; font-family:Nunito,Arial,sans-serif; margin:0; padding:0; }
  .wrap { max-width:540px; margin:40px auto; padding:0 20px; }
  h1 { font-family:Georgia,serif; font-size:1.8rem; letter-spacing:.08em; color:#C2506A; margin:0 0 8px; }
  p { color:#7A6652; line-height:1.7; margin:0 0 14px; font-size:15px; }
  .card { background:#fff; border:1px solid #F3EBE0; border-radius:8px; padding:18px 20px; margin:12px 0; }
  .tag { display:inline-block; background:#F9EFF5; color:#C2506A; font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; letter-spacing:.06em; margin-bottom:8px; }
  .divider { height:1px; background:#F3EBE0; margin:24px 0; }
  table { width:100%; border-collapse:collapse; font-size:13px; color:#7A6652; }
  td { padding:6px 0; }
</style></head>
<body><div class="wrap">
  <div style="text-align:center;margin-bottom:24px;">
    <div class="tag">${isIt ? "PRENOTAZIONE CONFERMATA" : isEs ? "RESERVA CONFIRMADA" : "BOOKING CONFIRMED"}</div>
    <h1>🗓️ ${isIt ? "Ci vediamo presto!" : isEs ? "¡Nos vemos pronto!" : "See you soon!"}</h1>
    <p style="color:#A89882;font-size:14px;">CÓDIGOS — ${formatLabel(fmt, lang)}</p>
  </div>
  <p style="text-align:center;">${isIt
    ? "La tua prenotazione è confermata. Dayana ti contatterà presto per pianificare la sessione."
    : isEs ? "Tu reserva está confirmada. Dayana se pondrá en contacto contigo pronto para agendar la sesión."
    : "Your booking is confirmed. Dayana will contact you soon to schedule your session."}</p>
  <div class="card">
    <table>
      <tr><td style="font-weight:700;color:#3D2B1F;">${isIt ? "Prodotto" : isEs ? "Producto" : "Product"}</td><td style="text-align:right;">${formatLabel(fmt, lang)}</td></tr>
      <tr><td style="font-weight:700;color:#3D2B1F;">${isIt ? "Importo pagato" : isEs ? "Total pagado" : "Total paid"}</td><td style="text-align:right;color:#C2506A;font-weight:700;">$${Number(order.amount_usd).toFixed(2)} USD</td></tr>
      <tr><td style="font-weight:700;color:#3D2B1F;">${isIt ? "N° ordine" : isEs ? "N° de orden" : "Order no."}</td><td style="text-align:right;font-family:monospace;">${order.id.slice(0,8).toUpperCase()}</td></tr>
    </table>
  </div>
  <div class="divider"></div>
  <p style="text-align:center;font-size:13px;color:#A89882;">${isIt
    ? "Hai domande? Rispondi a questa email."
    : isEs ? "¿Tienes preguntas? Responde a este correo."
    : "Have questions? Reply to this email."}</p>
  <p style="font-family:Georgia,serif;font-size:16px;color:#C2506A;text-align:center;margin-top:16px;">Con amor, Dayana</p>
</div></body></html>`;
  await _mailer.sendMail({
    from:    `"Dayana · CÓDIGOS" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to:      order.email,
    subject,
    html,
  });
}

async function sendDigitalConfirmationEmail(order, lang = "es") {
  const isEs = lang !== "en";
  const isIt = lang === "it";
  const fmt  = order.format;
  const subject = isIt
    ? "Acquisto confermato — CÓDIGOS"
    : isEs ? "¡Compra confirmada! — CÓDIGOS" : "Purchase confirmed! — CÓDIGOS";
  const html = `
<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8" /><style>
  body { background:#FBF7F1; color:#3D2B1F; font-family:Nunito,Arial,sans-serif; margin:0; padding:0; }
  .wrap { max-width:540px; margin:40px auto; padding:0 20px; }
  h1 { font-family:Georgia,serif; font-size:1.8rem; letter-spacing:.08em; color:#C2506A; margin:0 0 8px; }
  p { color:#7A6652; line-height:1.7; margin:0 0 14px; font-size:15px; }
  .card { background:#fff; border:1px solid #F3EBE0; border-radius:8px; padding:18px 20px; margin:12px 0; }
  .tag { display:inline-block; background:#F9EFF5; color:#C2506A; font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; letter-spacing:.06em; margin-bottom:8px; }
  .divider { height:1px; background:#F3EBE0; margin:24px 0; }
  table { width:100%; border-collapse:collapse; font-size:13px; color:#7A6652; }
  td { padding:6px 0; }
</style></head>
<body><div class="wrap">
  <div style="text-align:center;margin-bottom:24px;">
    <div class="tag">${isIt ? "ACQUISTO CONFERMATO" : isEs ? "COMPRA CONFIRMADA" : "PURCHASE CONFIRMED"}</div>
    <h1>📦 ${isIt ? "Grazie!" : isEs ? "¡Gracias!" : "Thank you!"}</h1>
    <p style="color:#A89882;font-size:14px;">CÓDIGOS — ${formatLabel(fmt, lang)}</p>
  </div>
  <p style="text-align:center;">${isIt
    ? "Il tuo acquisto è confermato. Dayana ti invierà il materiale entro 24 ore."
    : isEs ? "Tu compra está confirmada. Dayana te enviará el material en las próximas 24 horas."
    : "Your purchase is confirmed. Dayana will send you the material within 24 hours."}</p>
  <div class="card">
    <table>
      <tr><td style="font-weight:700;color:#3D2B1F;">${isIt ? "Prodotto" : isEs ? "Producto" : "Product"}</td><td style="text-align:right;">${formatLabel(fmt, lang)}</td></tr>
      <tr><td style="font-weight:700;color:#3D2B1F;">${isIt ? "Importo pagato" : isEs ? "Total pagado" : "Total paid"}</td><td style="text-align:right;color:#C2506A;font-weight:700;">$${Number(order.amount_usd).toFixed(2)} USD</td></tr>
      <tr><td style="font-weight:700;color:#3D2B1F;">${isIt ? "N° ordine" : isEs ? "N° de orden" : "Order no."}</td><td style="text-align:right;font-family:monospace;">${order.id.slice(0,8).toUpperCase()}</td></tr>
    </table>
  </div>
  <div class="divider"></div>
  <p style="text-align:center;font-size:13px;color:#A89882;">${isIt
    ? "Hai domande? Rispondi a questa email."
    : isEs ? "¿Tienes preguntas? Responde a este correo."
    : "Have questions? Reply to this email."}</p>
  <p style="font-family:Georgia,serif;font-size:16px;color:#C2506A;text-align:center;margin-top:16px;">Con amor, Dayana</p>
</div></body></html>`;
  await _mailer.sendMail({
    from:    `"Dayana · CÓDIGOS" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to:      order.email,
    subject,
    html,
  });
}

async function sendConfirmationEmail(order, lang = "es") {
  const productType = getProductType(order.format);
  if (productType === "coaching") {
    await sendCoachingConfirmationEmail(order, lang);
    await sendDayanaNotification(order, lang).catch(console.error);
    return;
  }
  if (productType === "digital") {
    await sendDigitalConfirmationEmail(order, lang);
    await sendDayanaNotification(order, lang).catch(console.error);
    return;
  }
  // Books: original email flow below
  const clientUrl   = process.env.CLIENT_URL || "https://codigosdemujeres.com";
  const libraryUrl  = `${clientUrl}/library/${order.download_token}`;
  const isEs = lang !== "en";
  const fmt  = order.format;

  const hasEbook = fmt === "ebook" || fmt === "bundle";
  const hasAudio = fmt === "audio" || fmt === "bundle";

  const subject = isEs ? "¡Tu libro CÓDIGOS está listo para leer!" : "Your CÓDIGOS book is ready to read!";
  const html = `
<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8" /><style>
  body { background:#FBF7F1; color:#3D2B1F; font-family:Nunito,Arial,sans-serif; margin:0; padding:0; }
  .wrap { max-width:540px; margin:40px auto; padding:0 20px; }
  h1 { font-family:Georgia,serif; font-size:1.8rem; letter-spacing:.08em; color:#C2506A; margin:0 0 8px; }
  h2 { font-family:Georgia,serif; font-size:1.1rem; color:#3D2B1F; margin:24px 0 12px; }
  p  { color:#7A6652; line-height:1.7; margin:0 0 14px; font-size:15px; }
  .btn { display:inline-block; background:#C2506A; color:#FBF7F1 !important; font-family:Georgia,serif;
         font-weight:700; font-size:.9rem; letter-spacing:.1em;
         padding:16px 36px; text-decoration:none; margin:8px 0 24px; border-radius:6px; }
  .btn-outline { display:inline-block; border:1.5px solid #C2506A; color:#C2506A !important;
         font-family:Georgia,serif; font-weight:700; font-size:.85rem; letter-spacing:.08em;
         padding:12px 24px; text-decoration:none; margin:4px 6px 4px 0; border-radius:6px; }
  .card { background:#fff; border:1px solid #F3EBE0; border-radius:8px; padding:18px 20px; margin:12px 0; }
  .step { display:flex; gap:12px; margin-bottom:14px; align-items:flex-start; }
  .step-num { background:#C2506A; color:#FBF7F1; width:24px; height:24px; border-radius:50%;
              font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center;
              flex-shrink:0; margin-top:2px; }
  .step-text { font-size:14px; color:#7A6652; line-height:1.6; }
  .note { font-size:.75rem; color:#A89882; }
  .divider { height:1px; background:#F3EBE0; margin:24px 0; }
  .tag { display:inline-block; background:#F9EFF5; color:#C2506A; font-size:11px; font-weight:700;
         padding:3px 10px; border-radius:20px; letter-spacing:.06em; margin-bottom:8px; }
</style></head>
<body><div class="wrap">
  <div style="text-align:center;margin-bottom:24px;">
    <div class="tag">${isEs ? "COMPRA CONFIRMADA" : "PURCHASE CONFIRMED"}</div>
    <h1>${isEs ? "¡Tu libro está listo!" : "Your book is ready!"}</h1>
    <p style="color:#A89882;font-size:14px;">${isEs
      ? `CÓDIGOS — ${formatLabel(fmt, lang)}`
      : `CÓDIGOS — ${formatLabel(fmt, lang)}`}</p>
  </div>

  <p style="text-align:center;">${isEs
    ? "Tu enlace personal te da acceso a todo. Guárdalo — es tu llave a la biblioteca."
    : "Your personal link gives you access to everything. Save it — it's your library key."}</p>

  <div style="text-align:center;">
    <a href="${libraryUrl}" class="btn">${isEs ? "Abrir mi biblioteca" : "Open my library"}</a>
  </div>

  <div class="divider"></div>

  ${hasEbook ? `
  <h2>${isEs ? "Cómo leer tu e-book" : "How to read your e-book"}</h2>
  <div class="card">
    <div class="step">
      <div class="step-num">1</div>
      <div class="step-text"><strong>${isEs ? "Lee en tu navegador" : "Read in your browser"}</strong><br/>
        ${isEs
          ? "Abre tu biblioteca y empieza a leer al instante. Tu progreso se guarda automáticamente."
          : "Open your library and start reading instantly. Your progress is saved automatically."}
      </div>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <div class="step-text"><strong>${isEs ? "Descarga EPUB" : "Download EPUB"}</strong><br/>
        ${isEs
          ? "Toca el botón ↗ en el lector para descargar el EPUB. Ábrelo en Apple Books, Google Play Books, o Kobo."
          : "Tap the ↗ button in the reader to download the EPUB. Open it in Apple Books, Google Play Books, or Kobo."}
      </div>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <div class="step-text"><strong>${isEs ? "Enviar a Kindle" : "Send to Kindle"}</strong><br/>
        ${isEs
          ? "Desde el mismo botón ↗, selecciona 'Enviar a Kindle' e ingresa tu correo Kindle."
          : "From the same ↗ button, select 'Send to Kindle' and enter your Kindle email."}
      </div>
    </div>
  </div>
  ` : ""}

  ${hasAudio ? `
  <h2>${isEs ? "Cómo escuchar tu audiolibro" : "How to listen to your audiobook"}</h2>
  <div class="card">
    <div class="step">
      <div class="step-num">1</div>
      <div class="step-text"><strong>${isEs ? "Escucha en tu navegador" : "Listen in your browser"}</strong><br/>
        ${isEs
          ? "Abre tu biblioteca y toca la pestaña Audio. Controles de velocidad, temporizador de sueño y cambio automático de capítulos incluidos."
          : "Open your library and tap the Audio tab. Speed controls, sleep timer, and auto-advance between chapters included."}
      </div>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <div class="step-text"><strong>${isEs ? "Instala la app" : "Install the app"}</strong><br/>
        ${isEs
          ? "Cuando abras tu biblioteca, tu teléfono te ofrecerá instalarla como app. Así puedes escuchar sin abrir el navegador."
          : "When you open your library, your phone will offer to install it as an app. That way you can listen without opening the browser."}
      </div>
    </div>
  </div>
  ` : ""}

  <div class="divider"></div>

  <div style="text-align:center;">
    <p style="font-size:13px;color:#A89882;margin-bottom:4px;">${isEs
      ? "Tu enlace personal (guárdalo):"
      : "Your personal link (save it):"}</p>
    <p style="font-size:12px;color:#C2506A;word-break:break-all;">${libraryUrl}</p>
    <p class="note">${isEs ? "Acceso de por vida — tu enlace nunca expira." : "Lifetime access — your link never expires."}</p>
  </div>

  <div class="divider"></div>

  <!-- Invoice -->
  <div class="card" style="background:#FAFAFA;">
    <p style="font-family:Georgia,serif;font-size:.85rem;font-weight:700;letter-spacing:.1em;color:#A89882;text-transform:uppercase;margin:0 0 14px;">
      ${isEs ? "Recibo de compra" : "Purchase Receipt"}
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;color:#7A6652;">
      <tr>
        <td style="padding:5px 0;">${isEs ? "N° de orden" : "Order no."}</td>
        <td style="text-align:right;color:#3D2B1F;font-family:monospace;font-size:12px;">${order.id.slice(0, 8).toUpperCase()}</td>
      </tr>
      <tr>
        <td style="padding:5px 0;">${isEs ? "Producto" : "Product"}</td>
        <td style="text-align:right;color:#3D2B1F;">CÓDIGOS — ${formatLabel(fmt, lang)}</td>
      </tr>
      <tr>
        <td style="padding:5px 0;">${isEs ? "Fecha" : "Date"}</td>
        <td style="text-align:right;color:#3D2B1F;">${new Date(order.paid_at || Date.now()).toLocaleDateString(lang === "en" ? "en-US" : "es-CO", { year: "numeric", month: "long", day: "numeric" })}</td>
      </tr>
      <tr>
        <td style="padding:5px 0;">${isEs ? "Método de pago" : "Payment method"}</td>
        <td style="text-align:right;color:#3D2B1F;">${paymentProviderLabel(order.payment_provider || "epayco", lang)}</td>
      </tr>
      <tr style="border-top:1px solid #F3EBE0;">
        <td style="padding:10px 0 4px;font-weight:700;color:#3D2B1F;">${isEs ? "Total pagado" : "Total paid"}</td>
        <td style="text-align:right;font-weight:700;color:#C2506A;font-size:15px;padding-top:10px;">$${Number(order.amount_usd).toFixed(2)} USD</td>
      </tr>
    </table>
  </div>

  <div class="divider"></div>

  <div style="text-align:center;">
    <p style="font-size:14px;color:#7A6652;">${isEs
      ? "¿Necesitas ayuda? Responde a este correo y te ayudaré personalmente."
      : "Need help? Reply to this email and I'll help you personally."}</p>
    <!-- Install app suggestion -->
    <div style="background:#F9EFF5;border:1px solid #F0D8E0;border-radius:8px;padding:18px 20px;margin:20px 0;text-align:center;">
      <p style="font-family:Georgia,serif;font-size:15px;font-weight:700;color:#3D2B1F;margin:0 0 8px;">
        ${isEs ? "📱 Instala la app en tu teléfono" : "📱 Install the app on your phone"}
      </p>
      <p style="font-size:13px;color:#7A6652;margin:0 0 14px;line-height:1.6;">
        ${isEs
          ? "Abre tu biblioteca desde el ícono en tu pantalla — sin buscarlo cada vez."
          : "Open your library from your home screen icon — no searching every time."}
      </p>
      <p style="font-size:12px;color:#A89882;margin:0;line-height:1.7;">
        ${isEs
          ? "Safari / Chrome → toca <strong>Compartir</strong> → <strong>Agregar a pantalla de inicio</strong>"
          : "Safari / Chrome → tap <strong>Share</strong> → <strong>Add to Home Screen</strong>"}
      </p>
    </div>
    <p style="font-family:Georgia,serif;font-size:16px;color:#C2506A;margin-top:16px;">Con amor, Dayana</p>
  </div>
</div></body></html>`;

  const invoicePdf = await generateInvoicePdf(order, lang).catch(() => null);
  const mailOpts = {
    from:    `"Dayana · CÓDIGOS" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to:      order.email,
    subject,
    html,
  };
  if (invoicePdf) {
    mailOpts.attachments = [{
      filename: lang !== "en" ? `factura-codigos-${order.id.slice(0,8).toUpperCase()}.pdf` : `invoice-codigos-${order.id.slice(0,8).toUpperCase()}.pdf`,
      content:  invoicePdf,
      contentType: "application/pdf",
    }];
  }
  await _mailer.sendMail(mailOpts);
}

// ─── ePayco tokenized charge ──────────────────────────────────────────────────
async function processCharge(orderId, { tokenCard, firstName, lastName, browserInfo, ip }) {
  // PCI-DSS: reject anything that looks like raw card data
  if (!tokenCard || !String(tokenCard).startsWith("tok_")) {
    return { success: false, error: "Token inválido. Por favor recarga la página e intenta de nuevo." };
  }

  const order = await model.findById(orderId);
  if (!order) return { success: false, error: "Orden no encontrada." };
  if (order.status === "paid") return { success: true, status: "processing" }; // idempotent

  const { getEpaycoClient } = require("../config/epayco");
  const client = getEpaycoClient();

  const lang      = order.lang || "es";
  const apiBase   = process.env.API_BASE_URL  || "https://codigosdemujeres.com";
  const clientUrl = process.env.CLIENT_URL    || "https://codigosdemujeres.com";
  const amount    = Number(order.amount_usd).toFixed(2);
  const name      = (firstName || "").trim();
  const last      = (lastName  || name).trim();
  const phone     = "3100000000"; // ePayco required field — not collected in UX for simplicity
  const safeIp    = ip || "127.0.0.1";

  // 1. Create ePayco customer
  let customerId;
  try {
    const custResult = await client.customers.create({
      token_card: tokenCard,
      name,
      last_name:  last,
      email:      order.email,
      default:    true,
      city:       "Bogota",
      address:    "N/A",
      phone,
      cell_phone: phone,
    });
    if (!custResult || custResult.status === false) {
      const msg = custResult?.data?.message || "No se pudo registrar la tarjeta. Verifica los datos.";
      return { success: false, error: msg };
    }
    customerId = custResult.data?.customerId || custResult.data?.id_customer || custResult.id;
  } catch (err) {
    console.error("[epayco] customer create error:", err.message);
    return { success: false, error: "Error al registrar la tarjeta. Intenta de nuevo." };
  }

  // 2. Create charge with 3DS enabled
  let chargeResult;
  try {
    chargeResult = await client.charge.create({
      token_card:               tokenCard,
      customer_id:              customerId,
      doc_type:                 "CC",
      doc_number:               "1000000000",
      name,
      last_name:                last,
      email:                    order.email,
      city:                     "Bogota",
      address:                  "N/A",
      phone,
      cell_phone:               phone,
      bill:                     order.id,
      description:              `CÓDIGOS — ${formatLabel(order.format, lang)}`,
      value:                    amount,
      tax:                      "0",
      tax_base:                 "0",
      currency:                 "usd",
      dues:                     "1",
      ip:                       safeIp,
      browser_info:             browserInfo || {},
      user_agent:               browserInfo?.userAgent || "Mozilla/5.0",
      accept_header:            "text/html",
      url_response:             `${clientUrl}/checkout?confirmed=1&format=${encodeURIComponent(order.format)}&lang=${lang}&orderId=${order.id}`,
      url_confirmation:         `${apiBase}/api/store/webhook/epayco`,
      method_confirmation:      "POST",
      use_default_card_customer: true,
      three_d_secure:           true,
      country:                  "CO",
      extra1:                   "codigos",
      extra2:                   order.format,
      extra3:                   lang,
    });
  } catch (err) {
    console.error("[epayco] charge create error:", err.message);
    return { success: false, error: "Error al procesar el pago. Intenta de nuevo." };
  }

  const estado       = chargeResult?.data?.estado;
  const respuesta    = chargeResult?.data?.respuesta;
  const refPayco     = chargeResult?.data?.ref_payco;
  const transactionId = chargeResult?.data?.transactionID || chargeResult?.data?.transaction_id;

  // Approved
  if (estado === "Aceptada" || estado === "Aprobada" || respuesta === "Aprobada") {
    return { success: true, status: "processing", transactionId: refPayco || transactionId };
  }

  // Pending — 3DS required
  if (estado === "Pendiente") {
    const full = chargeResult?.data || {};
    let redirectUrl = full.urlbanco || full.url_response_bank || null;
    let threeDSecure = null;

    const raw3DS = full["3DS"];
    if (!redirectUrl && raw3DS) {
      if (typeof raw3DS === "string") {
        redirectUrl = raw3DS;
      } else if (typeof raw3DS === "object") {
        const ddcUrl =
          raw3DS.data?.deviceDataCollectionUrl ||
          raw3DS.deviceDataCollectionUrl;
        if (ddcUrl) {
          threeDSecure = {
            version:  "2.0",
            provider: "CardinalCommerce",
            data: {
              accessToken:            raw3DS.data?.accessToken || raw3DS.accessToken,
              deviceDataCollectionUrl: ddcUrl,
              referenceId:            raw3DS.data?.referenceId || raw3DS.referenceId,
              token:                  raw3DS.data?.token || raw3DS.token,
            },
          };
        } else {
          redirectUrl = raw3DS.urlbanco || raw3DS.url || null;
        }
      }
    }
    if (!redirectUrl && !threeDSecure) redirectUrl = full.url || null;

    if (!redirectUrl && !threeDSecure) {
      return {
        success: false,
        error:   "El banco no pudo autenticar el pago. Intenta con otra tarjeta.",
      };
    }

    const result = { success: true, status: "pending" };
    if (redirectUrl)  result.redirectUrl  = redirectUrl;
    if (threeDSecure) result.threeDSecure = threeDSecure;
    return result;
  }

  // Rejected
  const errMsg = chargeResult?.data?.respuesta || chargeResult?.data?.mensaje ||
    "Pago rechazado. Verifica los datos de tu tarjeta e intenta de nuevo.";
  return { success: false, status: "rejected", error: errMsg };
}

async function handleEpaycoWebhook(body) {
  const {
    x_ref_payco, x_transaction_id, x_amount, x_currency_code,
    x_signature, x_transaction_state,
    x_extra1, x_extra3, x_invoice,
  } = body;

  // Ignore transactions from other projects
  if (x_extra1 !== "codigos") return { skip: true };

  // Validate required fields before doing any signature work
  if (!x_ref_payco || !x_transaction_id || !x_amount || !x_currency_code || !x_signature || !x_invoice) {
    throw new Error("Missing required webhook fields");
  }

  // Verify signature: SHA256(P_CUST_ID^P_KEY^x_ref_payco^x_transaction_id^x_amount^x_currency_code)
  const custId = process.env.EPAYCO_P_CUST_ID;
  const pKey   = process.env.EPAYCO_P_KEY;
  if (!custId || !pKey) throw new Error("ePayco signature keys not configured");

  const expected        = crypto
    .createHash("sha256")
    .update(`${custId}^${pKey}^${x_ref_payco}^${x_transaction_id}^${x_amount}^${x_currency_code}`)
    .digest("hex");
  const received        = String(x_signature).toLowerCase();

  // Timing-safe comparison prevents enumeration via response-time side-channel
  let signatureValid = false;
  try {
    signatureValid = expected.length === received.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  } catch {
    signatureValid = false;
  }
  if (!signatureValid) throw new Error("Invalid ePayco signature");

  // Only fulfil on "Aceptada" (approved); other states are informational
  if (x_transaction_state !== "Aceptada") {
    console.log(`[epayco] non-approval state: ${x_transaction_state} for order ${x_invoice}`);
    return { status: x_transaction_state };
  }

  const lang = x_extra3 || "es";

  // Idempotency: if webhook arrives twice for the same payment, skip re-processing
  const existing = await model.findById(x_invoice);
  if (existing && existing.status === "paid") {
    console.log(`[epayco] duplicate webhook ignored for already-paid order ${x_invoice}`);
    return { processed: true, duplicate: true };
  }

  const order = await model.markPaid(x_invoice, { providerRef: x_ref_payco, provider: "epayco" });
  if (order) {
    sendConfirmationEmail(order, lang).catch(console.error);
    if (getProductType(order.format) === "book") {
      sendDayanaNotification(order, lang).catch(console.error);
      require("./metaCAPIService").trackPurchase(order).catch(() => {});
      require("./whatsappService").notifySale(order).catch(() => {});
    }
  }
  return { processed: true };
}

// ─── Exported service functions ───────────────────────────────────────────────
async function createOrder({ email, format, paymentMethod, lang = "es", utmSource, utmMedium, utmCampaign, firstName = "", lastName = "" }) {
  const order = await model.create({ email, format, paymentMethod, lang, utmSource, utmMedium, utmCampaign });

  if (paymentMethod === "card") {
    // Return public key so the frontend can initialise the ePayco.js SDK for tokenization
    return {
      orderId:          order.id,
      epaycoPublicKey:  process.env.EPAYCO_PUBLIC_KEY,
      testMode:         process.env.EPAYCO_TEST_MODE === "true",
    };
  }

  return { orderId: order.id };
}

async function resolveDownload(token) {
  const order = await model.findByToken(token);
  if (!order)                      return { error: "not_found",  status: 404 };
  if (order.status !== "paid")     return { error: "not_paid",   status: 402 };
  const cdnUrl = CDN[order.format];
  const localFiles = {
    ebook:  "/app/downloads/codigos-ebook.zip",
    audio:  "/app/downloads/codigos-audio.zip",
    bundle: "/app/downloads/codigos-bundle.zip",
  };
  const localPath = localFiles[order.format];
  if (localPath && require("fs").existsSync(localPath)) {
    return { localFile: localPath, format: order.format };
  }
  if (!cdnUrl) return { error: "cdn_not_configured", status: 500 };
  return { redirect: cdnUrl };
}

async function sendLeadEmail({ email, lang = "es" }) {
  const isEs = lang !== "en";
  // CLIENT_URL is the public-facing domain; API_BASE_URL may be an internal hostname
  const baseUrl   = process.env.CLIENT_URL || process.env.API_BASE_URL || "";
  const sampleUrl = process.env.BOOK_SAMPLE_URL || `${baseUrl}/api/store/sample?lang=${lang}`;
  const subject   = isEs ? "Tu capítulo gratuito de CÓDIGOS" : "Your free chapter of CÓDIGOS";
  const html = `
<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8" /><style>
  body { background:#FBF7F1; color:#3D2B1F; font-family:Nunito,Arial,sans-serif; margin:0; padding:0; }
  .wrap { max-width:520px; margin:40px auto; padding:0 20px; }
  h1 { font-family:Georgia,serif; font-size:2rem; letter-spacing:.08em;  color:#C2506A; margin:0 0 12px; }
  p  { color:#7A6652; line-height:1.7; margin:0 0 16px; }
  .btn { display:inline-block; background:#C2506A; color:#FFFFFF; font-family:Georgia,serif;
         font-weight:700; font-size:.9rem; letter-spacing:.1em;
         padding:14px 32px; text-decoration:none; margin:8px 0 24px; border-radius:6px; }
  .note { font-size:.75rem; color:#A89882; }
  .divider { height:1px; background:#F3EBE0; margin:24px 0; }
</style></head>
<body><div class="wrap">
  <h1>CÓDIGOS</h1>
  <p>${isEs
    ? "Hola, aquí está tu capítulo gratuito. Espero que cada página te resuene y te inspire a descubrir todo lo que hay dentro de ti."
    : "Hi, here is your free chapter. I hope every page resonates with you and inspires you to discover everything within."}</p>
  <a href="${sampleUrl}" class="btn">${isEs ? "Leer mi capítulo gratis" : "Read my free chapter"}</a>
  <div class="divider"></div>
  <p>${isEs ? "Cuando estés lista para los 15 capítulos completos + audiolibro:" : "When you're ready for all 15 chapters + audiobook:"}</p>
  <a href="${process.env.CLIENT_URL}" class="btn">${isEs ? "Ver el libro completo" : "See the full book"}</a>
  <p class="note">${isEs ? "Con amor, Dayana Guerrero" : "With love, Dayana Guerrero"}</p>
</div></body></html>`;

  await _mailer.sendMail({
    from:    `"Dayana Guerrero" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to:      email,
    subject,
    html,
  });
}

module.exports = {
  createOrder,
  processCharge,
  handleEpaycoWebhook,
  resolveDownload,
  sendLeadEmail,
  sendConfirmationEmail,
};
