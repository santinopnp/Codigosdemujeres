-- 016-italian-language.sql
-- Add Italian language columns to all translatable tables

-- Blog posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS title_it   TEXT NOT NULL DEFAULT '';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_it TEXT NOT NULL DEFAULT '';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS body_it    TEXT NOT NULL DEFAULT '';

-- Testimonials
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS text_it TEXT NOT NULL DEFAULT '';

-- Book chapters (ebook + audio)
ALTER TABLE book_chapters ADD COLUMN IF NOT EXISTS title_it TEXT;
ALTER TABLE book_chapters ADD COLUMN IF NOT EXISTS body_it  TEXT;
