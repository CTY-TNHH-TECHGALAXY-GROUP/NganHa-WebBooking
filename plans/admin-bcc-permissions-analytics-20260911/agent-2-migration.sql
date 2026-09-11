-- DRAFT ONLY. Do not run against production from this repository.
-- Agent 2 capability contract for WebbookingAdminUsers.
-- Preconditions: inspect the live constraint names and the current role rows
-- before applying. This draft is additive apart from widening the role check
-- to the role already supported by src/lib/auth/adminAuth.ts.

-- The 20260906 foundation migration allows owner/editor/reception while the
-- application also recognizes admin. Drop only the role check(s) on this
-- table, then recreate one explicit check that includes all four roles.
DO $$
DECLARE
  check_record RECORD;
BEGIN
  FOR check_record IN
    SELECT c.conname
    FROM pg_constraint AS c
    WHERE c.conrelid = 'public."WebbookingAdminUsers"'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%role%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public."WebbookingAdminUsers" DROP CONSTRAINT %I',
      check_record.conname
    );
  END LOOP;
END;
$$;

ALTER TABLE public."WebbookingAdminUsers"
  ADD CONSTRAINT "WebbookingAdminUsers_role_check"
  CHECK (role IN ('owner', 'admin', 'editor', 'reception'));

CREATE TABLE IF NOT EXISTS public."WebbookingAdminCapabilityGrants" (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  capability TEXT NOT NULL CHECK (capability IN (
    'content.read', 'content.write', 'content.publish',
    'media.read', 'media.upload', 'media.delete',
    'services.read', 'services.write', 'analytics.read',
    'lost_found.read', 'lost_found.write', 'lost_found.delete',
    'notification_settings.manage', 'editor_permissions.manage',
    'seo.read', 'seo.write', 'seo.publish',
    'aeo.read', 'aeo.write', 'aeo.publish',
    'lost_found.read', 'lost_found.write', 'lost_found.delete'
  )),
  scope TEXT NOT NULL DEFAULT '*'
    CHECK (char_length(scope) BETWEEN 1 AND 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, capability, scope)
);

CREATE INDEX IF NOT EXISTS webbooking_admin_capability_grants_active_idx
  ON public."WebbookingAdminCapabilityGrants" (user_id, capability, scope)
  WHERE is_active = true;

CREATE TABLE IF NOT EXISTS public."WebbookingAdminPermissionRevisions" (
  user_id UUID PRIMARY KEY REFERENCES public."WebbookingAdminUsers"(user_id) ON DELETE CASCADE,
  revision BIGINT NOT NULL DEFAULT 1 CHECK (revision >= 1),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public."WebbookingAdminAuditLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  change JSONB NOT NULL DEFAULT '{}'::jsonb,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS webbooking_admin_audit_target_created_idx
  ON public."WebbookingAdminAuditLog" (target_user_id, created_at DESC);

-- Browser admin pages still upload directly to the public media-uploads
-- bucket. Replace the older active-admin-only storage policy with the same
-- capability decision used by server routes before enabling those pages.
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
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.webbooking_has_admin_capability(UUID, TEXT, TEXT)
TO authenticated;

DROP POLICY IF EXISTS "Cho phép tải file lên media-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Cho phép sửa file trong media-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Cho phép xóa file trong media-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Cho phép admin tải file lên media-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Cho phép admin sửa file trong media-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Cho phép admin xóa file trong media-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow media.upload capability to upload media" ON storage.objects;
DROP POLICY IF EXISTS "Allow media.upload capability to update media" ON storage.objects;
DROP POLICY IF EXISTS "Allow media.delete capability to delete media" ON storage.objects;

CREATE POLICY "Allow media.upload capability to upload media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media-uploads'
  AND public.webbooking_has_admin_capability(auth.uid(), 'media.upload')
);

CREATE POLICY "Allow media.upload capability to update media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media-uploads'
  AND public.webbooking_has_admin_capability(auth.uid(), 'media.upload')
)
WITH CHECK (
  bucket_id = 'media-uploads'
  AND public.webbooking_has_admin_capability(auth.uid(), 'media.upload')
);

CREATE POLICY "Allow media.delete capability to delete media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media-uploads'
  AND public.webbooking_has_admin_capability(auth.uid(), 'media.delete')
);

ALTER TABLE public."WebbookingAdminCapabilityGrants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WebbookingAdminPermissionRevisions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WebbookingAdminAuditLog" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public."WebbookingAdminCapabilityGrants",
  public."WebbookingAdminPermissionRevisions",
  public."WebbookingAdminAuditLog"
FROM anon, authenticated;

GRANT ALL ON TABLE
  public."WebbookingAdminCapabilityGrants",
  public."WebbookingAdminPermissionRevisions",
  public."WebbookingAdminAuditLog"
TO service_role;

-- Atomic replacement is the only write path used by the editor permissions
-- API. It locks the target revision, rejects owner/admin targets and records
-- before/after state in the same transaction as the grant replacement.
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
    RAISE EXCEPTION 'Target admin membership does not exist'
      USING ERRCODE = 'P0001';
  END IF;
  IF target_role <> 'editor' THEN
    RAISE EXCEPTION 'Only editor memberships may be changed by this function'
      USING ERRCODE = 'P0001';
  END IF;
  IF target_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Inactive editor memberships cannot receive capabilities'
      USING ERRCODE = 'P0001';
  END IF;
  IF p_expected_revision IS NULL OR p_expected_revision < 1 THEN
    RAISE EXCEPTION 'A positive expected permission revision is required'
      USING ERRCODE = 'P0001';
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
      'aeo.read', 'aeo.write', 'aeo.publish',
      'lost_found.read', 'lost_found.write', 'lost_found.delete'
    )
  ) THEN
    RAISE EXCEPTION 'Unknown or protected editor capability'
      USING ERRCODE = 'P0001';
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
    RAISE EXCEPTION 'Permission revision changed'
      USING ERRCODE = 'P0001';
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
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.webbooking_replace_editor_capabilities(UUID, UUID, TEXT[], BIGINT)
TO service_role;
