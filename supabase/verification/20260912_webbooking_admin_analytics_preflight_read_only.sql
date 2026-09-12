-- READ-ONLY PREFLIGHT. Run in the target Supabase project before the reviewed
-- migration. This file only reports state and rolls back its read-only tx.

BEGIN;
SET TRANSACTION READ ONLY;

SELECT
  'required_relations' AS check_name,
  required.relname,
  to_regclass(format('%I.%I', required.nspname, required.relname)) IS NOT NULL AS exists,
  pg_get_userbyid(c.relowner) AS owner,
  c.relrowsecurity AS row_level_security
FROM (VALUES
  ('public', 'WebbookingAdminUsers'),
  ('public', 'WebbookingAdminCapabilityGrants'),
  ('public', 'WebbookingAdminPermissionRevisions'),
  ('public', 'WebbookingAdminAuditLog'),
  ('public', 'WebbookingAnalyticsEvents'),
  ('public', 'WebbookingAnalyticsDaily'),
  ('storage', 'objects'),
  ('storage', 'buckets')
) AS required(nspname, relname)
LEFT JOIN pg_namespace AS n
  ON n.nspname = required.nspname
LEFT JOIN pg_class AS c
  ON c.relnamespace = n.oid
 AND c.relname = required.relname
ORDER BY required.nspname, required.relname;

SELECT
  table_schema,
  table_name,
  ordinal_position,
  column_name,
  data_type,
  udt_schema,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE (table_schema, table_name) IN (
  ('public', 'WebbookingAdminUsers'),
  ('public', 'WebbookingAdminCapabilityGrants'),
  ('public', 'WebbookingAdminPermissionRevisions'),
  ('public', 'WebbookingAdminAuditLog'),
  ('public', 'WebbookingAnalyticsEvents'),
  ('public', 'WebbookingAnalyticsDaily')
)
ORDER BY table_schema, table_name, ordinal_position;

SELECT
  c.conrelid::regclass AS relation_name,
  c.conname,
  c.contype,
  pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint AS c
WHERE c.conrelid IN (
  to_regclass('public."WebbookingAdminUsers"'),
  to_regclass('public."WebbookingAdminCapabilityGrants"'),
  to_regclass('public."WebbookingAdminPermissionRevisions"'),
  to_regclass('public."WebbookingAdminAuditLog"'),
  to_regclass('public."WebbookingAnalyticsEvents"'),
  to_regclass('public."WebbookingAnalyticsDaily"')
)
ORDER BY relation_name, conname;

SELECT
  user_id,
  role,
  is_active,
  created_at,
  updated_at
FROM public."WebbookingAdminUsers"
ORDER BY created_at, user_id;

SELECT
  c.oid::regclass AS relation_name,
  CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(acl.grantee) END AS grantee,
  CASE WHEN acl.grantor = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(acl.grantor) END AS grantor,
  acl.privilege_type,
  acl.is_grantable
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner))) AS acl
WHERE n.nspname = 'public'
  AND c.relname IN (
    'WebbookingAdminUsers', 'WebbookingAdminCapabilityGrants',
    'WebbookingAdminPermissionRevisions', 'WebbookingAdminAuditLog',
    'WebbookingAnalyticsEvents', 'WebbookingAnalyticsDaily'
  )
ORDER BY relation_name, grantee, privilege_type;

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE (schemaname = 'public' AND tablename IN (
  'WebbookingAdminUsers', 'WebbookingAdminCapabilityGrants',
  'WebbookingAdminPermissionRevisions', 'WebbookingAdminAuditLog',
  'WebbookingAnalyticsEvents', 'WebbookingAnalyticsDaily'
))
OR (schemaname = 'storage' AND tablename = 'objects');

SELECT id, name, public
FROM storage.buckets
WHERE id IN ('media-uploads', 'recruitment_images')
ORDER BY id;

SELECT
  n.nspname,
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS identity_arguments,
  pg_get_function_result(p.oid) AS return_type,
  p.prosecdef AS security_definer,
  pg_get_userbyid(p.proowner) AS owner,
  p.proconfig,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc AS p
JOIN pg_namespace AS n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'webbooking_has_admin_capability',
    'webbooking_replace_editor_capabilities',
    'webbooking_analytics_maintain'
  )
ORDER BY p.proname, identity_arguments;

SELECT
  n.nspname,
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS identity_arguments,
  CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(acl.grantee) END AS grantee,
  acl.privilege_type,
  acl.is_grantable
FROM pg_proc AS p
JOIN pg_namespace AS n ON n.oid = p.pronamespace
CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) AS acl
WHERE n.nspname = 'public'
  AND p.proname IN (
    'webbooking_has_admin_capability',
    'webbooking_replace_editor_capabilities',
    'webbooking_analytics_maintain'
  )
ORDER BY p.proname, identity_arguments, grantee;

SELECT
  n.nspname,
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS identity_arguments,
  pg_get_userbyid(p.proowner) AS owner
FROM pg_proc AS p
JOIN pg_namespace AS n ON n.oid = p.pronamespace
WHERE n.nspname = 'cron'
  AND p.proname = 'schedule';

SELECT
  CASE WHEN to_regclass('cron.job') IS NULL THEN 'cron.job unavailable' ELSE 'cron.job available' END AS cron_job_state,
  CASE WHEN to_regnamespace('cron') IS NULL THEN 'cron schema unavailable' ELSE 'cron schema available' END AS cron_schema_state;

ROLLBACK;
