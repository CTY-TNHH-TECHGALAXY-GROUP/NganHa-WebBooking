-- READ-ONLY POSTFLIGHT. Run after an approved migration in the same target
-- project. Every PASS/FAIL query is an assertion; REVIEW means an operator
-- decision is still required for the optional cron schedule.

BEGIN;
SET TRANSACTION READ ONLY;

SELECT
  'target relations exist and RLS is enabled' AS check_name,
  CASE WHEN count(*) = 6 AND bool_and(c.relrowsecurity) THEN 'PASS' ELSE 'FAIL' END AS status
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'WebbookingAdminUsers', 'WebbookingAdminCapabilityGrants',
    'WebbookingAdminPermissionRevisions', 'WebbookingAdminAuditLog',
    'WebbookingAnalyticsEvents', 'WebbookingAnalyticsDaily'
  );

SELECT
  'role constraint is named and narrow' AS check_name,
  CASE WHEN count(*) = 1
    AND max(pg_get_constraintdef(c.oid)) ILIKE '%owner%'
    AND max(pg_get_constraintdef(c.oid)) ILIKE '%admin%'
    AND max(pg_get_constraintdef(c.oid)) ILIKE '%editor%'
    AND max(pg_get_constraintdef(c.oid)) ILIKE '%reception%'
  THEN 'PASS' ELSE 'FAIL' END AS status
FROM pg_constraint AS c
WHERE c.conrelid = 'public."WebbookingAdminUsers"'::regclass
  AND c.conname = 'WebbookingAdminUsers_role_check'
  AND c.contype = 'c';

SELECT
  'admin roles contain no out-of-contract values' AS check_name,
  CASE WHEN NOT EXISTS (
    SELECT 1 FROM public."WebbookingAdminUsers"
    WHERE role NOT IN ('owner', 'admin', 'editor', 'reception')
  ) THEN 'PASS' ELSE 'FAIL' END AS status;

SELECT
  relation_name,
  CASE WHEN has_table_privilege('service_role', relation_name, 'SELECT')
      AND has_table_privilege('service_role', relation_name, 'INSERT')
      AND has_table_privilege('service_role', relation_name, 'UPDATE')
      AND has_table_privilege('service_role', relation_name, 'DELETE')
    THEN 'PASS' ELSE 'FAIL' END AS service_role_dml,
  CASE WHEN NOT has_table_privilege('anon', relation_name, 'SELECT')
      AND NOT has_table_privilege('authenticated', relation_name, 'SELECT')
      AND NOT has_table_privilege('anon', relation_name, 'INSERT')
      AND NOT has_table_privilege('authenticated', relation_name, 'INSERT')
      AND NOT has_table_privilege('anon', relation_name, 'UPDATE')
      AND NOT has_table_privilege('authenticated', relation_name, 'UPDATE')
      AND NOT has_table_privilege('anon', relation_name, 'DELETE')
      AND NOT has_table_privilege('authenticated', relation_name, 'DELETE')
    THEN 'PASS' ELSE 'FAIL' END AS browser_role_dml,
  CASE WHEN relation_name IN (
    'public."WebbookingAnalyticsEvents"'::regclass,
    'public."WebbookingAnalyticsDaily"'::regclass
  ) THEN 'raw/daily analytics are service_role-only' ELSE 'admin tables are service_role-only' END AS scope
FROM (VALUES
  ('public."WebbookingAdminUsers"'::regclass),
  ('public."WebbookingAdminCapabilityGrants"'::regclass),
  ('public."WebbookingAdminPermissionRevisions"'::regclass),
  ('public."WebbookingAdminAuditLog"'::regclass),
  ('public."WebbookingAnalyticsEvents"'::regclass),
  ('public."WebbookingAnalyticsDaily"'::regclass)
) AS relations(relation_name)
ORDER BY relation_name::text;

SELECT
  'analytics conversion constraint is server-only' AS check_name,
  CASE WHEN count(*) = 1 AND max(pg_get_constraintdef(c.oid)) ILIKE '%booking_received%'
    AND max(pg_get_constraintdef(c.oid)) ILIKE '%server%'
    AND max(pg_get_constraintdef(c.oid)) ILIKE '%conversion_key%'
  THEN 'PASS' ELSE 'FAIL' END AS status
FROM pg_constraint AS c
WHERE c.conrelid = 'public."WebbookingAnalyticsEvents"'::regclass
  AND c.conname = 'webbooking_analytics_conversion_server_only';

SELECT
  'analytics conversion key is unique' AS check_name,
  CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS status
FROM pg_constraint AS c
WHERE c.conrelid = 'public."WebbookingAnalyticsEvents"'::regclass
  AND c.conname = 'webbooking_analytics_conversion_key_unique'
  AND c.contype = 'u';

SELECT
  'security-definer functions use a fixed search path' AS check_name,
  CASE WHEN count(*) = 3
    AND bool_and(p.prosecdef)
    AND bool_and(p.proconfig @> ARRAY['search_path=public'])
  THEN 'PASS' ELSE 'FAIL' END AS status
FROM pg_proc AS p
JOIN pg_namespace AS n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'webbooking_has_admin_capability',
    'webbooking_replace_editor_capabilities',
    'webbooking_analytics_maintain'
  );

SELECT
  'analytics maintenance signature and ACL' AS check_name,
  CASE WHEN to_regprocedure('public.webbooking_analytics_maintain()') IS NOT NULL
    AND has_function_privilege('service_role', 'public.webbooking_analytics_maintain()', 'EXECUTE')
    AND NOT has_function_privilege('anon', 'public.webbooking_analytics_maintain()', 'EXECUTE')
    AND NOT has_function_privilege('authenticated', 'public.webbooking_analytics_maintain()', 'EXECUTE')
  THEN 'PASS' ELSE 'FAIL' END AS status;

SELECT
  'admin capability helper signature and ACL' AS check_name,
  CASE WHEN to_regprocedure('public.webbooking_has_admin_capability(uuid,text,text)') IS NOT NULL
    AND has_function_privilege('authenticated', 'public.webbooking_has_admin_capability(uuid,text,text)', 'EXECUTE')
    AND NOT has_function_privilege('anon', 'public.webbooking_has_admin_capability(uuid,text,text)', 'EXECUTE')
  THEN 'PASS' ELSE 'FAIL' END AS status;

SELECT
  'editor capability RPC signature and ACL' AS check_name,
  CASE WHEN to_regprocedure('public.webbooking_replace_editor_capabilities(uuid,uuid,text[],bigint)') IS NOT NULL
    AND has_function_privilege('service_role', 'public.webbooking_replace_editor_capabilities(uuid,uuid,text[],bigint)', 'EXECUTE')
    AND NOT has_function_privilege('anon', 'public.webbooking_replace_editor_capabilities(uuid,uuid,text[],bigint)', 'EXECUTE')
    AND NOT has_function_privilege('authenticated', 'public.webbooking_replace_editor_capabilities(uuid,uuid,text[],bigint)', 'EXECUTE')
  THEN 'PASS' ELSE 'FAIL' END AS status;

SELECT
  'media-uploads write policies are narrow' AS check_name,
  CASE WHEN NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
      AND (coalesce(qual, '') || ' ' || coalesce(with_check, '')) ILIKE '%media-uploads%'
      AND policyname NOT IN (
        'webbooking_media_upload_capability_insert',
        'webbooking_media_upload_capability_update',
        'webbooking_media_upload_capability_delete'
      )
  )
  AND (
    SELECT count(*) FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname IN (
        'webbooking_media_upload_capability_insert',
        'webbooking_media_upload_capability_update',
        'webbooking_media_upload_capability_delete'
      )
  ) = 3
  AND EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'media-uploads' AND public = true
  ) THEN 'PASS' ELSE 'FAIL' END AS status;

SELECT
  'recruitment_images storage impact' AS check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'recruitment_images' AND public = false
  ) THEN 'PASS: unchanged private bucket' ELSE 'REVIEW: bucket absent or public' END AS status;

SELECT
  'pg_cron schedule' AS check_name,
  CASE WHEN to_regnamespace('cron') IS NULL OR to_regclass('cron.job') IS NULL
    THEN 'REVIEW: cron unavailable; schedule outside this migration'
    ELSE 'REVIEW: cron exists; verify one approved idempotent schedule manually'
  END AS status;

ROLLBACK;
