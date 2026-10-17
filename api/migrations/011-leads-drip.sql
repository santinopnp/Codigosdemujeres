-- Migration 011: Lead drip sequence & engagement tracking
-- Adds unsubscribe, drip step tracking, and open/click counters to the leads table.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS unsubscribed_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_sequence_step INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_emailed_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS open_count          INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS click_count         INT NOT NULL DEFAULT 0;

-- Index for the drip scheduler query (finds leads due for each step)
CREATE INDEX IF NOT EXISTS idx_leads_drip
  ON leads (email_sequence_step, last_emailed_at, newsletter_opt_in, unsubscribed_at);
