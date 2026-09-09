-- Read-only postflight for GO_LIVE_COUNTER_ONLY_READY_TO_PASTE.sql.
-- Run only after an approved operator has applied the counter-only SQL.
-- This file never calls the allocator and never writes database state.

BEGIN TRANSACTION READ ONLY;

SELECT current_database() AS database_name, current_user AS database_user, now() AS checked_at;

SELECT
  to_regclass('public."WebbookingBookingDailyCounters"') IS NOT NULL AS counter_table_present,
  EXISTS (
    SELECT 1
    FROM pg_proc AS p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname = 'webbooking_allocate_booking_number'
      AND p.pronargs = 1
      AND pg_get_function_arguments(p.oid) ILIKE '%timestamp with time zone%'
  ) AS allocator_signature_present,
  EXISTS (
    SELECT 1
    FROM pg_proc AS p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname = 'webbooking_submit_booking'
  ) AS legacy_submit_writer_present;

SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'WebbookingBookingDailyCounters'
ORDER BY ordinal_position;

SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  count(p.oid) AS policy_count
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
LEFT JOIN pg_policy AS p ON p.polrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relname = 'WebbookingBookingDailyCounters'
GROUP BY c.relname, c.relrowsecurity, c.relforcerowsecurity;

SELECT
  p.oid::regprocedure AS function_name,
  p.prosecdef AS security_definer,
  pg_get_function_result(p.oid) AS returns,
  COALESCE((
    SELECT bool_or(a.privilege_type = 'EXECUTE')
    FROM aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) AS a
    WHERE a.grantee = 0
  ), false) AS public_execute,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_execute
FROM pg_proc AS p
WHERE p.pronamespace = 'public'::regnamespace
  AND p.proname = 'webbooking_allocate_booking_number'
ORDER BY p.oid::regprocedure::TEXT;

SELECT
  'counter_only_postflight' AS check_name,
  CASE WHEN to_regclass('public."WebbookingBookingDailyCounters"') IS NOT NULL
    THEN 'PASS' ELSE 'FAIL' END AS table_result,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc AS p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname = 'webbooking_submit_booking'
  ) THEN 'BLOCKER_LEGACY_WRITER' ELSE 'PASS_NO_LEGACY_WRITER' END AS legacy_writer_result;

COMMIT;
