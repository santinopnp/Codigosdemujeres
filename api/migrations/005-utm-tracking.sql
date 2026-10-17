-- Add UTM tracking to book orders
ALTER TABLE book_orders ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE book_orders ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE book_orders ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
