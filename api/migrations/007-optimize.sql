-- ============================================================================
-- 007-optimize.sql  --  Performance indexes, generic trigger, partial indexes
-- ============================================================================

-- ─── 1. Generic updated_at trigger function (reusable across all tables) ─────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Migrate conversations to use the generic trigger
DROP TRIGGER IF EXISTS trg_conversations_updated_at ON conversations;
CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── 2. book_orders -- dashboard & revenue indexes ──────────────────────────

-- Partial index: paid orders only (used by revenue, revenueByPeriod, ordersByDay)
CREATE INDEX IF NOT EXISTS idx_book_orders_paid
  ON book_orders (paid_at DESC)
  WHERE status = 'paid';

-- Composite for revenue-by-period queries (status + paid_at + amount)
CREATE INDEX IF NOT EXISTS idx_book_orders_paid_revenue
  ON book_orders (status, paid_at, amount_usd)
  WHERE status = 'paid';

-- Composite for ordersByDay dashboard widget (created_at date + status)
CREATE INDEX IF NOT EXISTS idx_book_orders_created_day
  ON book_orders (created_at DESC);

-- Composite for ordersByFormat (format + status covering amount)
CREATE INDEX IF NOT EXISTS idx_book_orders_format_status
  ON book_orders (format, status);

-- Composite for listAll with status filter + pagination
CREATE INDEX IF NOT EXISTS idx_book_orders_status_created
  ON book_orders (status, created_at DESC);

-- Provider ref lookup (used in webhook idempotency checks)
CREATE INDEX IF NOT EXISTS idx_book_orders_provider_ref
  ON book_orders (provider_ref)
  WHERE provider_ref IS NOT NULL;

-- Partial index: pending orders older than 1 hour (useful for cleanup jobs)
CREATE INDEX IF NOT EXISTS idx_book_orders_pending_stale
  ON book_orders (created_at)
  WHERE status = 'pending';

-- ─── 3. leads -- analytics indexes ──────────────────────────────────────────

-- countByDay query: created_at range scan
CREATE INDEX IF NOT EXISTS idx_leads_created_at
  ON leads (created_at DESC);

-- Source analysis
CREATE INDEX IF NOT EXISTS idx_leads_source
  ON leads (source);

-- ─── 4. blog_posts -- content listing indexes ───────────────────────────────

-- Post type filtering (social vs article)
CREATE INDEX IF NOT EXISTS idx_blog_posts_type
  ON blog_posts (post_type, published, published_at DESC);

-- ─── 5. conversations -- chat performance ───────────────────────────────────

-- getOrCreateConversation: channel + customer_id + non-escalated + recent
CREATE INDEX IF NOT EXISTS idx_conversations_active
  ON conversations (channel, customer_id, updated_at DESC)
  WHERE escalated = false;

-- chat_messages: efficient history retrieval already covered by idx_chat_msgs_conv
-- Add covering index for last-message subquery in listConversations
CREATE INDEX IF NOT EXISTS idx_chat_msgs_latest
  ON chat_messages (conversation_id, created_at DESC);

-- ─── 6. Analyze all tables to update planner statistics ─────────────────────
ANALYZE book_orders;
ANALYZE leads;
ANALYZE blog_posts;
ANALYZE testimonials;
ANALYZE conversations;
ANALYZE chat_messages;
