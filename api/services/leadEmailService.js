"use strict";
const crypto     = require("crypto");
const nodemailer = require("nodemailer");

// ─── Mailer singleton (one SMTP connection pool for the process lifetime) ─────
const _mailer = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// ─── Token helpers ────────────────────────────────────────────────────────────
// UNSUBSCRIBE_SECRET must be its own env var — never share with ADMIN_TOKEN
function getUnsubSecret() {
  const s = process.env.UNSUBSCRIBE_SECRET;
  if (!s) throw new Error("[leadEmail] UNSUBSCRIBE_SECRET env var is not set");
  return s;
}
const UNSUB_SECRET = getUnsubSecret;

function generateUnsubscribeToken(email) {
  return crypto
    .createHmac("sha256", UNSUB_SECRET())
    .update(email.trim().toLowerCase())
    .digest("hex");
}

function verifyUnsubscribeToken(email, token) {
  const expected = generateUnsubscribeToken(email.trim().toLowerCase());
  try {
    return crypto.timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

// ─── Shared URL builders ──────────────────────────────────────────────────────
function baseUrl() {
  return (process.env.CLIENT_URL || process.env.API_BASE_URL || "").replace(/\/$/, "");
}

function unsubscribeUrl(email) {
  const token = generateUnsubscribeToken(email);
  return `${baseUrl()}/api/store/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

function openPixelUrl(leadId) {
  return `${baseUrl()}/api/store/track/open/${leadId}`;
}

function clickTrackUrl(leadId, url) {
  return `${baseUrl()}/api/store/track/click/${leadId}?url=${encodeURIComponent(url)}`;
}

// ─── Brand palette ────────────────────────────────────────────────────────────
const C = {
  bg:      "#FBF7F1",
  cherry:  "#C2506A",
  dark:    "#3D2B1F",
  muted:   "#7A6652",
  border:  "#F3EBE0",
  gold:    "#B8936A",
  white:   "#FFFFFF",
};

// ─── Shared HTML email wrapper ────────────────────────────────────────────────
function emailTemplate({ leadId, email, lang = "es", preheader = "", body }) {
  const isIt = lang === "it";
  const isEs = !isIt && lang !== "en";
  const unsub = unsubscribeUrl(email);
  const pixel = openPixelUrl(leadId);
  const year  = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <title>Códigos de Mujeres</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${C.bg}; color: ${C.dark}; font-family: Georgia, 'Times New Roman', serif; -webkit-font-smoothing: antialiased; }
    a { color: ${C.cherry}; text-decoration: none; }
    .email-wrap { max-width: 560px; margin: 0 auto; }
    .header { background: ${C.white}; border-bottom: 3px solid ${C.cherry}; padding: 28px 40px; text-align: center; }
    .header-brand { font-family: Georgia, serif; font-size: 13px; letter-spacing: .25em; text-transform: uppercase; color: ${C.cherry}; font-weight: 700; }
    .header-title { font-family: Georgia, serif; font-size: 24px; color: ${C.dark}; margin-top: 4px; letter-spacing: .05em; }
    .body-wrap { background: ${C.white}; padding: 40px; border-top: 0; }
    .btn { display: inline-block; background: ${C.cherry}; color: ${C.white} !important; font-family: Georgia, serif; font-size: 14px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; padding: 16px 36px; border-radius: 4px; text-decoration: none; }
    .btn-secondary { display: inline-block; background: transparent; color: ${C.cherry} !important; font-family: Georgia, serif; font-size: 13px; font-weight: 700; letter-spacing: .1em; padding: 12px 28px; border-radius: 4px; border: 2px solid ${C.cherry}; text-decoration: none; }
    .divider { height: 1px; background: ${C.border}; margin: 28px 0; }
    .quote-block { border-left: 4px solid ${C.gold}; padding: 14px 20px; background: ${C.bg}; border-radius: 0 4px 4px 0; margin: 24px 0; }
    .quote-block p { font-style: italic; color: ${C.muted}; font-size: 15px; line-height: 1.8; }
    .footer { background: ${C.bg}; padding: 28px 40px; text-align: center; border-top: 1px solid ${C.border}; }
    .footer p { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: ${C.gold}; line-height: 1.8; }
    .footer a { color: ${C.muted}; font-size: 11px; }
    @media (max-width: 600px) {
      .body-wrap, .header, .footer { padding: 24px 20px !important; }
      .btn { display: block; text-align: center; }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};padding:32px 0;">
    <tr><td align="center">
      <div class="email-wrap">

        <!-- HEADER -->
        <div class="header">
          <div class="header-brand">Dayana Guerrero</div>
          <div class="header-title">CÓDIGOS de Mujeres</div>
        </div>

        <!-- BODY -->
        <div class="body-wrap">
          ${body}
        </div>

        <!-- FOOTER -->
        <div class="footer">
          <p>© ${year} Códigos de Mujeres · Dayana Guerrero</p>
          <p style="margin-top:8px;">
            ${isIt
              ? `Non vuoi più ricevere queste email? <a href="${unsub}">Cancella l'iscrizione qui</a>.`
              : isEs
                ? `¿Ya no quieres recibir estos correos? <a href="${unsub}">Cancela tu suscripción aquí</a>.`
                : `Don't want to receive these emails? <a href="${unsub}">Unsubscribe here</a>.`
            }
          </p>
          <p style="margin-top:8px;"><a href="${baseUrl()}" style="color:${C.cherry};">codigosdemujeres.com</a></p>
        </div>

      </div>
    </td></tr>
  </table>
  <!-- tracking pixel -->
  <img src="${pixel}" width="1" height="1" alt="" style="display:none;border:0;width:1px;height:1px;" />
</body>
</html>`;
}

// ─── Email 0: Welcome / free chapter ─────────────────────────────────────────
async function sendWelcomeEmail({ leadId, email, lang = "es", firstName }) {
  const isIt = lang === "it";
  const isEs = !isIt && lang !== "en";
  const sample = process.env.BOOK_SAMPLE_URL || `${baseUrl()}/api/store/sample?lang=${lang}`;
  const sampleTracked = clickTrackUrl(leadId, sample);
  const storeTracked  = clickTrackUrl(leadId, baseUrl());
  const greeting = firstName
    ? (isIt ? `Ciao, ${firstName}` : isEs ? `Hola, ${firstName}` : `Hello, ${firstName}`)
    : (isIt ? "Ciao, bellissima" : isEs ? "Hola, hermosa" : "Hello, beautiful");

  const subject = isIt
    ? "📖 Il tuo capitolo gratuito è qui"
    : isEs
      ? "📖 Tu capítulo gratuito está aquí"
      : "📖 Your free chapter is here";

  const preheader = isIt
    ? "Il primo passo della tua trasformazione inizia con questa lettura."
    : isEs
      ? "El primer paso de tu transformación comienza con esta lectura."
      : "The first step of your transformation starts with this read.";

  const body = isIt ? `
    <p style="font-family:Georgia,serif;font-size:22px;color:${C.cherry};font-weight:700;line-height:1.4;margin-bottom:20px;">
      ${greeting}. Il tuo capitolo ti aspetta.
    </p>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin-bottom:24px;">
      Grazie per aver fatto il primo passo. Quello che stai per leggere non sono semplici parole — sono <strong style="color:${C.dark};">codici che altre donne hanno usato per trasformare le proprie vite</strong> dall'interno verso l'esterno.
    </p>
    <div class="quote-block">
      <p>"Quando ho capito il mio primo codice, qualcosa dentro di me si è sistemato al suo posto. Come se l'avessi sempre saputo, ma finalmente qualcuno me lo avesse detto ad alta voce."</p>
    </div>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin-bottom:28px;">
      Quel momento ti sta aspettando. Leggilo quando puoi respirare a fondo ed essere semplicemente te stessa.
    </p>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${sampleTracked}" class="btn">Leggi il mio capitolo gratis →</a>
    </div>
    <div class="divider"></div>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:${C.gold};line-height:1.8;text-align:center;margin-bottom:20px;">
      Pronta per tutti e 15 i capitoli + audiolibro?
    </p>
    <div style="text-align:center;">
      <a href="${storeTracked}" class="btn-secondary">Scopri il libro completo</a>
    </div>
    <div class="divider"></div>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:${C.muted};line-height:1.8;">
      Con affetto e gratitudine,<br/>
      <strong style="color:${C.dark};font-family:Georgia,serif;font-size:15px;">Dayana Guerrero</strong>
    </p>
  ` : isEs ? `
    <p style="font-family:Georgia,serif;font-size:22px;color:${C.cherry};font-weight:700;line-height:1.4;margin-bottom:20px;">
      ${greeting}. Tu capítulo te espera.
    </p>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin-bottom:24px;">
      Gracias por dar el primer paso. Lo que estás a punto de leer no son solo palabras — son <strong style="color:${C.dark};">códigos que otras mujeres han usado para transformar sus vidas</strong> desde adentro hacia afuera.
    </p>
    <div class="quote-block">
      <p>"Cuando entendí mi primer código, algo dentro de mí se acomodó en su lugar. Como si siempre hubiera sabido esto, pero finalmente alguien me lo dijera en voz alta."</p>
    </div>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin-bottom:28px;">
      Ese momento te está esperando. Léelo cuando puedas respirar profundo y estar contigo misma.
    </p>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${sampleTracked}" class="btn">Leer mi capítulo gratis →</a>
    </div>
    <div class="divider"></div>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:${C.gold};line-height:1.8;text-align:center;margin-bottom:20px;">
      ¿Lista para los 15 capítulos completos + audiolibro?
    </p>
    <div style="text-align:center;">
      <a href="${storeTracked}" class="btn-secondary">Ver el libro completo</a>
    </div>
    <div class="divider"></div>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:${C.muted};line-height:1.8;">
      Con amor y gratitud,<br/>
      <strong style="color:${C.dark};font-family:Georgia,serif;font-size:15px;">Dayana Guerrero</strong>
    </p>
  ` : `
    <p style="font-family:Georgia,serif;font-size:22px;color:${C.cherry};font-weight:700;line-height:1.4;margin-bottom:20px;">
      ${greeting}. Your chapter is waiting.
    </p>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin-bottom:24px;">
      Thank you for taking the first step. What you're about to read isn't just words — they are <strong style="color:${C.dark};">codes that other women have used to transform their lives</strong> from the inside out.
    </p>
    <div class="quote-block">
      <p>"When I understood my first code, something inside me clicked into place. Like I always knew this, but someone finally said it out loud."</p>
    </div>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin-bottom:28px;">
      That moment is waiting for you. Read it when you can breathe deeply and just be with yourself.
    </p>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${sampleTracked}" class="btn">Read my free chapter →</a>
    </div>
    <div class="divider"></div>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:${C.gold};line-height:1.8;text-align:center;margin-bottom:20px;">
      Ready for all 15 chapters + audiobook?
    </p>
    <div style="text-align:center;">
      <a href="${storeTracked}" class="btn-secondary">See the full book</a>
    </div>
    <div class="divider"></div>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:${C.muted};line-height:1.8;">
      With love and gratitude,<br/>
      <strong style="color:${C.dark};font-family:Georgia,serif;font-size:15px;">Dayana Guerrero</strong>
    </p>
  `;

  await _mailer.sendMail({
    from:    `"Dayana Guerrero · CÓDIGOS" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to:      email,
    subject,
    html:    emailTemplate({ leadId, email, lang, preheader, body }),
  });
}

// ─── Email 1 (Day 3): Check-in / "¿Lo empezaste?" ────────────────────────────
async function sendDrip1({ leadId, email, lang = "es" }) {
  const isIt = lang === "it";
  const isEs = !isIt && lang !== "en";
  const sample = process.env.BOOK_SAMPLE_URL || `${baseUrl()}/api/store/sample?lang=${lang}`;
  const sampleTracked = clickTrackUrl(leadId, sample);

  const subject = isIt
    ? "Hai letto il tuo capitolo? 💌"
    : isEs
      ? "¿Ya leíste tu capítulo? 💌"
      : "Did you read your chapter? 💌";

  const preheader = isIt
    ? "C'è qualcosa che voglio condividere con te oggi."
    : isEs
      ? "Hay algo que quiero compartirte hoy."
      : "There's something I want to share with you today.";

  const body = isEs ? `
    <p style="font-family:Georgia,serif;font-size:20px;color:${C.cherry};font-weight:700;line-height:1.4;margin-bottom:20px;">
      Quería saber cómo estás.
    </p>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin-bottom:16px;">
      Hace unos días te compartí el primer capítulo de CÓDIGOS. Y pensé en ti hoy.
    </p>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin-bottom:16px;">
      Porque sé cómo es esto: la vida se llena de ruido, de pendientes, de "lo leo después"... y ese "después" a veces nunca llega.
    </p>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin-bottom:24px;">
      Hoy quiero pedirte algo: <strong style="color:${C.dark};">regálate 10 minutos.</strong> Solo para ti. Para leer. Para sentir. Para recordar que mereces ese espacio.
    </p>
    <div class="quote-block">
      <p>"El primer código que descubrí cambió la forma en que me hablaba a mí misma. Y eso lo cambió todo."<br/><span style="font-size:12px;color:${C.gold};">— Dayana</span></p>
    </div>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin:24px 0 28px;">
      Si aún no has leído el capítulo, aquí está esperándote:
    </p>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${sampleTracked}" class="btn">Retomar mi lectura →</a>
    </div>
    <div class="divider"></div>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:${C.muted};line-height:1.8;">
      Con amor,<br/>
      <strong style="color:${C.dark};font-family:Georgia,serif;font-size:15px;">Dayana</strong>
    </p>
  ` : `
    <p style="font-family:Georgia,serif;font-size:20px;color:${C.cherry};font-weight:700;line-height:1.4;margin-bottom:20px;">
      I wanted to check in on you.
    </p>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin-bottom:16px;">
      A few days ago I shared the first chapter of CODES with you. And I thought of you today.
    </p>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin-bottom:16px;">
      Because I know how it goes: life fills up with noise, to-dos, "I'll read it later"... and that "later" sometimes never comes.
    </p>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin-bottom:24px;">
      Today I want to ask one thing of you: <strong style="color:${C.dark};">give yourself 10 minutes.</strong> Just for you. To read. To feel. To remember you deserve that space.
    </p>
    <div class="quote-block">
      <p>"The first code I discovered changed the way I spoke to myself. And that changed everything."<br/><span style="font-size:12px;color:${C.gold};">— Dayana</span></p>
    </div>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin:24px 0 28px;">
      If you haven't read the chapter yet, here it is waiting for you:
    </p>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${sampleTracked}" class="btn">Pick up where I left off →</a>
    </div>
    <div class="divider"></div>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:${C.muted};line-height:1.8;">
      With love,<br/>
      <strong style="color:${C.dark};font-family:Georgia,serif;font-size:15px;">Dayana</strong>
    </p>
  `;

  await _mailer.sendMail({
    from:    `"Dayana Guerrero · CÓDIGOS" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to:      email,
    subject,
    html:    emailTemplate({ leadId, email, lang, preheader, body }),
  });
}

// ─── Email 2 (Day 7): Social proof / testimonials ─────────────────────────────
async function sendDrip2({ leadId, email, lang = "es" }) {
  const isIt = lang === "it";
  const isEs = !isIt && lang !== "en";
  const store = baseUrl();
  const storeTracked = clickTrackUrl(leadId, store + "/checkout");

  // Fetch live testimonials from DB (fall back to static copies if DB empty)
  let dbTestimonials = [];
  try {
    const { query } = require("../db");
    const { rows } = await query(
      `SELECT author, location, text_es, text_en FROM testimonials
       WHERE active = true ORDER BY sort_order ASC, id ASC LIMIT 3`
    );
    dbTestimonials = rows;
  } catch { /* silently use fallback */ }

  const FALLBACK = [
    { author: "Mariana V.", location: "México",          text_es: "Empecé a leer y no pude parar. Cada capítulo es como una conversación con alguien que te entiende profundamente.", text_en: "I started reading and couldn't stop. Every chapter feels like a conversation with someone who deeply understands you." },
    { author: "Sofía R.",   location: "Colombia",        text_es: "El código de los límites me hizo llorar. Llevaba años dando sin recibir y nunca supe por qué. Ahora lo entiendo.", text_en: "The chapter on boundaries made me cry. I'd been giving without receiving for years and never knew why. Now I understand." },
    { author: "Valeria M.", location: "Estados Unidos",  text_es: "Lo escuché en el audiolibro mientras manejaba al trabajo. Para cuando llegué, ya tenía otra perspectiva de mi vida.", text_en: "I listened to the audiobook while driving to work. By the time I arrived, I had a whole new perspective on my life." },
  ];
  const tList = dbTestimonials.length >= 3 ? dbTestimonials : FALLBACK;

  function renderTestimonial(t) {
    const text = lang === "en" && t.text_en ? t.text_en : t.text_es;
    return `
    <div class="quote-block">
      <p>"${text}"</p>
      <p style="margin-top:8px;font-size:12px;color:${C.gold};">— ${t.author}, ${t.location}</p>
    </div>`;
  }

  const subject = isEs
    ? "Lo que dicen las mujeres que ya leyeron CÓDIGOS ✨"
    : "What women who read CODES are saying ✨";

  const preheader = isEs
    ? "Sus palabras me llenaron el corazón. Quiero que las leas."
    : "Their words filled my heart. I want you to read them.";

  const renderedTestimonials = tList.map(t => renderTestimonial(t)).join("\n");

  const body = isEs ? `
    <p style="font-family:Georgia,serif;font-size:20px;color:${C.cherry};font-weight:700;line-height:1.4;margin-bottom:20px;">
      Esto me escribieron esta semana.
    </p>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin-bottom:24px;">
      Cada vez que recibo un mensaje como estos, confirmo por qué escribí este libro. Para ti. Para ellas. Para todas nosotras.
    </p>

    ${renderedTestimonials}

    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin:24px 0 8px;">
      Los 15 capítulos completos + audiolibro están disponibles hoy. Y sí — puedes acceder ahora mismo.
    </p>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:${C.gold};line-height:1.8;margin-bottom:28px;">
      Porque tu transformación no puede esperar más.
    </p>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${storeTracked}" class="btn">Quiero el libro completo →</a>
    </div>
    <div class="divider"></div>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:${C.muted};line-height:1.8;">
      Con amor eterno,<br/>
      <strong style="color:${C.dark};font-family:Georgia,serif;font-size:15px;">Dayana Guerrero</strong>
    </p>
  ` : `
    <p style="font-family:Georgia,serif;font-size:20px;color:${C.cherry};font-weight:700;line-height:1.4;margin-bottom:20px;">
      This is what women wrote to me this week.
    </p>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin-bottom:24px;">
      Every time I receive messages like these, I'm reminded why I wrote this book. For you. For them. For all of us.
    </p>

    ${renderedTestimonials}

    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin:24px 0 8px;">
      All 15 full chapters + audiobook are available today. And yes — you can access them right now.
    </p>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:${C.gold};line-height:1.8;margin-bottom:28px;">
      Because your transformation can't wait any longer.
    </p>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${storeTracked}" class="btn">I want the full book →</a>
    </div>
    <div class="divider"></div>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:${C.muted};line-height:1.8;">
      With eternal love,<br/>
      <strong style="color:${C.dark};font-family:Georgia,serif;font-size:15px;">Dayana Guerrero</strong>
    </p>
  `;

  await _mailer.sendMail({
    from:    `"Dayana Guerrero · CÓDIGOS" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to:      email,
    subject,
    html:    emailTemplate({ leadId, email, lang, preheader, body }),
  });
}

// ─── Email 3 (Day 14): Final offer ───────────────────────────────────────────
async function sendDrip3({ leadId, email, lang = "es" }) {
  const isIt = lang === "it";
  const isEs = !isIt && lang !== "en";
  const storeTracked = clickTrackUrl(leadId, baseUrl() + "/checkout");

  const subject = isEs
    ? "Un último mensaje desde mi corazón 💛"
    : "One last message from my heart 💛";

  const preheader = isEs
    ? "Si algo de esto te ha resonado, necesito decirte algo."
    : "If any of this has resonated with you, I need to tell you something.";

  const body = isEs ? `
    <p style="font-family:Georgia,serif;font-size:20px;color:${C.cherry};font-weight:700;line-height:1.4;margin-bottom:20px;">
      Quiero ser honesta contigo.
    </p>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin-bottom:16px;">
      Hace unas semanas llegaste a mi mundo. Leíste (o quisiste leer) el primer capítulo. Y yo he estado aquí, pensando en ti.
    </p>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin-bottom:16px;">
      Sé que hay algo dentro de ti que busca más. Más claridad. Más paz. Más de ti misma.
    </p>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin-bottom:24px;">
      Por eso escribí los 15 códigos completos. Porque <strong style="color:${C.dark};">una sola lectura puede cambiar la conversación que tienes contigo misma para siempre.</strong>
    </p>
    <div class="quote-block">
      <p>"No esperes a estar 'lista'. La transformación no llega cuando estás lista. Llega cuando decides que ya es suficiente seguir igual."<br/><span style="font-size:12px;color:${C.gold};">— Dayana Guerrero</span></p>
    </div>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin:24px 0 8px;">
      CÓDIGOS incluye:
    </p>
    <ul style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:${C.muted};line-height:2;margin:0 0 24px 20px;">
      <li>📖 Ebook completo: 15 capítulos de transformación real</li>
      <li>🎧 Audiolibro: escúchalo donde vayas</li>
      <li>⚡ Acceso inmediato — sin esperas</li>
    </ul>
    <div style="text-align:center;margin-bottom:12px;">
      <a href="${storeTracked}" class="btn">Sí, quiero mi transformación →</a>
    </div>
    <p style="text-align:center;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:${C.gold};margin-bottom:28px;">
      Acceso instantáneo · Pago seguro · Garantía de satisfacción
    </p>
    <div class="divider"></div>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:${C.muted};line-height:1.8;">
      Si no es el momento, no hay problema. Siempre estaré aquí.<br/><br/>
      Con amor real,<br/>
      <strong style="color:${C.dark};font-family:Georgia,serif;font-size:15px;">Dayana Guerrero</strong>
    </p>
  ` : `
    <p style="font-family:Georgia,serif;font-size:20px;color:${C.cherry};font-weight:700;line-height:1.4;margin-bottom:20px;">
      I want to be honest with you.
    </p>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin-bottom:16px;">
      A few weeks ago you entered my world. You read (or wanted to read) the first chapter. And I've been here, thinking of you.
    </p>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin-bottom:16px;">
      I know there's something inside you searching for more. More clarity. More peace. More of yourself.
    </p>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin-bottom:24px;">
      That's why I wrote all 15 codes. Because <strong style="color:${C.dark};">a single read can change the conversation you have with yourself forever.</strong>
    </p>
    <div class="quote-block">
      <p>"Don't wait until you're 'ready'. Transformation doesn't come when you're ready. It comes when you decide it's enough to stay the same."<br/><span style="font-size:12px;color:${C.gold};">— Dayana Guerrero</span></p>
    </div>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:${C.muted};line-height:1.8;margin:24px 0 8px;">
      CODES includes:
    </p>
    <ul style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:${C.muted};line-height:2;margin:0 0 24px 20px;">
      <li>📖 Full ebook: 15 chapters of real transformation</li>
      <li>🎧 Audiobook: listen wherever you go</li>
      <li>⚡ Instant access — no waiting</li>
    </ul>
    <div style="text-align:center;margin-bottom:12px;">
      <a href="${storeTracked}" class="btn">Yes, I want my transformation →</a>
    </div>
    <p style="text-align:center;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:${C.gold};margin-bottom:28px;">
      Instant access · Secure payment · Satisfaction guarantee
    </p>
    <div class="divider"></div>
    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:${C.muted};line-height:1.8;">
      If it's not the right time, no worries. I'll always be here.<br/><br/>
      With real love,<br/>
      <strong style="color:${C.dark};font-family:Georgia,serif;font-size:15px;">Dayana Guerrero</strong>
    </p>
  `;

  await _mailer.sendMail({
    from:    `"Dayana Guerrero · CÓDIGOS" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to:      email,
    subject,
    html:    emailTemplate({ leadId, email, lang, preheader, body }),
  });
}

// ─── Broadcast (admin) ────────────────────────────────────────────────────────
async function sendBroadcast({ leadId, email, lang = "es", subject, htmlBody }) {
  const html = emailTemplate({ leadId, email, lang, preheader: "", body: htmlBody });
  await _mailer.sendMail({
    from: `"Dayana Guerrero · CÓDIGOS" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to:   email,
    subject,
    html,
  });
}

// ─── Drip dispatcher ─────────────────────────────────────────────────────────
async function sendDripStep({ step, leadId, email, lang }) {
  if (step === 1) return sendDrip1({ leadId, email, lang });
  if (step === 2) return sendDrip2({ leadId, email, lang });
  if (step === 3) return sendDrip3({ leadId, email, lang });
  throw new Error(`Unknown drip step: ${step}`);
}

module.exports = {
  sendWelcomeEmail,
  sendDripStep,
  sendBroadcast,
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
  openPixelUrl,
  clickTrackUrl,
  emailTemplate,
};
