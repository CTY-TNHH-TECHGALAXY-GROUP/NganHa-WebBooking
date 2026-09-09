-- Read-only review of trigger functions reached by a website booking insert.
-- Run this by itself after the schema gate summary.
-- It does not call a trigger function or write any database object.

BEGIN TRANSACTION READ ONLY;

WITH trigger_functions AS (
  SELECT DISTINCT
    t.tgfoid AS function_oid,
    n.nspname AS trigger_schema,
    c.relname AS table_name,
    t.tgname AS trigger_name
  FROM pg_trigger AS t
  JOIN pg_class AS c ON c.oid = t.tgrelid
  JOIN pg_namespace AS n ON n.oid = c.relnamespace
  WHERE NOT t.tgisinternal
    AND n.nspname = 'public'
    AND c.relname IN ('Bookings', 'BookingItems')
    AND (
      (c.relname = 'Bookings' AND t.tgtype::integer & 4 <> 0)
      OR (c.relname = 'BookingItems' AND t.tgtype::integer & 4 <> 0)
    )
)
SELECT
  tf.table_name,
  tf.trigger_name,
  p.oid::regprocedure AS function_name,
  pg_get_userbyid(p.proowner) AS function_owner,
  p.prosecdef AS security_definer,
  pg_get_functiondef(p.oid) AS function_definition
FROM trigger_functions AS tf
JOIN pg_proc AS p ON p.oid = tf.function_oid
ORDER BY tf.table_name, tf.trigger_name, p.oid::regprocedure::TEXT;

-- Focused inventory of trigger events that can happen during a new booking.
SELECT
  c.relname AS table_name,
  t.tgname AS trigger_name,
  pg_get_triggerdef(t.oid) AS trigger_definition,
  p.oid::regprocedure AS function_name,
  p.prosecdef AS security_definer,
  pg_get_userbyid(p.proowner) AS function_owner
FROM pg_trigger AS t
JOIN pg_class AS c ON c.oid = t.tgrelid
JOIN pg_namespace AS n ON n.oid = c.relnamespace
JOIN pg_proc AS p ON p.oid = t.tgfoid
WHERE NOT t.tgisinternal
  AND n.nspname = 'public'
  AND (
    (c.relname = 'Bookings' AND pg_get_triggerdef(t.oid) ILIKE '%INSERT%')
    OR (c.relname = 'BookingItems' AND pg_get_triggerdef(t.oid) ILIKE '%INSERT%')
  )
ORDER BY c.relname, t.tgname;

SELECT
  'trigger_gate' AS check_name,
  'REVIEW FUNCTION DEFINITIONS: confirm INSERT triggers preserve website id/billCode, WEB_BOOKING, NEW/WAITING, customerId, prices and commit-time operations delivery.' AS finding;

COMMIT;
