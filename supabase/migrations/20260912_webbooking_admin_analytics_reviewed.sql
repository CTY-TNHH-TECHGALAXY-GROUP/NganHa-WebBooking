-- REVIEWED DRAFT ONLY. Apply only after the read-only preflight has been
-- reviewed against the target Supabase project. Never run this file blindly
-- against production.
--
-- Scope: admin capability storage, analytics storage, and the existing
-- media-uploads mutation boundary. No booking, content, SEO, or UI objects
-- are changed. The transaction must be allowed to roll back on any error.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- The old draft searched every CHECK definition containing the word "role".
-- Require the known foundation constraint instead, so an unexpected live
-- schema stops the transaction and is handled by a new reviewed migration.
DO $$
DECLARE
  role_check_definition TEXT;
BEGIN
  IF to_regclass('public."WebbookingAdminUsers"') IS NULL THEN
    RAISE EXCEPTION 'Preflight required: public."WebbookingAdminUsers" is missing';
  END IF;

  SELECT pg_get_constraintdef(c.oid)
    INTO role_check_definition
  FROM pg_constraint AS c
  WHERE c.conrelid = 'public."WebbookingAdminUsers"'::regclass
    AND c.conname = 'WebbookingAdminUsers_role_check'
    AND c.contype = 'c';

  IF role_check_definition IS NULL OR position('role' IN lower(role_check_definition)) = 0 THEN
    RAISE EXCEPTION 'Preflight required: expected WebbookingAdminUsers_role_check was not found';
  END IF;

  IF (
    SELECT count(*)
    FROM pg_constraint AS c
    WHERE c.conrelid = 'public."WebbookingAdminUsers"'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%role%'
  ) <> 1 THEN
    RAISE EXCEPTION 'Preflight required: more than one role CHECK exists on WebbookingAdminUsers';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public."WebbookingAdminUsers"
    WHERE role NOT IN ('owner', 'admin', 'editor', 'reception')
  ) THEN
    RAISE EXCEPTION 'Preflight required: WebbookingAdminUsers contains an unsupported role';
  END IF;

  IF to_regclass('storage.objects') IS NULL OR to_regclass('storage.buckets') IS NULL THEN
    RAISE EXCEPTION 'Preflight required: Supabase storage objects are missing';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'service_role')) THEN
    RAISE EXCEPTION 'Preflight required: expected Supabase roles are missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id = 'media-uploads' AND public = true
  ) THEN
    RAISE EXCEPTION 'Preflight required: media-uploads must exist and remain public';
  END IF;

  -- Do not silently remove a policy for another storage use case. The listed
  -- names are the only legacy media-uploads write policies this package owns.
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
      AND (coalesce(qual, '') || ' ' || coalesce(with_check, '')) ILIKE '%media-uploads%'
      AND policyname NOT IN (
        'Cho phép tải file lên media-uploads',
        'Cho phép sửa file trong media-uploads',
        'Cho phép xóa file trong media-uploads',
        'Cho phép admin tải file lên media-uploads',
        'Cho phép admin sửa file trong media-uploads',
        'Cho phép admin xóa file trong media-uploads',
        'Allow media.upload capability to upload media',
        'Allow media.upload capability to update media',
        'Allow media.delete capability to delete media',
        'webbooking_media_upload_capability_insert',
        'webbooking_media_upload_capability_update',
        'webbooking_media_upload_capability_delete'
      )
  ) THEN
    RAISE EXCEPTION 'Preflight required: unexpected media-uploads write policy exists';
  END IF;
END;
$$;

-- Existing draft objects are not silently accepted: their constraints must
-- already have the reviewed names, or the operator must prepare a migration
-- from the actual preflight output.
DO $$
BEGIN
  IF to_regclass('public."WebbookingAdminCapabilityGrants"') IS NOT NULL
     AND (SELECT count(*) FROM pg_constraint
          WHERE conrelid = 'public."WebbookingAdminCapabilityGrants"'::regclass
            AND conname IN (
              'webbooking_admin_capability_allowed',
              'webbooking_admin_scope_length',
              'webbooking_admin_capability_grants_pkey'
            )) <> 3 THEN
    RAISE EXCEPTION 'Preflight required: admin capability grant constraints do not match the reviewed shape';
  END IF;

  IF to_regclass('public."WebbookingAdminPermissionRevisions"') IS NOT NULL
     AND (SELECT count(*) FROM pg_constraint
          WHERE conrelid = 'public."WebbookingAdminPermissionRevisions"'::regclass
            AND conname IN ('webbooking_admin_revision_positive', 'webbooking_admin_permission_revisions_pkey')) <> 2 THEN
    RAISE EXCEPTION 'Preflight required: permission revision constraints do not match the reviewed shape';
  END IF;

  IF to_regclass('public."WebbookingAdminAuditLog"') IS NOT NULL
     AND (SELECT count(*) FROM pg_constraint
          WHERE conrelid = 'public."WebbookingAdminAuditLog"'::regclass
            AND conname IN (
              'webbooking_admin_audit_action_length',
              'webbooking_admin_audit_resource_length',
              'webbooking_admin_audit_change_object',
              'webbooking_admin_audit_log_pkey'
            )) <> 4 THEN
    RAISE EXCEPTION 'Preflight required: admin audit constraints do not match the reviewed shape';
  END IF;

  IF to_regclass('public."WebbookingAnalyticsEvents"') IS NOT NULL
     AND (SELECT count(*) FROM pg_constraint
          WHERE conrelid = 'public."WebbookingAnalyticsEvents"'::regclass
            AND conname IN (
              'webbooking_analytics_events_pkey',
              'webbooking_analytics_event_id_length',
              'webbooking_analytics_conversion_key_unique',
              'webbooking_analytics_conversion_server_only'
            )) <> 4 THEN
    RAISE EXCEPTION 'Preflight required: analytics event constraints do not match the reviewed shape';
  END IF;

  IF to_regclass('public."WebbookingAnalyticsDaily"') IS NOT NULL
     AND (SELECT count(*) FROM pg_constraint
          WHERE conrelid = 'public."WebbookingAnalyticsDaily"'::regclass
            AND conname IN ('webbooking_analytics_daily_pkey', 'webbooking_analytics_daily_counts_nonnegative')) <> 2 THEN
    RAISE EXCEPTION 'Preflight required: analytics daily constraints do not match the reviewed shape';
  END IF;
END;
$$;

ALTER TABLE public."WebbookingAdminUsers"
  DROP CONSTRAINT "WebbookingAdminUsers_role_check";

ALTER TABLE public."WebbookingAdminUsers"
  ADD CONSTRAINT "WebbookingAdminUsers_role_check"
  CHECK (role IN ('owner', 'admin', 'editor', 'reception'));

CREATE TABLE IF NOT EXISTS public."WebbookingAdminCapabilityGrants" (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  capability TEXT NOT NULL CONSTRAINT webbooking_admin_capability_allowed CHECK (capability IN (
    'content.read', 'content.write', 'content.publish',
    'media.read', 'media.upload', 'media.delete',
    'services.read', 'services.write', 'analytics.read',
    'lost_found.read', 'lost_found.write', 'lost_found.delete',
    'notification_settings.manage', 'editor_permissions.manage',
    'seo.read', 'seo.write', 'seo.publish',
    'aeo.read', 'aeo.write', 'aeo.publish'
  )),
  scope TEXT NOT NULL DEFAULT '*' CONSTRAINT webbooking_admin_scope_length
    CHECK (char_length(scope) BETWEEN 1 AND 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT webbooking_admin_capability_grants_pkey PRIMARY KEY (user_id, capability, scope)
);

CREATE INDEX IF NOT EXISTS webbooking_admin_capability_grants_active_idx
  ON public."WebbookingAdminCapabilityGrants" (user_id, capability, scope)
  WHERE is_active = true;

CREATE TABLE IF NOT EXISTS public."WebbookingAdminPermissionRevisions" (
  user_id UUID CONSTRAINT webbooking_admin_permission_revisions_pkey PRIMARY KEY REFERENCES public."WebbookingAdminUsers"(user_id) ON DELETE CASCADE,
  revision BIGINT NOT NULL DEFAULT 1 CONSTRAINT webbooking_admin_revision_positive CHECK (revision >= 1),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public."WebbookingAdminAuditLog" (
  id UUID CONSTRAINT webbooking_admin_audit_log_pkey PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CONSTRAINT webbooking_admin_audit_action_length CHECK (char_length(action) BETWEEN 1 AND 120),
  resource TEXT NOT NULL CONSTRAINT webbooking_admin_audit_resource_length CHECK (char_length(resource) BETWEEN 1 AND 120),
  change JSONB NOT NULL DEFAULT '{}'::jsonb CONSTRAINT webbooking_admin_audit_change_object CHECK (jsonb_typeof(change) = 'object'),
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS webbooking_admin_audit_target_created_idx
  ON public."WebbookingAdminAuditLog" (target_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public."WebbookingAnalyticsEvents" (
  event_id TEXT CONSTRAINT webbooking_analytics_events_pkey PRIMARY KEY
    CONSTRAINT webbooking_analytics_event_id_length CHECK (char_length(event_id) BETWEEN 1 AND 128),
  schema_version TEXT NOT NULL CHECK (char_length(schema_version) BETWEEN 1 AND 16),
  event_name TEXT NOT NULL CHECK (event_name IN (
    'page_view', 'service_view', 'service_option_select', 'cart_add',
    'cart_remove', 'cart_open', 'checkout_view', 'booking_submit',
    'booking_received', 'booking_failed', 'contact_click',
    'language_change', 'hero_video_started', 'hero_video_failed',
    'engagement_delta'
  )),
  session_id UUID NOT NULL,
  page_path TEXT NOT NULL CHECK (page_path LIKE '/%' AND char_length(page_path) <= 200),
  occurred_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  language TEXT NOT NULL CHECK (language IN ('vi', 'en', 'cn', 'jp', 'kr', 'unknown')),
  device_category TEXT NOT NULL CHECK (device_category IN ('mobile', 'tablet', 'desktop', 'unknown')),
  identifier TEXT CHECK (identifier IS NULL OR char_length(identifier) BETWEEN 1 AND 80),
  duration_ms INTEGER CHECK (duration_ms IS NULL OR (duration_ms >= 0 AND duration_ms <= 60000)),
  campaign JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(campaign) = 'object'),
  campaign_name TEXT NOT NULL DEFAULT '' CHECK (char_length(campaign_name) <= 50),
  traffic_source TEXT CHECK (traffic_source IS NULL OR traffic_source IN ('direct', 'organic_search', 'ai_referral', 'social', 'referral', 'unknown')),
  source TEXT NOT NULL CHECK (source IN ('client', 'server')),
  conversion_key TEXT CONSTRAINT webbooking_analytics_conversion_key_unique UNIQUE
    CHECK (conversion_key IS NULL OR char_length(conversion_key) BETWEEN 1 AND 128),
  is_test BOOLEAN NOT NULL DEFAULT false,
  is_bot BOOLEAN NOT NULL DEFAULT false,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT webbooking_analytics_conversion_server_only CHECK (
    (event_name = 'booking_received' AND source = 'server' AND conversion_key IS NOT NULL)
    OR (event_name <> 'booking_received' AND conversion_key IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS "WebbookingAnalyticsEvents_received_at_idx"
  ON public."WebbookingAnalyticsEvents" (received_at DESC);
CREATE INDEX IF NOT EXISTS "WebbookingAnalyticsEvents_session_id_idx"
  ON public."WebbookingAnalyticsEvents" (session_id, received_at DESC);
CREATE INDEX IF NOT EXISTS "WebbookingAnalyticsEvents_event_name_idx"
  ON public."WebbookingAnalyticsEvents" (event_name, received_at DESC);

CREATE TABLE IF NOT EXISTS public."WebbookingAnalyticsDaily" (
  bucket_date DATE NOT NULL,
  event_name TEXT NOT NULL,
  page_path TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('vi', 'en', 'cn', 'jp', 'kr', 'unknown')),
  device_category TEXT NOT NULL CHECK (device_category IN ('mobile', 'tablet', 'desktop', 'unknown')),
  campaign_name TEXT NOT NULL DEFAULT '' CHECK (char_length(campaign_name) <= 50),
  event_count BIGINT NOT NULL DEFAULT 0,
  session_count BIGINT NOT NULL DEFAULT 0,
  engaged_ms BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT webbooking_analytics_daily_counts_nonnegative CHECK (event_count >= 0 AND session_count >= 0 AND engaged_ms >= 0),
  CONSTRAINT webbooking_analytics_daily_pkey PRIMARY KEY (bucket_date, event_name, page_path, language, device_category, campaign_name)
);

CREATE INDEX IF NOT EXISTS "WebbookingAnalyticsDaily_bucket_date_idx"
  ON public."WebbookingAnalyticsDaily" (bucket_date DESC);

ALTER TABLE public."WebbookingAdminUsers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WebbookingAdminCapabilityGrants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WebbookingAdminPermissionRevisions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WebbookingAdminAuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WebbookingAnalyticsEvents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WebbookingAnalyticsDaily" ENABLE ROW LEVEL SECURITY;

-- These tables are server-owned. Explicit ACLs do not depend on project
-- default privileges and keep browser roles out of the raw analytics data.
REVOKE ALL ON TABLE
  public."WebbookingAdminUsers",
  public."WebbookingAdminCapabilityGrants",
  public."WebbookingAdminPermissionRevisions",
  public."WebbookingAdminAuditLog",
  public."WebbookingAnalyticsEvents",
  public."WebbookingAnalyticsDaily"
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public."WebbookingAdminUsers",
  public."WebbookingAdminCapabilityGrants",
  public."WebbookingAdminPermissionRevisions",
  public."WebbookingAdminAuditLog",
  public."WebbookingAnalyticsEvents",
  public."WebbookingAnalyticsDaily"
TO service_role;

CREATE OR REPLACE FUNCTION public.webbooking_has_admin_capability(
  p_user_id UUID,
  p_capability TEXT,
  p_scope TEXT DEFAULT '*'
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_user_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1
        FROM public."WebbookingAdminUsers" AS membership
        WHERE membership.user_id = p_user_id
          AND membership.is_active = true
          AND membership.role IN ('owner', 'admin')
      )
      OR EXISTS (
        SELECT 1
        FROM public."WebbookingAdminUsers" AS membership
        JOIN public."WebbookingAdminCapabilityGrants" AS grant_row
          ON grant_row.user_id = membership.user_id
        WHERE membership.user_id = p_user_id
          AND membership.is_active = true
          AND membership.role IN ('editor', 'reception')
          AND grant_row.is_active = true
          AND grant_row.capability = p_capability
          AND grant_row.capability NOT IN ('notification_settings.manage', 'editor_permissions.manage')
          AND (grant_row.scope = '*' OR grant_row.scope = COALESCE(NULLIF(trim(p_scope), ''), '*'))
      )
    );
$$;

REVOKE ALL ON FUNCTION public.webbooking_has_admin_capability(UUID, TEXT, TEXT)
FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.webbooking_has_admin_capability(UUID, TEXT, TEXT)
TO authenticated, service_role;

-- Only the media-uploads write policies are replaced here. The public SELECT
-- policy remains unchanged; recruitment_images and other storage buckets are
-- intentionally outside this migration.
DROP POLICY IF EXISTS "Cho phép tải file lên media-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Cho phép sửa file trong media-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Cho phép xóa file trong media-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Cho phép admin tải file lên media-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Cho phép admin sửa file trong media-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Cho phép admin xóa file trong media-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow media.upload capability to upload media" ON storage.objects;
DROP POLICY IF EXISTS "Allow media.upload capability to update media" ON storage.objects;
DROP POLICY IF EXISTS "Allow media.delete capability to delete media" ON storage.objects;
DROP POLICY IF EXISTS "webbooking_media_upload_capability_insert" ON storage.objects;
DROP POLICY IF EXISTS "webbooking_media_upload_capability_update" ON storage.objects;
DROP POLICY IF EXISTS "webbooking_media_upload_capability_delete" ON storage.objects;

CREATE POLICY "webbooking_media_upload_capability_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media-uploads'
  AND public.webbooking_has_admin_capability(auth.uid(), 'media.upload', '*')
);

CREATE POLICY "webbooking_media_upload_capability_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media-uploads'
  AND public.webbooking_has_admin_capability(auth.uid(), 'media.upload', '*')
)
WITH CHECK (
  bucket_id = 'media-uploads'
  AND public.webbooking_has_admin_capability(auth.uid(), 'media.upload', '*')
);

CREATE POLICY "webbooking_media_upload_capability_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media-uploads'
  AND public.webbooking_has_admin_capability(auth.uid(), 'media.delete', '*')
);

-- This is the only editor-permission write path. The revision row is locked
-- before the expected revision is compared; grants, revision, and audit row
-- commit or roll back together.
CREATE OR REPLACE FUNCTION public.webbooking_replace_editor_capabilities(
  p_actor_user_id UUID,
  p_target_user_id UUID,
  p_capabilities TEXT[],
  p_expected_revision BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role TEXT;
  target_role TEXT;
  target_active BOOLEAN;
  current_revision BIGINT;
  next_revision BIGINT;
  previous_grants JSONB;
  normalized_capabilities TEXT[];
BEGIN
  SELECT role INTO actor_role
  FROM public."WebbookingAdminUsers"
  WHERE user_id = p_actor_user_id AND is_active = true;

  IF actor_role IS NULL OR actor_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Only active owner/admin accounts may manage editor capabilities'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT role, is_active INTO target_role, target_active
  FROM public."WebbookingAdminUsers"
  WHERE user_id = p_target_user_id;

  IF target_role IS NULL THEN
    RAISE EXCEPTION 'Target admin membership does not exist' USING ERRCODE = 'P0001';
  END IF;
  IF target_role <> 'editor' THEN
    RAISE EXCEPTION 'Only editor memberships may be changed by this function' USING ERRCODE = 'P0001';
  END IF;
  IF target_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Inactive editor memberships cannot receive capabilities' USING ERRCODE = 'P0001';
  END IF;
  IF p_expected_revision IS NULL OR p_expected_revision < 1 THEN
    RAISE EXCEPTION 'A positive expected permission revision is required' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(COALESCE(p_capabilities, ARRAY[]::TEXT[])) AS requested(capability)
    WHERE requested.capability NOT IN (
      'content.read', 'content.write', 'content.publish',
      'media.read', 'media.upload', 'media.delete',
      'services.read', 'services.write', 'analytics.read',
      'lost_found.read', 'lost_found.write', 'lost_found.delete',
      'seo.read', 'seo.write', 'seo.publish',
      'aeo.read', 'aeo.write', 'aeo.publish'
    )
  ) THEN
    RAISE EXCEPTION 'Unknown or protected editor capability' USING ERRCODE = 'P0001';
  END IF;

  SELECT COALESCE(array_agg(DISTINCT capability ORDER BY capability), ARRAY[]::TEXT[])
    INTO normalized_capabilities
  FROM unnest(COALESCE(p_capabilities, ARRAY[]::TEXT[])) AS requested(capability);

  INSERT INTO public."WebbookingAdminPermissionRevisions" (user_id, revision, updated_by)
  VALUES (p_target_user_id, 1, p_actor_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT revision INTO current_revision
  FROM public."WebbookingAdminPermissionRevisions"
  WHERE user_id = p_target_user_id
  FOR UPDATE;

  IF current_revision <> p_expected_revision THEN
    RAISE EXCEPTION 'Permission revision changed' USING ERRCODE = 'P0001';
  END IF;

  SELECT COALESCE(
    jsonb_agg(jsonb_build_object('capability', capability, 'scope', scope) ORDER BY capability, scope),
    '[]'::jsonb
  ) INTO previous_grants
  FROM public."WebbookingAdminCapabilityGrants"
  WHERE user_id = p_target_user_id AND is_active = true;

  DELETE FROM public."WebbookingAdminCapabilityGrants"
  WHERE user_id = p_target_user_id;

  INSERT INTO public."WebbookingAdminCapabilityGrants" (
    user_id, capability, scope, is_active, granted_by
  )
  SELECT p_target_user_id, capability, '*', true, p_actor_user_id
  FROM unnest(normalized_capabilities) AS requested(capability);

  next_revision := current_revision + 1;
  UPDATE public."WebbookingAdminPermissionRevisions"
  SET revision = next_revision,
      updated_by = p_actor_user_id,
      updated_at = timezone('utc'::text, now())
  WHERE user_id = p_target_user_id;

  INSERT INTO public."WebbookingAdminAuditLog" (
    actor_user_id, target_user_id, action, resource, change
  ) VALUES (
    p_actor_user_id,
    p_target_user_id,
    'editor_capabilities.replace',
    'WebbookingAdminCapabilityGrants',
    jsonb_build_object(
      'before', previous_grants,
      'after', to_jsonb(normalized_capabilities),
      'revision', next_revision
    )
  );

  RETURN jsonb_build_object(
    'user_id', p_target_user_id,
    'capabilities', to_jsonb(normalized_capabilities),
    'revision', next_revision
  );
END;
$$;

REVOKE ALL ON FUNCTION public.webbooking_replace_editor_capabilities(UUID, UUID, TEXT[], BIGINT)
FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.webbooking_replace_editor_capabilities(UUID, UUID, TEXT[], BIGINT)
TO service_role;

CREATE OR REPLACE FUNCTION public.webbooking_analytics_maintain()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_finalize_before TIMESTAMPTZ := (((now() AT TIME ZONE 'UTC')::date - 30)::timestamp AT TIME ZONE 'UTC');
BEGIN
  INSERT INTO public."WebbookingAnalyticsDaily" (
    bucket_date, event_name, page_path, language, device_category,
    campaign_name, event_count, session_count, engaged_ms, updated_at
  )
  SELECT
    (received_at AT TIME ZONE 'UTC')::date,
    event_name,
    page_path,
    language,
    device_category,
    campaign_name,
    count(*)::bigint,
    count(DISTINCT session_id)::bigint,
    coalesce(sum(CASE WHEN event_name = 'engagement_delta' THEN duration_ms ELSE 0 END), 0)::bigint,
    now()
  FROM public."WebbookingAnalyticsEvents"
  WHERE received_at >= now() - interval '13 months'
    AND received_at < v_finalize_before
    AND is_test = false
    AND is_bot = false
    AND is_admin = false
  GROUP BY 1, 2, 3, 4, 5, 6
  ON CONFLICT (bucket_date, event_name, page_path, language, device_category, campaign_name)
  DO UPDATE SET
    event_count = excluded.event_count,
    session_count = excluded.session_count,
    engaged_ms = excluded.engaged_ms,
    updated_at = now();

  DELETE FROM public."WebbookingAnalyticsEvents"
  WHERE received_at < v_finalize_before;

  DELETE FROM public."WebbookingAnalyticsDaily"
  WHERE bucket_date < (current_date - interval '12 months')::date;
END;
$$;

REVOKE ALL ON FUNCTION public.webbooking_analytics_maintain()
FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.webbooking_analytics_maintain()
TO service_role;

-- pg_cron is intentionally not scheduled by this migration. The operator
-- must verify ownership, extension policy, and idempotency first, then create
-- one approved schedule for public.webbooking_analytics_maintain().

COMMIT;
