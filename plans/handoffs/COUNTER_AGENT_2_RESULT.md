# Counter Agent 2 Handoff

Date: 2026-09-09
Scope: audit the booking-number namespace and the separate operations admin.

## Evidence found in this repository

- `src/app/api/bookings/route.ts` calls `webbooking_allocate_booking_number` only to obtain an identifier, then inserts `Bookings` and `BookingItems` directly.
- The website payload uses `source = WEB_BOOKING`, `status = NEW`, `id = billCode`, `customerId`, and `idLegacy = idemp:<key>`.
- `src/app/api/admin/bookings/route.ts` returns `404` with `NOT_FOUND` and states that booking operations belong to the separate internal system.
- `src/app/admin/bookings/page.tsx` redirects to `/admin`; this CMS does not provide an order dispatch UI.
- No active source file in this repository contains `STANDARD_WALK_IN`, a second booking-number writer, or an operations admin consumer.
- Historical migrations contain `create_booking_atomic`, but the current preflight reported no deployed writer function. Those historical files are outside the counter-only contract and must remain unapplied for this task.

## Database evidence supplied by the operator

- `Bookings.id` is a text primary key.
- `Bookings.billCode` is `NOT NULL` and unique.
- `Bookings.idLegacy` is unique and nullable.
- `Bookings.customerId` references `Customers.id`.
- `BookingItems.bookingId` references `Bookings.id`.
- Existing daily code check: 9 `id` codes, 9 `billCode` codes, 0 mismatches.
- Duplicate `billCode` groups: 0.
- `webbooking_submit_booking`: 0 functions.
- `WebbookingBookingDailyCounters`: absent before the counter SQL.
- `webbooking_allocate_booking_number`: absent before the counter SQL.

## Decision

The local webbooking contract is internally consistent, but the shared namespace is **BLOCKED for live concurrency acceptance**. The repository has no evidence of how the external operations admin creates `STANDARD_WALK_IN` or consumes `WEB_BOOKING` IDs. Existing no-duplicate data proves the current rows are clean; it does not prove two writers cannot request the same unused code concurrently.

Before applying the counter SQL, the operations owner must confirm:

1. Which system owns `id` and `billCode` generation.
2. Whether `WEB_BOOKING` and `STANDARD_WALK_IN` share the `WB-DDMMYYYY-NNN` namespace.
3. Whether the date code uses appointment date in Vietnam time.
4. What happens when an external writer races the website and receives a unique violation.
5. Whether the operations admin requires `id` and `billCode` to match and whether it receives the parent before the child rows.

The read-only follow-up is:

`supabase/verification/20260909_booking_namespace_read_only.sql`

It must be run on the shared DB before applying the counter SQL. It does not call the allocator and does not write data.

## Result

Agent 2: **DONE WITH BLOCKER**. Counter SQL can be reviewed for shape and ACL, but live application remains blocked until the external namespace owner confirms the contract. No shared DB write was performed by this audit.
