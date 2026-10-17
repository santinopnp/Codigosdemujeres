"use strict";
const nodemailer = require("nodemailer");

/**
 * Create a nodemailer transporter using the project's SMTP env vars.
 */
function mailer() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

/**
 * Send an EPUB file to a Kindle email address.
 *
 * Amazon Kindle accepts EPUB files sent as email attachments to
 * username@kindle.com. The sender must be in the user's approved
 * senders list on Amazon (Manage Your Content and Devices > Preferences).
 *
 * @param {Buffer} epubBuffer - The EPUB file as a Buffer
 * @param {string} kindleEmail - The recipient's Kindle email (e.g. user@kindle.com)
 * @param {string} senderEmail - The "from" address (must be approved by the recipient)
 * @returns {Promise<void>}
 */
async function sendToKindle(epubBuffer, kindleEmail, senderEmail) {
  if (!kindleEmail || !kindleEmail.includes("@")) {
    throw new Error("Invalid Kindle email address");
  }

  const from = senderEmail || process.env.SMTP_FROM || process.env.SMTP_USER;

  await mailer().sendMail({
    from:    `"CODIGOS" <${from}>`,
    to:      kindleEmail,
    subject: "CODIGOS — Codigos que toda mujer necesita saber",
    text:    "Your book is attached. Enjoy reading!",
    attachments: [
      {
        filename:    "codigos.epub",
        content:     epubBuffer,
        contentType: "application/epub+zip",
      },
    ],
  });
}

module.exports = { sendToKindle };
