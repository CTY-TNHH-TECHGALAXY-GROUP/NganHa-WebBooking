-- Single-result, read-only check for tables used by INSERT triggers.
-- Run this file by itself. It does not execute trigger functions or write data.

BEGIN TRANSACTION READ ONLY;

WITH required(table_name, column_name) AS (
  VALUES
    ('StaffNotifications', 'bookingId'),
    ('StaffNotifications', 'type'),
    ('StaffNotifications', 'message'),
    ('StaffNotifications', 'isRead'),
    ('StaffNotifications', 'createdAt'),
    ('KTVDRecomputeQueue', 'booking_item_id'),
    ('KTVDRecomputeQueue', 'booking_id'),
    ('KTVDRecomputeQueue', 'reason'),
    ('KTVDRecomputeQueue', 'enqueued_at'),
    ('KTVDRecomputeQueue', 'attempts'),
    ('KTVDRecomputeQueue', 'last_error')
), column_counts AS (
  SELECT
    count(*) AS expected_count,
    count(c.column_name) AS present_count
  FROM required AS r
  LEFT JOIN information_schema.columns AS c
    ON c.table_schema = 'public'
   AND c.table_name = r.table_name
   AND c.column_name = r.column_name
), relation_gate AS (
  SELECT
    to_regclass('public."StaffNotifications"') IS NOT NULL AS notifications_present,
    to_regclass('public."KTVDRecomputeQueue"') IS NOT NULL AS queue_present
), queue_unique AS (
  SELECT count(*) AS unique_item_index_count
  FROM pg_index AS i
  WHERE i.indrelid = to_regclass('public."KTVDRecomputeQueue"')
    AND i.indisunique
    AND pg_get_indexdef(i.indexrelid) ILIKE '%booking_item_id%'
)
SELECT
  'insert_trigger_dependency_gate' AS check_name,
  current_database() AS database_name,
  rc.notifications_present,
  rc.queue_present,
  cc.expected_count,
  cc.present_count,
  (cc.expected_count = cc.present_count) AS required_columns_pass,
  qu.unique_item_index_count,
  CASE
    WHEN rc.notifications_present
      AND rc.queue_present
      AND cc.expected_count = cc.present_count
      AND qu.unique_item_index_count > 0
    THEN 'PASS_DEPENDENCIES'
    ELSE 'BLOCKED'
  END AS result
FROM relation_gate AS rc
CROSS JOIN column_counts AS cc
CROSS JOIN queue_unique AS qu;

COMMIT;
