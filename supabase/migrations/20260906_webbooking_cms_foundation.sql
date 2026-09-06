-- Webbooking CMS/SEO foundation. Apply in Supabase only after reviewing the
-- production schema audit. This migration is additive and does not alter booking tables.

CREATE OR REPLACE FUNCTION public.webbooking_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public."WebbookingAdminUsers" (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'reception')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public."WebbookingContentRevisions" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key TEXT NOT NULL,
  payload JSONB NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT webbooking_content_revisions_payload_is_object
    CHECK (jsonb_typeof(payload) IN ('object', 'array'))
);

CREATE INDEX IF NOT EXISTS webbooking_content_revisions_key_created_idx
  ON public."WebbookingContentRevisions" (content_key, created_at DESC);

CREATE TABLE IF NOT EXISTS public."WebbookingBlogPosts" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title JSONB NOT NULL DEFAULT '{}'::jsonb,
  excerpt JSONB NOT NULL DEFAULT '{}'::jsonb,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  category_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_time_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  cover_image TEXT,
  cover_type TEXT NOT NULL DEFAULT 'image' CHECK (cover_type IN ('image', 'video')),
  cover_alt JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  published_at TIMESTAMPTZ,
  author TEXT,
  seo_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT webbooking_blog_posts_title_is_object CHECK (jsonb_typeof(title) = 'object'),
  CONSTRAINT webbooking_blog_posts_excerpt_is_object CHECK (jsonb_typeof(excerpt) = 'object'),
  CONSTRAINT webbooking_blog_posts_content_is_object CHECK (jsonb_typeof(content) = 'object'),
  CONSTRAINT webbooking_blog_posts_category_is_object CHECK (jsonb_typeof(category_i18n) = 'object'),
  CONSTRAINT webbooking_blog_posts_read_time_is_object CHECK (jsonb_typeof(read_time_i18n) = 'object'),
  CONSTRAINT webbooking_blog_posts_cover_alt_is_object CHECK (jsonb_typeof(cover_alt) = 'object')
);

CREATE INDEX IF NOT EXISTS webbooking_blog_posts_visible_idx
  ON public."WebbookingBlogPosts" (published_at DESC)
  WHERE status IN ('published', 'scheduled');

CREATE TABLE IF NOT EXISTS public."WebbookingLostFound" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL DEFAULT 'other' CHECK (item_type IN ('glasses', 'accessory', 'tech', 'other')),
  title JSONB NOT NULL DEFAULT '{}'::jsonb,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  found_at JSONB NOT NULL DEFAULT '{}'::jsonb,
  found_on DATE NOT NULL DEFAULT CURRENT_DATE,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'contacting', 'returned')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  claimant_name TEXT,
  claimant_phone TEXT,
  claimant_email TEXT,
  claim_note TEXT,
  claim_locale TEXT CHECK (claim_locale IN ('vi', 'en', 'cn', 'jp', 'kr')),
  claim_status TEXT NOT NULL DEFAULT 'none' CHECK (claim_status IN ('none', 'new', 'contacted', 'resolved', 'archived')),
  claim_created_at TIMESTAMPTZ,
  claim_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT webbooking_lost_found_title_is_object CHECK (jsonb_typeof(title) = 'object'),
  CONSTRAINT webbooking_lost_found_detail_is_object CHECK (jsonb_typeof(detail) = 'object'),
  CONSTRAINT webbooking_lost_found_found_at_is_object CHECK (jsonb_typeof(found_at) = 'object'),
  CONSTRAINT webbooking_lost_found_claim_requires_contact CHECK (
    claim_status = 'none' OR (
      NULLIF(BTRIM(COALESCE(claimant_name, '')), '') IS NOT NULL
      AND NULLIF(BTRIM(COALESCE(claim_note, '')), '') IS NOT NULL
      AND (
        NULLIF(BTRIM(COALESCE(claimant_phone, '')), '') IS NOT NULL
        OR NULLIF(BTRIM(COALESCE(claimant_email, '')), '') IS NOT NULL
      )
    )
  )
);

CREATE INDEX IF NOT EXISTS webbooking_lost_found_triage_idx
  ON public."WebbookingLostFound" (status, claim_status, found_on DESC);

DROP TRIGGER IF EXISTS webbooking_admin_users_set_updated_at ON public."WebbookingAdminUsers";
CREATE TRIGGER webbooking_admin_users_set_updated_at
BEFORE UPDATE ON public."WebbookingAdminUsers"
FOR EACH ROW EXECUTE FUNCTION public.webbooking_set_updated_at();

DROP TRIGGER IF EXISTS webbooking_blog_posts_set_updated_at ON public."WebbookingBlogPosts";
CREATE TRIGGER webbooking_blog_posts_set_updated_at
BEFORE UPDATE ON public."WebbookingBlogPosts"
FOR EACH ROW EXECUTE FUNCTION public.webbooking_set_updated_at();

DROP TRIGGER IF EXISTS webbooking_lost_found_set_updated_at ON public."WebbookingLostFound";
CREATE TRIGGER webbooking_lost_found_set_updated_at
BEFORE UPDATE ON public."WebbookingLostFound"
FOR EACH ROW EXECUTE FUNCTION public.webbooking_set_updated_at();

ALTER TABLE public."WebbookingAdminUsers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WebbookingContentRevisions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WebbookingBlogPosts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WebbookingLostFound" ENABLE ROW LEVEL SECURITY;

-- Server API routes use SUPABASE_SERVICE_ROLE_KEY and bypass RLS. No browser-side
-- policies are created for these CMS tables.
-- After applying this migration, grant the first administrator explicitly:
-- INSERT INTO public."WebbookingAdminUsers" (user_id, role)
-- VALUES ('<AUTH_USERS_ID>', 'owner')
-- ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, is_active = true;

-- Three initial records keep both the public page and CMS testable immediately.
-- They are inserted only when this new table is empty and can be edited or removed in Admin.
INSERT INTO public."WebbookingLostFound" (
  item_type, title, detail, found_at, found_on, image_url, status, sort_order
)
SELECT *
FROM (
  VALUES
    (
      'glasses',
      '{"vi":"Kính gọng nâu","en":"Tortoiseshell glasses","jp":"べっ甲柄のメガネ","kr":"갈색 뿔테 안경","cn":"玳瑁色眼镜"}'::jsonb,
      '{"vi":"Được giữ lại sau một buổi chăm sóc buổi chiều.","en":"Kept after an afternoon care appointment.","jp":"午後のケアの後にお預かりしています。","kr":"오후 케어 후 보관 중입니다.","cn":"在下午护理结束后被妥善保管。"}'::jsonb,
      '{"vi":"Khu vực chờ - Ngô Đức Kế","en":"Waiting area - Ngo Duc Ke","jp":"待合スペース - Ngô Đức Kế","kr":"대기 공간 - Ngô Đức Kế","cn":"等候区 - Ngô Đức Kế"}'::jsonb,
      DATE '2026-09-01', '/images/lost-and-found/found-glasses.png', 'available', 30
    ),
    (
      'accessory',
      '{"vi":"Khăn lụa màu kem","en":"Cream silk scarf","jp":"クリーム色のシルクスカーフ","kr":"크림색 실크 스카프","cn":"奶油色丝巾"}'::jsonb,
      '{"vi":"Được xếp gọn sau ghế trong phòng trị liệu.","en":"Folded carefully after a therapy room visit.","jp":"施術室の椅子のそばで丁寧に畳んで保管しています。","kr":"테라피 룸 방문 후 정성스럽게 접어 보관했습니다.","cn":"在护理室座椅旁被细心折好并保管。"}'::jsonb,
      '{"vi":"Phòng trị liệu - Thi Sách","en":"Therapy room - Thi Sach","jp":"施術室 - Thi Sách","kr":"테라피 룸 - Thi Sách","cn":"护理室 - Thi Sách"}'::jsonb,
      DATE '2026-08-30', '/images/lost-and-found/found-silk-scarf.png', 'available', 20
    ),
    (
      'tech',
      '{"vi":"Hộp tai nghe màu đen","en":"Black earbud case","jp":"黒いイヤホンケース","kr":"검은 이어버드 케이스","cn":"黑色耳机盒"}'::jsonb,
      '{"vi":"Được tìm thấy gần khu vực thanh toán.","en":"Found close to the payment counter.","jp":"お会計カウンターの近くで見つかりました。","kr":"결제 카운터 근처에서 발견되었습니다.","cn":"在付款柜台附近被发现。"}'::jsonb,
      '{"vi":"Quầy tiếp đón - Ngô Đức Kế","en":"Reception - Ngo Duc Ke","jp":"受付 - Ngô Đức Kế","kr":"리셉션 - Ngô Đức Kế","cn":"前台 - Ngô Đức Kế"}'::jsonb,
      DATE '2026-08-27', '/images/lost-and-found/found-earbud-case.png', 'contacting', 10
    )
) AS seed(item_type, title, detail, found_at, found_on, image_url, status, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public."WebbookingLostFound");

-- Optional one-time legacy blog copy. It intentionally leaves public.blog_posts intact.
DO $$
BEGIN
  IF to_regclass('public.blog_posts') IS NOT NULL THEN
    INSERT INTO public."WebbookingBlogPosts" (
      id, slug, title, excerpt, content, category_i18n, read_time_i18n,
      cover_image, cover_type, status, published_at, author, seo_metadata,
      created_at, updated_at
    )
    SELECT
      (legacy ->> 'id')::uuid,
      legacy ->> 'slug',
      COALESCE(legacy -> 'title', '{}'::jsonb),
      COALESCE(legacy -> 'excerpt', '{}'::jsonb),
      COALESCE(legacy -> 'content', '{}'::jsonb),
      jsonb_strip_nulls(jsonb_build_object('vi', legacy ->> 'category', 'en', legacy ->> 'category')),
      jsonb_strip_nulls(jsonb_build_object('vi', legacy ->> 'read_time', 'en', legacy ->> 'read_time')),
      NULLIF(legacy ->> 'cover_image', ''),
      COALESCE(NULLIF(legacy ->> 'cover_type', ''), 'image'),
      COALESCE(NULLIF(legacy ->> 'status', ''), 'draft'),
      NULLIF(legacy ->> 'published_at', '')::timestamptz,
      NULLIF(legacy ->> 'author', ''),
      COALESCE(legacy -> 'seo_metadata', '{}'::jsonb),
      COALESCE(NULLIF(legacy ->> 'created_at', '')::timestamptz, timezone('utc'::text, now())),
      COALESCE(NULLIF(legacy ->> 'updated_at', '')::timestamptz, timezone('utc'::text, now()))
    FROM (
      SELECT to_jsonb(blog_posts) AS legacy
      FROM public.blog_posts
    ) AS source
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END;
$$;
