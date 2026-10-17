-- Add post_type to distinguish regular articles from short social posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS post_type TEXT NOT NULL DEFAULT 'article'
  CHECK (post_type IN ('article', 'social'));

-- Hashtags for social posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS hashtags TEXT NOT NULL DEFAULT '';
