-- Migration 002: expand format check constraint to include coaching and digital products
ALTER TABLE book_orders
  DROP CONSTRAINT IF EXISTS book_orders_format_check;

ALTER TABLE book_orders
  ADD CONSTRAINT book_orders_format_check
  CHECK (format IN (
    'ebook', 'audio', 'bundle',
    'coaching_orient', 'coaching_single', 'coaching_pack', 'coaching_monthly',
    'workbook', 'masterclass'
  ));
