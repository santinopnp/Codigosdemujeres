-- Códigos standalone book orders table
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS book_orders (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT        NOT NULL,
  format              TEXT        NOT NULL CHECK (format IN ('ebook', 'audio', 'bundle')),
  amount_usd          NUMERIC(8,2) NOT NULL,
  payment_method      TEXT        NOT NULL CHECK (payment_method IN ('card', 'crypto')),
  payment_provider    TEXT        CHECK (payment_provider IN ('epayco', 'daimo', 'stripe')),
  status              TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  download_token      UUID        UNIQUE DEFAULT gen_random_uuid(),
  paid_at             TIMESTAMPTZ,
  download_expires_at TIMESTAMPTZ,
  provider_ref        TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_book_orders_email  ON book_orders (email);
CREATE INDEX IF NOT EXISTS idx_book_orders_status ON book_orders (status);
CREATE INDEX IF NOT EXISTS idx_book_orders_token  ON book_orders (download_token);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_book_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_book_orders_updated_at ON book_orders;
CREATE TRIGGER trg_book_orders_updated_at
  BEFORE UPDATE ON book_orders
  FOR EACH ROW EXECUTE FUNCTION update_book_orders_updated_at();
