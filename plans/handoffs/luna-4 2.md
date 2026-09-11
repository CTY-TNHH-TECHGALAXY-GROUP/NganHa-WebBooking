# Luna-4 API and acceptance audit

Date: 2026-09-09
Scope: read-only audit of the current worktree. No production source or SQL was
edited by this audit. No remote write, booking creation, RPC write call, or SMTP
delivery was performed.

## Verdict

**NO-GO for shared-DB booking acceptance.** The current worktree contains a
coherent proposed counter-only writer, and its local mocks/disposable PostgreSQL
checks pass. The shared database has not been preflighted with the new contract,
and there is no evidence that the separate operations-admin system accepts the
new identifier, `customerId` behavior, or item snapshot shape.

The counter-only SQL is not a drop-in counter addition to the existing booking
creation path. It creates a new `webbooking_submit_booking` writer and the API
changes from `create_booking_atomic` to that function. To preserve the existing
creation path, the allocator must be called inside the already-authoritative,
transaction-capable booking writer, immediately before the parent insert, with
the returned value used for both `Bookings.id` and `Bookings.billCode`. If that
writer does not exist or cannot be changed by its owner, a new reviewed atomic
writer is required; a counter table alone cannot provide the guarantee.

## Findings

### 1. API and frontend submit path

- `src/app/api/bookings/route.ts:243-272` reads and validates the JSON body,
  requires an idempotency key, checks replay before quote/time/catalog work, and
  fails closed when Supabase credentials are absent.
- `src/app/api/bookings/route.ts:274-311` reads service prices, USD values,
  duration, active state, and option flags from `Services`, verifies the signed
  quote and a second catalog digest, then calls
  `webbooking_submit_booking`.
- `src/app/api/bookings/route.ts:199-217` creates the parent payload with
  server-owned `source: 'WEB_BOOKING'`, `status: 'NEW'`, `customerId: null`,
  canonical total, and child rows. Each child carries quantity, catalog VND
  price, `WAITING`, and structured options; duration is retained in
  `options._booking.duration` at `:210-215`.
- `src/components/BookingCheckout/BookingCheckout.tsx:154-191` sends the cart
  as service IDs/variants, quantity, client display price/duration, options, a
  quote, and a stable request key in both the body and `Idempotency-Key` header.
- `src/components/BookingForm/BookingForm.logic.ts:409-447` does the same for
  the legacy form caller.
- The stable key is created once per mounted flow at
  `BookingCheckout.tsx:93-95` and `BookingForm.logic.ts:87-88`. A retry of the
  same intent is therefore eligible for replay. A changed intent after a
  committed timeout must use a new flow/key; the UI does not visibly rotate it
  itself.

### 2. Price, status, customer, and item ownership

- `src/lib/booking/contract.ts:411-434` derives VND/USD/duration from the
  catalog and computes totals; browser prices are not authoritative.
- `supabase/GO_LIVE_COUNTER_ONLY_READY_TO_PASTE.sql:171-219` rechecks every
  child against `Services` inside the database transaction and sums catalog VND
  price times quantity. It ignores client price, status, and customer ID.
- `supabase/GO_LIVE_COUNTER_ONLY_READY_TO_PASTE.sql:223-240` inserts
  `source='WEB_BOOKING'`, `customerId=NULL`, and `NEW`; `:243-257` inserts all
  child rows with catalog price, submitted quantity/options, `WAITING`, and
  server-generated item IDs.
- The operations contract documented in
  `plans/GO_LIVE_FINAL_STEPS_20260908.md:8-15` requires preserving the shared
  schema and existing workflow, and `:60-70` says the actual receiving contract
  and live entrypoint must be identified before release.
- The current web repo has no customer lookup/link in the route. The explicit
  `customerId=NULL` behavior is only acceptable if the operations owner confirms
  that web guest submissions are allowed to arrive unlinked and are resolved by
  the operations system later. The document at
  `plans/GO_LIVE_COUNTER_ONLY_ACCEPTANCE_20260909.md:65` correctly leaves this
  as a contract gate, not an implementation assumption.

### 3. Email side effect

- `src/app/api/bookings/route.ts:315-336` loads the committed snapshot, sends
  mail only after a successful non-replay commit, and returns booking success
  even when delivery fails. The current worktree no longer writes
  `Bookings.reception_feedback`.
- `src/lib/mailer.ts:647-680` validates customer/reception recipients and
  avoids SMTP delivery to reserved synthetic domains. `:763-789` sends to the
  customer and BCCs reception when both recipients are present; `:791-805`
  retries on the alternate SMTP port and returns a failure result without
  throwing it into the booking transaction.
- Real inbox receipt is **not verified**. Provider acceptance/message ID is not
  inbox proof, and `emailStatus.pending` is only in the immediate API response.
  There is no durable retry record in the current route.
- Acceptance gap: `src/app/api/bookings/route.ts:91-101` reconstructs a service
  with per-unit duration and quantity, while `src/lib/mailer.ts:384-389` and
  `:688-693` sum duration without multiplying by quantity. The email template
  renders a joined service-name string and one total duration at
  `:469-496`; it does not render per-line quantity. A real quantity-2 receipt
  must therefore be inspected before calling the email case PASS.

### 4. Operations-admin boundary

- `src/app/api/admin/bookings/route.ts:4-8` returns 404 and states booking
  operations belong to the separate internal system.
- `src/app/api/admin/bookings/[id]/route.ts:4-7` likewise rejects status writes.
- `src/app/admin/bookings/page.tsx:1-5` and `src/app/admin/customers/page.tsx:1-5`
  redirect to the CMS home; `src/app/admin/layout.tsx:16-30` contains no booking
  or customer navigation item.
- This proves the web CMS is not the operations receiver. It does **not** prove
  that the separate operations-admin UI can see the row, parse
  `WB-DDMMYYYY-NNN`, resolve `customerId=NULL`, or display options/duration.
  Only an operations owner viewing the actual receipt can close that gate.

### 5. Counter-only SQL and compatibility

- `supabase/GO_LIVE_COUNTER_ONLY_READY_TO_PASTE.sql:16-20` adds only the
  counter table, while `:22-79` allocates a date-local code under
  `Asia/Ho_Chi_Minh`, skips existing `id` or `billCode` collisions, and does
  not reuse numbers after rollback.
- `:81-150` defines a new idempotent writer keyed through an `idLegacy` v2
  marker; `:221-264` allocates the ID and performs the parent/child inserts in
  the same transaction.
- `:268-275` restricts counter/table and writer access to `service_role`.
- The allocator is safe only if all writers that can consume the shared
  `Bookings.id`/`billCode` namespace are coordinated. The preflight itself says
  the existing namespace, constraints, and other writers must be reviewed at
  `supabase/verification/20260909_counter_only_preflight_read_only.sql:52-81`.
- The draft SQL's `webbooking_submit_booking` is therefore an entrypoint change,
  even though it avoids ALTERing the three business tables. It must not be
  applied until the operations owner confirms ownership of `idLegacy`, the code
  format, the `NEW`/`WAITING` defaults, and the unlinked-customer contract.

## Local evidence run

Read-only/local-only commands run against the current worktree:

- `node scripts/test-go-live-api.mjs`: PASS, actual-route mocked integration
  9/9; no network/SMTP/production data.
- `node scripts/test-terra-2-booking-api.mjs`: PASS, API matrix 14/14.
- `node scripts/test-booking-route-control-flow.mjs`: PASS.
- `node --experimental-strip-types scripts/test-mailer-hardening.ts`: PASS;
  transport is mocked and synthetic recipients are suppressed.
- `scripts/test-counter-only-booking-db.mjs` was inspected but not run by this
  audit because it starts a disposable PostgreSQL server; its own source states
  it is isolated at `:1-2` and reports 8/8 in the existing handoff
  `plans/GO_LIVE_COUNTER_ONLY_ACCEPTANCE_20260909.md:162-170`. That is not shared
  DB or operations-admin evidence.

## Ten-case acceptance checklist

Every case below requires a fixture/test run ID and before/after catalog snapshot.
Production/shared DB and inbox/admin cases remain blocked until an approved
staging environment and operations observer are supplied.

| # | Acceptance case | Required proof | Current status |
|---|---|---|---|
| 1 | Canonical price integrity | `Services.priceVND`, `priceUSD`, `duration`, `isActive` unchanged before/after; booking total and every item price match DB | **LOCAL PASS / SHARED DB NOT RUN** |
| 2 | Customer identity | Parent `customerId` matches the operations contract; existing `Customers` row is not mutated; guest snapshot fields remain exact | **BLOCKED: current writer writes NULL; owner decision required** |
| 3 | Source and initial status | Parent is `source=WEB_BOOKING`, status `NEW`; child rows are `WAITING`; client cannot set paid/dispatch status | **LOCAL CODE PASS / ADMIN NOT VERIFIED** |
| 4 | Quantity and duration | Each selected line keeps quantity; duration is checked against catalog and remains inspectable in `BookingItems.options._booking.duration` or the agreed admin field | **PARTIAL: SQL test checks quantity, not full duration read-back** |
| 5 | Options and add-on lines | Strength, therapist, focus/avoid, notes, and private-room linkage survive; add-on quantity/price is exact and not duplicated | **LOCAL MOCK/DISPOSABLE CONTRACT ONLY; ADMIN NOT RUN** |
| 6 | Atomic write and numbering | One transaction creates parent plus all items; one collision-free `WB-DDMMYYYY-NNN` is allocated; no number reuse after rollback | **LOCAL/DISPOSABLE EVIDENCE ONLY; shared namespace NOT PREFLIGHTED** |
| 7 | Retry/idempotency | Same key and same intent returns the same booking/items without a second email; same key and changed intent returns 409 without prior data | **MOCK/DISPOSABLE PASS; real timeout-after-commit NOT RUN** |
| 8 | Customer email receipt | Actual inbox contains the correct booking code, customer/contact, service lines, quantity, duration, options, total, and language; record message ID/delivery event | **BLOCKED: no real email/inbox evidence; quantity-duration gap noted** |
| 9 | Reception/admin receipt | Reception gets the intended notification, and the separate operations-admin user confirms the exact ID, source/status, customer link, time, price, qty, duration, options, and add-on | **BLOCKED: separate system not available to this repo** |
| 10 | Failure/recovery safety | Invalid slot/quantity/options, catalog change, writer outage, and mail outage reject or degrade without partial rows, price mutation, status mutation, or duplicate booking | **MOCK PASS; shared DB/RPC/operations recovery NOT RUN** |

## Exact counter integration decision

1. Run the read-only preflight against the shared database. Confirm the actual
   `Bookings.id` and `billCode` namespace, `idLegacy` ownership, all current
   writers/triggers/constraints, status enum/defaults, item option storage, and
   whether `customerId` may be NULL at intake.
2. If the existing operations-owned booking function is transaction-capable,
   add the allocator call **inside that function** before its existing parent
   insert. Use the returned ID for both parent `id` and `billCode`, then retain
   its existing customer, source/status, and child-item behavior. Keep the web
   API calling that same function.
3. If no such writer exists, obtain operations-owner approval for the drafted
   `webbooking_submit_booking` function. Treat it as a replacement/versioned
   booking entrypoint, not as a harmless counter install. Ensure the old web
   writer is disabled or cannot race the new namespace, and keep the writer
   `service_role`-only.
4. Never allocate in the browser, in Node before the transaction, or as a
   separate RPC followed by REST inserts. Those designs can leak numbers or
   leave a parent without items. Never use `MAX(id)+1` or infer the operations
   contract from the prefix alone.
5. After staging apply, prove the ten cases above, including a real operations
   view and inbox receipt. Only then consider deploying the API change to the
   `vercel` branch.

