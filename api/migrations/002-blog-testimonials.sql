-- Blog posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT        UNIQUE NOT NULL,
  title_es     TEXT        NOT NULL,
  title_en     TEXT        NOT NULL DEFAULT '',
  excerpt_es   TEXT        NOT NULL DEFAULT '',
  excerpt_en   TEXT        NOT NULL DEFAULT '',
  body_es      TEXT        NOT NULL DEFAULT '',
  body_en      TEXT        NOT NULL DEFAULT '',
  image_url    TEXT,
  read_min     INT         NOT NULL DEFAULT 3,
  published    BOOLEAN     NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  fb_post_id   TEXT,
  ig_post_id   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug      ON blog_posts (slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts (published, published_at DESC);

CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_blog_posts_updated_at();

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  author     TEXT        NOT NULL,
  location   TEXT        NOT NULL DEFAULT '',
  text_es    TEXT        NOT NULL,
  text_en    TEXT        NOT NULL DEFAULT '',
  stars      INT         NOT NULL DEFAULT 5 CHECK (stars BETWEEN 1 AND 5),
  sort_order INT         NOT NULL DEFAULT 0,
  active     BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_active ON testimonials (active, sort_order);
