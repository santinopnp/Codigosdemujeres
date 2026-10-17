// ─── Backend Site Configuration ──────────────────────────────────────────────
// Edit this file to rebrand the store for a new product.
// Prices here MUST match src/config/site.ts on the frontend.

"use strict";

module.exports = {
  productName: "CÓDIGOS",
  formats: {
    // Books
    ebook:            5.99,
    audio:            5.99,
    bundle:           10.99,
    // Coaching sessions
    coaching_orient:  29.99,
    coaching_single:  59.99,
    coaching_pack:    149.99,
    coaching_monthly: 199.99,
    // Digital resources
    workbook:         7.99,
    masterclass:      19.99,
  },
  // Product type lookup (used for fulfillment routing)
  productTypes: {
    ebook: "book", audio: "book", bundle: "book",
    coaching_orient: "coaching", coaching_single: "coaching",
    coaching_pack: "coaching", coaching_monthly: "coaching",
    workbook: "digital", masterclass: "digital",
  },
  downloadExpiryDays: 30,
  email: {
    fromName: "CÓDIGOS",
    fromAddress: null, // falls back to SMTP_FROM or SMTP_USER env var
  },
};
