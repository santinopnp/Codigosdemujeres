"use strict";
const leads    = require("../models/leadModel");
const emailSvc = require("./leadEmailService");

// ─── Drip schedule ────────────────────────────────────────────────────────────
// step 0 = welcome sent. Scheduler sends steps 1, 2, 3.
// minDaysAfterLast = how many days since last_emailed_at before sending next email.
const DRIP_STEPS = [
  { currentStep: 0, nextStep: 1, minDaysAfterLast: 3  }, // welcome → drip1: day 3
  { currentStep: 1, nextStep: 2, minDaysAfterLast: 4  }, // drip1  → drip2: day 7
  { currentStep: 2, nextStep: 3, minDaysAfterLast: 7  }, // drip2  → drip3: day 14
];

// ─── Run one drip pass ────────────────────────────────────────────────────────
async function runDrip() {
  for (const { currentStep, nextStep, minDaysAfterLast } of DRIP_STEPS) {
    let due;
    try {
      due = await leads.getLeadsDueForDrip(currentStep, minDaysAfterLast);
    } catch (err) {
      console.error(`[drip] Failed to query step ${currentStep}:`, err.message);
      continue;
    }

    if (due.length > 0) {
      console.log(`[drip] Sending step ${nextStep} to ${due.length} lead(s)`);
    }

    for (const lead of due) {
      try {
        await emailSvc.sendDripStep({ step: nextStep, leadId: lead.id, email: lead.email, lang: lead.lang });
        await leads.markEmailSent(lead.id, nextStep);
      } catch (err) {
        console.error(`[drip] Failed sending step ${nextStep} to ${lead.email}:`, err.message);
        // Continue to next lead — don't abort the whole pass on a single failure
      }
    }
  }
}

// ─── Scheduler bootstrap ──────────────────────────────────────────────────────
// Runs the drip pass once on startup (after a short delay) then every hour.
function start() {
  // Initial run after 2 minutes — let the server fully boot first
  const initialDelay = 2 * 60 * 1000;
  const interval     = 60 * 60 * 1000; // hourly

  setTimeout(async () => {
    console.log("[drip] Running initial drip pass");
    await runDrip().catch(err => console.error("[drip] initial pass error:", err.message));

    setInterval(() => {
      runDrip().catch(err => console.error("[drip] interval pass error:", err.message));
    }, interval);
  }, initialDelay);

  console.log("[drip] Scheduler started — first pass in 2 minutes, then hourly");
}

module.exports = { start, runDrip };
