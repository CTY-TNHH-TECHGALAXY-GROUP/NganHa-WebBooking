BEGIN TRANSACTION READ ONLY;
SELECT p.oid::regprocedure AS function_name, p.prosecdef,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS returns,
  has_function_privilege('public',p.oid,'EXECUTE') AS public_execute,
  has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute,
  has_function_privilege('service_role',p.oid,'EXECUTE') AS service_role_execute
FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace
  AND p.proname = 'webbooking_commit_booking';
SELECT 'postflight' AS check_name,
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.proname='webbooking_commit_booking')
    THEN 'PRESENT_REVIEW_ACL' ELSE 'MISSING' END AS result;
COMMIT;
