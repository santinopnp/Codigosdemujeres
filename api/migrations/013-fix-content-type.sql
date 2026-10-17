-- 013-fix-content-type.sql
-- The original check constraint excluded 'social' even though it was set as the column default.
-- This caused every insert without an explicit content_type to fail.

ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_content_type_check;

ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_content_type_check
  CHECK (content_type IN ('blog', 'ig_post', 'fb_post', 'ig_story', 'ig_reel', 'carousel', 'social'));
