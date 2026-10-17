-- 008-easy-social.sql
-- Add scheduling, social publishing, AI generation, campaigns, and metrics support

-- Add scheduling support to blog_posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS publish_to_ig BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS publish_to_fb BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS tone TEXT NOT NULL DEFAULT 'casual';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'social'
  CHECK (content_type IN ('blog', 'ig_post', 'fb_post', 'ig_story', 'ig_reel', 'carousel'));
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS campaign_id UUID;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT false;

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'paused')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI generation history
CREATE TABLE IF NOT EXISTS ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  tone TEXT NOT NULL,
  content_type TEXT NOT NULL,
  generated_text TEXT NOT NULL,
  accepted BOOLEAN,
  post_id UUID REFERENCES blog_posts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Social metrics snapshots
CREATE TABLE IF NOT EXISTS social_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id),
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook')),
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  reach INT DEFAULT 0,
  impressions INT DEFAULT 0,
  engagement_rate NUMERIC(5,2) DEFAULT 0,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts ON blog_posts (scheduled_at) WHERE scheduled_at IS NOT NULL AND published = false;
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns (status);
CREATE INDEX IF NOT EXISTS idx_social_metrics_post ON social_metrics (post_id, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generations_type ON ai_generations (content_type, created_at DESC);
