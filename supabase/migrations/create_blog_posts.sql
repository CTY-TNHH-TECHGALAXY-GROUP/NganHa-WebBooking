-- Run this once in Supabase SQL Editor.
-- Daily articles are rows in blog_posts; published_at controls when each row appears.

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title JSONB NOT NULL DEFAULT '{}'::jsonb,
  excerpt JSONB NOT NULL DEFAULT '{}'::jsonb,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  cover_image TEXT,
  cover_type TEXT NOT NULL DEFAULT 'image' CHECK (cover_type IN ('image', 'video')),
  category TEXT,
  author TEXT,
  read_time TEXT,
  seo_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT blog_posts_title_is_object CHECK (jsonb_typeof(title) = 'object'),
  CONSTRAINT blog_posts_excerpt_is_object CHECK (jsonb_typeof(excerpt) = 'object'),
  CONSTRAINT blog_posts_content_is_object CHECK (jsonb_typeof(content) = 'object')
);

-- Safe upgrade when the first version of this table was already created.
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS cover_type TEXT NOT NULL DEFAULT 'image'
    CHECK (cover_type IN ('image', 'video'));

CREATE INDEX IF NOT EXISTS blog_posts_published_idx
  ON public.blog_posts (published_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS blog_posts_category_idx
  ON public.blog_posts (category);

CREATE OR REPLACE FUNCTION public.set_blog_posts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_posts_set_updated_at ON public.blog_posts;
CREATE TRIGGER blog_posts_set_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.set_blog_posts_updated_at();

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public visitors read through the server-side /api/posts route.
-- Admin APIs use SUPABASE_SERVICE_ROLE_KEY and bypass RLS.
