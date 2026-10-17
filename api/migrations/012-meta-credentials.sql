-- 012-meta-credentials.sql
-- Stores Facebook Page + Instagram credentials obtained via OAuth
-- This allows the admin to connect Meta accounts without setting env vars manually

CREATE TABLE IF NOT EXISTS meta_credentials (
  page_id              TEXT PRIMARY KEY,
  page_name            TEXT,
  page_access_token    TEXT NOT NULL,
  instagram_account_id TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
