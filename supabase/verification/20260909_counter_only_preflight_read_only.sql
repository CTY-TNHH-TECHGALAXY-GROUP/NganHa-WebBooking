-- Read-only gate for GO_LIVE_COUNTER_ONLY_READY_TO_PASTE.sql.
-- It returns metadata/counts only and does not select customer PII.
-- It does not create, alter, lock, or write any database object.

BEGIN TRANSACTION READ ONLY;

SELECT current_database() AS database_name, current_user AS database_user, now() AS checked_at;

SELECT relation_name, to_regclass(relation_name) IS NOT NULL AS present
FROM (VALUES
  ('public."Bookings"'),
  ('public."BookingItems"'),
  ('public."Customers"'),
  ('public."Services"'),
  ('public."WebbookingBookingDailyCounters"')
) AS relations(relation_name);

-- Baseline metadata for the existing application tables. The deployment SQL
-- must leave these columns, status definitions, constraints, RLS, and policies
-- unchanged.
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('Bookings', 'BookingItems', 'Customers', 'Services')
  AND column_name IN (
    'id', 'billCode', 'idLegacy', 'bookingDate', 'timeBooking', 'customerId',
    'serviceId', 'quantity', 'price', 'status', 'priceVND', 'isActive'
  )
ORDER BY table_name, ordinal_position;

SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  count(p.oid) AS policy_count
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
LEFT JOIN pg_policy AS p ON p.polrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relname IN ('Bookings', 'BookingItems', 'Customers', 'Services')
GROUP BY c.relname, c.relrowsecurity, c.relforcerowsecurity
ORDER BY c.relname;

SELECT
  conname,
  conrelid::regclass AS child_table,
  confrelid::regclass AS parent_table,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid IN (
  to_regclass('public."Bookings"'),
  to_regclass('public."BookingItems"')
)
ORDER BY conrelid::regclass::TEXT, conname;

-- Counter shape is reported without changing an existing object. If the
-- namespace already exists with a different shape, stop and review rather
-- than altering it.
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'WebbookingBookingDailyCounters'
ORDER BY ordinal_position;

SELECT
  conname,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = to_regclass('public."WebbookingBookingDailyCounters"')
ORDER BY conname;

-- Existing daily codes are counted by identifier source. Counts avoid
-- returning booking/customer details while exposing seed/collision risk.
SELECT
  'existing_daily_codes' AS check_name,
  count(*) FILTER (WHERE id ~ '^WB-[0-9]{8}-[0-9]+$') AS id_code_count,
  count(*) FILTER (WHERE "billCode" IS NOT NULL AND "billCode"::TEXT ~ '^WB-[0-9]{8}-[0-9]+$') AS bill_code_count,
  count(*) FILTER (WHERE id ~ '^WB-[0-9]{8}-[0-9]+$' AND id <> "billCode") AS id_billcode_mismatches
FROM public."Bookings";

SELECT 'duplicate_bill_code' AS check_name, count(*) AS affected_groups
FROM (
  SELECT "billCode"
  FROM public."Bookings"
  WHERE "billCode" IS NOT NULL
  GROUP BY "billCode"
  HAVING count(*) > 1
) AS duplicates;

-- The allocator has no writer companion in this file. A pre-existing writer
-- is reported so it cannot be mistaken for counter-only integration.
SELECT
  'preexisting_booking_writer' AS check_name,
  count(*) AS function_count,
  CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'BLOCKER' END AS result
FROM pg_proc AS p
WHERE p.pronamespace = 'public'::regnamespace
  AND p.proname = 'webbooking_submit_booking';

SELECT
  p.oid::regprocedure AS function_name,
  pg_get_function_result(p.oid) AS returns,
  p.prosecdef AS security_definer,
  COALESCE((
    SELECT bool_or(privilege.privilege_type = 'EXECUTE')
    FROM aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) AS privilege
    WHERE privilege.grantee = 0
  ), false) AS public_execute,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_execute
FROM pg_proc AS p
WHERE p.pronamespace = 'public'::regnamespace
  AND p.proname = 'webbooking_allocate_booking_number'
ORDER BY p.oid::regprocedure::TEXT;

SELECT
  'integration.blocker' AS check_name,
  'REVIEW: application must call webbooking_allocate_booking_number for the ID, then call the separately reviewed webbooking_commit_booking writer. This counter-only read-only SQL does not alter or create either writer.' AS finding;

COMMIT;
