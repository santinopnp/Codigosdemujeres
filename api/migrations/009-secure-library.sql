-- 009-secure-library.sql
-- Secure digital library: chapter content + reading progress tracking

CREATE TABLE IF NOT EXISTS book_chapters (
  id SERIAL PRIMARY KEY,
  format TEXT NOT NULL CHECK (format IN ('ebook', 'audio')),
  chapter_number INT NOT NULL,
  title_es TEXT NOT NULL,
  title_en TEXT,
  body_es TEXT,
  body_en TEXT,
  audio_url TEXT,
  duration_seconds INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (format, chapter_number)
);

CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES book_orders(id),
  format TEXT NOT NULL CHECK (format IN ('ebook', 'audio')),
  chapter_number INT NOT NULL DEFAULT 1,
  position NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_id, format)
);

CREATE INDEX IF NOT EXISTS idx_chapters_format ON book_chapters (format, chapter_number);
CREATE INDEX IF NOT EXISTS idx_progress_order ON reading_progress (order_id);
