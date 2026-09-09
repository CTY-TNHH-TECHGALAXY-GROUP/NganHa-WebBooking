# Counter Agent 1 Handoff

Date: 2026-09-09
Scope: idempotency replay, unique-conflict handling, and direct booking insert acceptance.

## Implemented behavior

- `src/app/api/bookings/route.ts` keeps the established direct insert path:
  allocator -> `Bookings` insert -> `BookingItems` insert -> confirmation email.
- `idLegacy` remains `idemp:<key>` and no new booking column or writer RPC is introduced.
- Replay lookup waits briefly for child rows. A parent with no `BookingItems` is returned as `BOOKING_IN_PROGRESS` with HTTP 409 and `Retry-After: 1`; it is never reported as a successful booking.
- A complete replay is returned without calling the allocator, changing status, changing notes, or sending another email.
- A duplicate `idLegacy` unique violation is re-read by the established marker. It does not request replacement counter numbers.
- A duplicate `Bookings.id` or `Bookings.billCode` violation may retry the allocator within the existing bounded retry loop.
- Other unique violations fail closed with `BOOKING_FAILED`; they are not silently treated as booking-number collisions.
- A reused key with a different known customer/date/branch/guest identity or service/quantity/options line signature returns `IDEMPOTENCY_KEY_REUSED` with HTTP 409.
- Customer linking, DB prices, `source = WEB_BOOKING`, `status = NEW`, and `BookingItems.status = WAITING` remain unchanged.

## Acceptance evidence

- `scripts/test-go-live-api.mjs`: actual route mocked integration `13/13`.
- Covered cases include malformed input, allocator unavailable, quote rejection, customer linkage, email failure after commit, normal replay, `idLegacy` race, incomplete parent, `billCode` conflict, unknown unique error, and different request identity.
- `scripts/test-terra-2-booking-api.mjs`: API matrix `14/14`.
- `scripts/test-counter-only-booking-db.mjs`: counter-only static contract `9/9`.
- `npx tsc --noEmit`: pass.
- `npm run build`: pass with 62 generated pages.
- `git diff --check`: pass.

## Known limits

- Existing schema has no durable request fingerprint column. The route can compare the saved parent identity and persisted line/options shape, but it cannot prove equivalence for legacy rows that lack canonical item options.
- Parent and child inserts are still separate statements because this release must preserve the existing booking writer contract. If child insert fails and parent rollback also fails, manual operations reconciliation remains necessary.
- Concurrent identical requests can still race while resolving/creating customer master rows because customer uniqueness and transaction ownership belong to the existing shared system. No customer schema or merge behavior was changed.
- A counter shared with an external admin writer is not proven safe until that system confirms its namespace, lock, and retry contract.

## Result

Agent 1: **DONE LOCALLY**. Code and mock acceptance pass. Shared DB, external admin receipt, live email delivery, and cross-system concurrency remain unverified.
