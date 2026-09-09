# Agent 2 Atomic Website Handoff

Date: 2026-09-09

## Scope

- Changed `src/app/api/bookings/route.ts` only.
- No SQL artifacts, schema, admin code, or Agent 3 tests were changed.

## Implementation

The route preserves request parsing, signed quote validation, server catalog pricing, option validation, appointment-time rules, customer lookup/linkage, `WEB_BOOKING`, `NEW`/`WAITING`, `idLegacy`, the allocator, replay checks, and the existing response and email behavior.

The former separate `Bookings` and `BookingItems` inserts plus compensating parent delete were replaced by the adapter `commitBookingAtomically()`, which calls:

`public.webbooking_commit_booking(p_booking JSONB, p_items JSONB)`

The backend still assembles the canonical allowlisted payload and item rows before the call. It never forwards browser JSON directly and never falls back to separate inserts. Identifier collisions allocate a new number within the existing bound. `idLegacy` conflicts reconcile the existing request. Timeout/temporary writer failures reconcile by `idLegacy` and full persisted item intent before returning a retryable error.

## Contract assumption

The actual SQL file is now present at `supabase/GO_LIVE_WEBSITE_ATOMIC_WRITER_READY_TO_PASTE.sql`. It confirms the stated two-argument RPC and JSON result fields `bookingId`, `billCode`, and `idempotent`. The writer owns advisory same-key locking, replay count/bill/total checks, active-catalog DB price checks, and the atomic parent/items transaction. Its generated item IDs are intentionally ignored by route intent comparison.

The route maps SQL `SERVICE_NOT_BOOKABLE`, malformed payload/item, and server-field failures to `CART_REQUIRES_REVIEW` (409); `SERVICE_PRICE_CONFLICT` and `BOOKING_TOTAL_CONFLICT` to `PRICE_CHANGED` (409); `IDEMPOTENCY_KEY_REUSED` to full route reconciliation; identifier uniqueness to bounded allocator retry; and unknown failures to explicit booking failure. Temporary/timeout failures reconcile by `idLegacy` before returning 503.

The route sends `bookingDate` as the appointment wall time (`YYYY-MM-DDTHH:mm:ss`) because the writer casts it to the existing timestamp-without-timezone column. It does not send a UTC ISO value that would shift the appointment.

## Known limitations

Customer resolution and counter allocation remain outside the writer transaction, as required. A failed booking can therefore leave a customer-only side effect or consume an allocated number. No live database was called.

## Verification

`npx tsc --noEmit` passes. Focused `npm run lint -- --file src/app/api/bookings/route.ts` completes with existing `any` warnings. No live database was called.
