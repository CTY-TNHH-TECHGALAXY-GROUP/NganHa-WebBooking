-- Single-result, read-only schema gate for the website atomic writer.
-- Run this statement by itself so the SQL editor shows the complete result.
-- It does not call an RPC, allocate a number, or write any database object.

BEGIN TRANSACTION READ ONLY;

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
), column_gate AS (
  SELECT
    count(*) AS expected_count,
    count(c.column_name) AS present_count
  FROM required AS r
  LEFT JOIN information_schema.columns AS c
    ON c.table_schema = 'public'
   AND c.table_name = r.table_name
   AND c.column_name = r.column_name
), status_type AS (
  SELECT max(udt_name) FILTER (WHERE table_name = 'Bookings' AND column_name = 'status') AS booking_status_type,
         max(udt_name) FILTER (WHERE table_name = 'BookingItems' AND column_name = 'status') AS item_status_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN ('Bookings', 'BookingItems')
    AND column_name = 'status'
), timestamp_types AS (
  SELECT
    max(data_type) FILTER (WHERE table_name = 'Bookings' AND column_name = 'bookingDate') AS booking_date_type,
    max(data_type) FILTER (WHERE table_name = 'Bookings' AND column_name = 'createdAt') AS created_at_type,
    max(data_type) FILTER (WHERE table_name = 'Bookings' AND column_name = 'updatedAt') AS updated_at_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'Bookings'
    AND column_name IN ('bookingDate', 'createdAt', 'updatedAt')
), trigger_info AS (
  SELECT
    count(*) AS trigger_count,
    coalesce(
      string_agg(c.relname || '.' || t.tgname || ': ' || pg_get_triggerdef(t.oid), E'\n' ORDER BY c.relname, t.tgname),
      '<none>'
    ) AS trigger_definitions
  FROM pg_trigger AS t
  JOIN pg_class AS c ON c.oid = t.tgrelid
  JOIN pg_namespace AS n ON n.oid = c.relnamespace
  WHERE NOT t.tgisinternal
    AND n.nspname = 'public'
    AND c.relname IN ('Bookings', 'BookingItems')
), enum_gate AS (
  SELECT exists (
    SELECT 1
    FROM pg_enum AS e
    JOIN pg_type AS t ON t.oid = e.enumtypid
    JOIN pg_namespace AS n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'BookingStatus'
      AND e.enumlabel = 'NEW'
  ) AS booking_status_new
)
SELECT
  'website_atomic_writer_schema_gate' AS check_name,
  current_database() AS database_name,
  now() AS checked_at,
  cg.expected_count,
  cg.present_count,
  (cg.expected_count = cg.present_count) AS required_columns_pass,
  eg.booking_status_new,
  st.booking_status_type,
  st.item_status_type,
  tt.booking_date_type,
  tt.created_at_type,
  tt.updated_at_type,
  ti.trigger_count,
  ti.trigger_definitions,
  CASE
    WHEN cg.expected_count = cg.present_count
      AND eg.booking_status_new
      AND st.booking_status_type = 'BookingStatus'
    THEN 'PASS_TYPES_AND_COLUMNS_REVIEW_TRIGGERS'
    ELSE 'BLOCKED'
  END AS result
FROM column_gate AS cg
CROSS JOIN status_type AS st
CROSS JOIN timestamp_types AS tt
CROSS JOIN trigger_info AS ti
CROSS JOIN enum_gate AS eg;

COMMIT;
