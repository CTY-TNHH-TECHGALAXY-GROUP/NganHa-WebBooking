-- Read-only schema gate for the website atomic writer.
-- Run this after the nullable/default check and before applying either SQL.
-- It does not call an RPC, lock a booking, or write any database object.

BEGIN TRANSACTION READ ONLY;

SELECT current_database() AS database_name, current_user AS database_user, now() AS checked_at;

-- Exact columns referenced by the website writer and their live types/defaults.
SELECT
  table_name,
  column_name,
  data_type,
  udt_schema,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'Bookings' AND column_name IN (
      'id', 'billCode', 'source', 'guestCount', 'branchName', 'bookingDate',
      'timeBooking', 'customerName', 'customerPhone', 'customerEmail',
      'customerGender', 'customerLang', 'customerId', 'roomName', 'notes',
      'focusAreaNote', 'totalAmount', 'status', 'tip', 'idLegacy',
      'createdAt', 'updatedAt', 'accessToken'
    ))
    OR
    (table_name = 'BookingItems' AND column_name IN (
      'id', 'bookingId', 'serviceId', 'quantity', 'price', 'status',
      'options', 'tip', 'guest_id', 'handover_status', 'handover_skipped'
    ))
  )
ORDER BY table_name, ordinal_position;

-- Confirm the status type and the exact enum labels used by the writer.
SELECT
  table_schema,
  table_name,
  column_name,
  data_type,
  udt_schema,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND ((table_name = 'Bookings' AND column_name = 'status')
    OR (table_name = 'BookingItems' AND column_name = 'status'))
ORDER BY table_name;

SELECT
  n.nspname AS enum_schema,
  t.typname AS enum_name,
  e.enumlabel,
  e.enumsortorder
FROM pg_type AS t
JOIN pg_namespace AS n ON n.oid = t.typnamespace
JOIN pg_enum AS e ON e.enumtypid = t.oid
WHERE n.nspname = 'public'
  AND t.typname = 'BookingStatus'
ORDER BY e.enumsortorder;

-- Existing INSERT triggers may be part of the operations-admin contract.
-- Review these definitions for ID, source, status, customer, or price rewrites.
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  t.tgname AS trigger_name,
  pg_get_triggerdef(t.oid) AS definition,
  pg_get_userbyid(c.relowner) AS table_owner
FROM pg_trigger AS t
JOIN pg_class AS c ON c.oid = t.tgrelid
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE NOT t.tgisinternal
  AND n.nspname = 'public'
  AND c.relname IN ('Bookings', 'BookingItems')
ORDER BY c.relname, t.tgname;

-- Confirm referenced tables exist without reading customer or booking values.
SELECT relation_name, to_regclass(relation_name) IS NOT NULL AS present
FROM (VALUES
  ('public."Bookings"'),
  ('public."BookingItems"'),
  ('public."Customers"'),
  ('public."Services"'),
  ('public."BookingGuests"')
) AS relations(relation_name);

-- Machine-readable gate summary. The detailed result sets above remain the
-- source of truth for types and trigger definitions.
WITH required(table_name, column_name) AS (
  VALUES
    ('Bookings', 'id'), ('Bookings', 'billCode'), ('Bookings', 'source'),
    ('Bookings', 'guestCount'), ('Bookings', 'branchName'), ('Bookings', 'bookingDate'),
    ('Bookings', 'timeBooking'), ('Bookings', 'customerName'),
    ('Bookings', 'customerPhone'), ('Bookings', 'customerEmail'),
    ('Bookings', 'customerGender'), ('Bookings', 'customerLang'),
    ('Bookings', 'customerId'), ('Bookings', 'roomName'), ('Bookings', 'notes'),
    ('Bookings', 'focusAreaNote'), ('Bookings', 'totalAmount'), ('Bookings', 'status'),
    ('Bookings', 'tip'), ('Bookings', 'idLegacy'), ('Bookings', 'createdAt'),
    ('Bookings', 'updatedAt'), ('Bookings', 'accessToken'),
    ('BookingItems', 'id'), ('BookingItems', 'bookingId'),
    ('BookingItems', 'serviceId'), ('BookingItems', 'quantity'),
    ('BookingItems', 'price'), ('BookingItems', 'status'),
    ('BookingItems', 'options'), ('BookingItems', 'tip'),
    ('BookingItems', 'guest_id'), ('BookingItems', 'handover_status'),
    ('BookingItems', 'handover_skipped')
), present AS (
  SELECT r.table_name, r.column_name, c.column_name IS NOT NULL AS exists_now
  FROM required AS r
  LEFT JOIN information_schema.columns AS c
    ON c.table_schema = 'public'
   AND c.table_name = r.table_name
   AND c.column_name = r.column_name
)
SELECT
  'required_writer_columns' AS check_name,
  count(*) AS expected_count,
  count(*) FILTER (WHERE exists_now) AS present_count,
  CASE WHEN bool_and(exists_now) THEN 'PASS' ELSE 'BLOCKED' END AS result
FROM present;

SELECT
  'booking_status_enum_new' AS check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_enum AS e
    JOIN pg_type AS t ON t.oid = e.enumtypid
    JOIN pg_namespace AS n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'BookingStatus'
      AND e.enumlabel = 'NEW'
  ) THEN 'PASS' ELSE 'BLOCKED' END AS result;

SELECT
  'status_column_type' AS check_name,
  table_name,
  udt_schema,
  udt_name,
  CASE WHEN table_name = 'Bookings' AND udt_name = 'BookingStatus'
    THEN 'PASS' ELSE 'REVIEW' END AS result
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Bookings'
  AND column_name = 'status';

SELECT
  'schema_gate' AS check_name,
  'REVIEW: approve only after data types, BookingStatus=NEW, and INSERT trigger definitions match the reviewed writer contract.' AS finding;

COMMIT;
