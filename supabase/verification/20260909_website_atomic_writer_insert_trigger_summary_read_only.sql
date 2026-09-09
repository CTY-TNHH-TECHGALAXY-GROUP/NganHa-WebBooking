-- Single-result, read-only review for trigger functions reached by a new
-- website booking insert. Run this file by itself.
-- It does not execute the trigger functions or write any database object.

BEGIN TRANSACTION READ ONLY;

SELECT
  'insert_trigger_review' AS check_name,
  current_database() AS database_name,
  count(*) AS insert_trigger_count,
  coalesce(string_agg(c.relname || '.' || t.tgname, ', ' ORDER BY c.relname, t.tgname), '<none>') AS trigger_names,
  coalesce(string_agg(p.oid::regprocedure::TEXT, ', ' ORDER BY c.relname, t.tgname), '<none>') AS function_names,
  coalesce(string_agg(
    c.relname || '.' || t.tgname || E'\nOWNER=' || pg_get_userbyid(p.proowner)
      || E'\nSECURITY_DEFINER=' || p.prosecdef::TEXT
      || E'\n' || pg_get_functiondef(p.oid),
    E'\n\n--------------------\n\n'
    ORDER BY c.relname, t.tgname
  ), '<none>') AS function_definitions,
  CASE WHEN count(*) = 2 THEN 'REVIEW_FUNCTION_BODIES' ELSE 'BLOCKED_TRIGGER_COUNT' END AS result
FROM pg_trigger AS t
JOIN pg_class AS c ON c.oid = t.tgrelid
JOIN pg_namespace AS n ON n.oid = c.relnamespace
JOIN pg_proc AS p ON p.oid = t.tgfoid
WHERE NOT t.tgisinternal
  AND n.nspname = 'public'
  AND (
    (c.relname = 'Bookings' AND pg_get_triggerdef(t.oid) ILIKE '%INSERT%')
    OR (c.relname = 'BookingItems' AND pg_get_triggerdef(t.oid) ILIKE '%INSERT%')
  );

COMMIT;
