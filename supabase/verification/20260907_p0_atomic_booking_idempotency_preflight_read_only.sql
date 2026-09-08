-- Read-only preflight for 20260907_p0_atomic_booking_idempotency.sql.
-- Run against the isolated staging target before applying the migration.
-- It reports catalog/data blockers without selecting customer PII.
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

SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('Bookings', 'BookingItems', 'Customers', 'Services', 'WebbookingBookingDailyCounters')
  AND column_name IN (
      'id', 'billCode', 'idLegacy', 'idempotency_key', 'idempotency_fingerprint',
      'customerId', 'bookingId', 'serviceId', 'phone', 'email', 'priceVND',
      'isActive', 'date_key', 'last_seq', 'updated_at'
  )
ORDER BY table_name, ordinal_position;

-- Existing duplicate groups are blockers. Counts only; no PII is returned.
SELECT 'duplicate_bill_code' AS check_name, count(*) AS duplicate_groups,
       COALESCE(sum(row_count), 0) AS duplicate_rows
FROM (
    SELECT count(*) AS row_count
    FROM public."Bookings"
    WHERE "billCode" IS NOT NULL
    GROUP BY "billCode"
    HAVING count(*) > 1
) duplicates
UNION ALL
SELECT 'duplicate_legacy_idempotency_key', count(*), COALESCE(sum(row_count), 0)
FROM (
    SELECT count(*) AS row_count
    FROM public."Bookings"
    WHERE "idLegacy" IS NOT NULL AND "idLegacy" LIKE 'idemp:%'
    GROUP BY "idLegacy"
    HAVING count(*) > 1
) duplicates
UNION ALL
SELECT 'orphan_booking_items', count(*), count(*)
FROM public."BookingItems" bi
LEFT JOIN public."Bookings" b ON b.id = bi."bookingId"
WHERE b.id IS NULL
UNION ALL
SELECT 'orphan_customer_links', count(*), count(*)
FROM public."Bookings" b
LEFT JOIN public."Customers" c ON c.id = b."customerId"
WHERE b."customerId" IS NOT NULL AND c.id IS NULL;

-- Inventory all existing overloads and effective browser/server privileges.
SELECT
    p.oid::regprocedure AS function_name,
    pg_catalog.oidvectortypes(p.proargtypes) AS type_arguments,
    p.proargnames,
    has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
    has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_execute
FROM pg_proc p
WHERE p.pronamespace = 'public'::regnamespace
  AND p.proname = 'create_booking_atomic'
ORDER BY p.oid;

SELECT
    conname,
    conrelid::regclass AS child_table,
    confrelid::regclass AS parent_table,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid IN (
    'public."Bookings"'::regclass,
    'public."BookingItems"'::regclass
)
  AND contype = 'f'
ORDER BY conrelid::regclass::text, conname;

COMMIT;
