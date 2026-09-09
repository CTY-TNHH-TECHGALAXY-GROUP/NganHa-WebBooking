-- Read-only audit for the booking-number namespace and operations handoff.
-- This file does not call an RPC, lock a row, or write any database object.

BEGIN TRANSACTION READ ONLY;

SELECT current_database() AS database_name, current_user AS database_user, now() AS checked_at;

-- Show only booking-related columns and avoid customer values.
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('Bookings', 'BookingItems')
  AND column_name IN ('id', 'billCode', 'idLegacy', 'bookingDate', 'source', 'status', 'bookingId', 'serviceId', 'quantity', 'price')
ORDER BY table_name, ordinal_position;

-- Existing uniqueness and indexes are evidence for the established booking
-- identifier and operations-receiving contract.
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('Bookings', 'BookingItems')
ORDER BY tablename, indexname;

-- A trigger can change IDs/statuses or notify the separate operations system.
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  t.tgname AS trigger_name,
  pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger AS t
JOIN pg_class AS c ON c.oid = t.tgrelid
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE NOT t.tgisinternal
  AND n.nspname = 'public'
  AND c.relname IN ('Bookings', 'BookingItems')
ORDER BY c.relname, t.tgname;

-- List relevant function signatures without exposing function bodies.
SELECT
  p.oid::regprocedure AS function_name,
  p.prokind,
  p.prosecdef AS security_definer,
  pg_get_function_result(p.oid) AS returns,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_execute
FROM pg_proc AS p
WHERE p.pronamespace = 'public'::regnamespace
  AND (
    p.proname ILIKE '%booking%'
    OR p.proname ILIKE '%dispatch%'
    OR p.proname ILIKE '%split%'
  )
ORDER BY p.oid::regprocedure::TEXT;

-- Realtime/publication membership can explain how the separate admin receives rows.
SELECT pubname, schemaname, tablename
FROM pg_publication_tables
WHERE schemaname = 'public'
  AND tablename IN ('Bookings', 'BookingItems')
ORDER BY pubname, tablename;

-- Aggregate source values through JSON so this query remains safe if a legacy
-- environment does not expose a source column in its API schema.
SELECT
  COALESCE(to_jsonb(b)->>'source', '<NULL>') AS source_value,
  count(*) AS booking_count
FROM public."Bookings" AS b
GROUP BY 1
ORDER BY 1;

-- Compare the two identifier columns by date-code namespace only.
SELECT
  substring(b.id FROM '^WB-([0-9]{8})-') AS id_date_code,
  count(*) FILTER (WHERE b.id ~ '^WB-[0-9]{8}-[0-9]+$') AS id_code_count,
  count(*) FILTER (WHERE b."billCode"::TEXT ~ '^WB-[0-9]{8}-[0-9]+$') AS bill_code_count,
  count(*) FILTER (
    WHERE b.id ~ '^WB-[0-9]{8}-[0-9]+$'
      AND b.id <> b."billCode"::TEXT
  ) AS mismatch_count
FROM public."Bookings" AS b
WHERE b.id ~ '^WB-[0-9]{8}-[0-9]+$'
   OR b."billCode"::TEXT ~ '^WB-[0-9]{8}-[0-9]+$'
GROUP BY 1
ORDER BY 1;

SELECT
  'namespace_decision' AS check_name,
  'The repository cannot verify an external operations admin or STANDARD_WALK_IN writer. Confirm the shared ID/billCode namespace and its concurrency rule with the operations owner before applying the counter.' AS finding;

COMMIT;
