# DB Gate: Website Atomic Booking

Date: 2026-09-09
Status: SCHEMA PASS; trigger behavior/dependencies PASS; apply gate pending.

## Evidence received

The production column/default output confirms that the website writer can omit
the following fields without violating NOT NULL constraints:

- `BookingItems.guest_id` is nullable with a `NULL` default.
- `BookingItems.handover_status` defaults to `PENDING`, which satisfies its
  existing check constraint.
- `BookingItems.handover_skipped` defaults to `false`.
- `BookingItems.bedId`, `roomName`, handover fields and operational fields are
  nullable or have valid defaults.
- `Bookings.accessToken` is `NOT NULL` but has the existing UUID default; the
  writer deliberately omits it so the database remains authoritative.
- `Bookings.updatedAt` is `NOT NULL` with no usable default; the writer
  explicitly supplies it.
- `Bookings.status` defaults to `NEW`; the writer also sets `NEW` explicitly.
- `Bookings.source` defaults to `STANDARD_MENU`; the writer sets
  `WEB_BOOKING` explicitly for website orders.

The supplied constraints show existing foreign keys and unique constraints for
`Bookings`, `BookingItems`, `Customers` and `Services`. They are existing
business rules and must remain unchanged. No duplicate foreign key or unique
constraint may be removed as part of this release.

## Schema gate result

The production summary returned `34/34` required writer columns present,
`required_columns_pass = true`, `booking_status_new = true`,
`Bookings.status` type `BookingStatus`, and `timestamp without time zone` for
`bookingDate`, `createdAt` and `updatedAt`. This matches the current writer's
appointment wall-time handling and explicit timestamp values.

Five existing triggers are present. Two are relevant to a new booking insert:
`Bookings.tr_master_notification_handler` and
`BookingItems.trg_ktvd_enqueue_item`. Their function bodies must be reviewed
before apply so the website writer does not change IDs, source/status,
customerId or price semantics and notifications are delivered through the
existing operations path.

The returned function bodies show that these insert triggers preserve the
booking rows. `fn_master_notification_handler` creates a
`StaffNotifications.NEW_ORDER` row using the new booking ID/billCode and
returns the parent row. `ktvd_enqueue_from_item` creates or refreshes a
`KTVDRecomputeQueue` row per item and swallows only queue errors; it does not
rewrite the booking item. Both effects occur inside the writer transaction.
The existence, required columns and conflict key of those two dependency
tables are verified. The dependency preflight returned
`notifications_present = true`, `queue_present = true`,
`required_columns_pass = true`, `unique_item_index_count = 1` and
`result = PASS_DEPENDENCIES`.

## Still required before apply

The nullable/default output does not include data types, triggers, function
ownership or effective function privileges. Run and save all three read-only
production preflights:

1. `supabase/verification/20260909_counter_only_preflight_read_only.sql`
2. `supabase/verification/20260909_booking_namespace_read_only.sql`
3. `supabase/verification/20260909_website_atomic_writer_preflight_read_only.sql`
4. `supabase/verification/20260909_website_atomic_writer_trigger_dependency_summary_read_only.sql`

Confirm the following before applying either SQL file:

- `bookingDate`, `createdAt` and `updatedAt` types match the writer casts and
  preserve the appointment wall time shown by operations admin.
- `BookingStatus` contains `NEW`.
- `Bookings` and `BookingItems` INSERT triggers do not rewrite the website
  source, ID, bill code, customer link or initial statuses.
- Insert trigger function definitions are reviewed for notification/queue side
  effects and commit-time delivery behavior.
- The allocator and writer signatures are absent or intentionally reviewed.
- Effective privileges are server-only after apply: `PUBLIC=false`,
  `anon=false`, `authenticated=false`, `service_role=true`.
- No existing business table, column, constraint, index, trigger, RLS policy,
  status enum or row is altered.

## Apply decision

The received column/default, schema summary, trigger review and dependency
evidence are PASS for the writer's existing-table path. They do not by
themselves authorize SQL application. The gate becomes PASS only after the
counter preflight, namespace audit, writer/function ACL preflight and reviewed
SQL hashes are saved.

If any required type, trigger or ACL differs, stop and update the writer SQL or
record `BLOCKED`; do not repair production by changing the existing booking
schema.
