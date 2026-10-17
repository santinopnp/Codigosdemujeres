-- Admin document vault
CREATE TABLE IF NOT EXISTS admin_documents (
  id          SERIAL PRIMARY KEY,
  filename    TEXT NOT NULL,
  label       TEXT NOT NULL,
  mime_type   TEXT NOT NULL DEFAULT 'application/octet-stream',
  size_bytes  BIGINT NOT NULL DEFAULT 0,
  category    TEXT NOT NULL DEFAULT 'general',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
