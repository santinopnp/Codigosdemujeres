-- 010-leads-newsletter.sql
-- Add newsletter opt-in tracking to leads

ALTER TABLE leads ADD COLUMN IF NOT EXISTS newsletter_opt_in BOOLEAN NOT NULL DEFAULT false;
