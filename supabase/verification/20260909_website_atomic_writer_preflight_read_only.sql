BEGIN TRANSACTION READ ONLY;
SELECT current_database(), current_user, now();
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('Bookings','BookingItems','Customers','Services')
ORDER BY table_name, ordinal_position;
SELECT p.oid::regprocedure, pg_get_userbyid(p.proowner), p.prosecdef,
  pg_get_functiondef(p.oid) LIKE '%SET search_path = pg_catalog, public%'
FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace
  AND p.proname = 'webbooking_commit_booking';
SELECT p.oid::regprocedure, has_function_privilege('public',p.oid,'EXECUTE') AS public_execute,
  has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute,
  has_function_privilege('service_role',p.oid,'EXECUTE') AS service_role_execute
FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.proname = 'webbooking_commit_booking';
SELECT 'read_only_preflight' AS check_name, 'No writer invocation performed' AS result;
COMMIT;
