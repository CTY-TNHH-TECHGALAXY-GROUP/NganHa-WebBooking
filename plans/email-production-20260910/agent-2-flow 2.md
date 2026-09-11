# Agent 2 - Booking API flow investigation

Date: 2026-09-10
Base SHA: `2f391ad1cdb176bc7560a58396f46f5159cc28e1`
Branch at start: `master`
Scope: `src/app/api/bookings/route.ts` and route/API tests only.

## Finding

Confidence: `REPRODUCED_ONLY` for the delivery gap. No production request,
deployment log, SMTP log, inbox receipt, or database mutation was used here.

The route has several success paths that intentionally return before the mailer:

| Branch | Route location | Mock result | Mailer calls |
| --- | --- | --- | ---: |
| New commit | `route.ts:584-639` | HTTP 200, `idempotent: false`, `emailStatus.sent: true` when the stub accepts | 1 |
| Initial replay | `route.ts:509-515` | HTTP 200, `idempotent: true`, stored snapshot | 0 |
| Writer replay | `route.ts:611-615` | HTTP 200, `idempotent: true`, verified snapshot | 0 |
| Reconcile after writer timeout | `route.ts:595-596`, `route.ts:343-352` | HTTP 200, `idempotent: true`, complete replay found | 0 |
| Reconcile after malformed/lost writer response | `route.ts:584-586`, `route.ts:343-352` | HTTP 200, `idempotent: true`, complete replay found | 0 |
| Replay after SMTP failure | `route.ts:509-515` | HTTP 200, `idempotent: true` on retry | 0 on retry |

The last three cases can produce a committed booking and a successful API
response without proving that this request, or any earlier request, dispatched
the customer email. This is a local control-flow reproducer, not proof that a
specific production booking followed this path.

This is not patched in the route. Adding an unconditional mail call to replay
or reconciliation would duplicate mail when SMTP accepted the message but the
RPC/mail response was lost. The current route has no persistent dispatch state
that can distinguish `failed` from `unknown` after a timeout. A durable retry
design needs a separately reviewed state/outbox/worker contract; that is outside
Agent 2 ownership and must not change the booking/admin schema implicitly.

## Mock setup

`test-go-live-api.mjs` transpiles the actual route in a VM and injects:

- an in-memory Supabase query/RPC stub for `Services`, `Customers`, `Bookings`,
  `BookingItems`, the allocator RPC, and `webbooking_commit_booking`;
- a mailer stub that records calls and can return `success: false` or throw;
- no network, SMTP connection, production environment, admin API, SQL, or real
  customer data.

The trace for a new commit is asserted as:

`allocate RPC -> writer RPC -> Bookings verification -> BookingItems verification -> mailer`

The test also rejects direct `Bookings`/`BookingItems` insert and delete
fallbacks.

## Reproduction matrix

| Scenario | Expected response | Writer/allocator | Verification | Mailer | Result |
| --- | --- | ---: | ---: | ---: | --- |
| New commit, SMTP accepted | 200, `idempotent: false`, `sent: true` | 1 / 1 | complete | 1 | PASS |
| Initial replay | 200, `idempotent: true` | 0 / 0 | replay snapshot | 0 | PASS; intentional no-mail path |
| `writerReplay` | 200, `idempotent: true` | 1 / 1 | complete | 0 | PASS; success/no-mail reproduced |
| Writer timeout after commit | 200, `idempotent: true` | 1 / 1 | reconcile complete replay | 0 | PASS; success/no-mail reproduced |
| Writer response missing after commit | 200, `idempotent: true` | 1 / 1 | reconcile complete replay | 0 | PASS; success/no-mail reproduced |
| Verification row/items missing or read error | 503, `BOOKING_TEMPORARILY_UNAVAILABLE` | 1 / 1 | not verified | 0 | PASS; fail closed |
| Verification failure then same-key retry | first 503, retry 200 replay | 1 / 1 | first fails, retry sees complete replay | 0 | PASS; delivery gap reproduced |
| SMTP throw after commit | 200, `emailStatus.pending: true` | 1 / 1 | complete | 1 | PASS; booking remains success |
| SMTP returns `success: false` | 200, `emailStatus.pending: true` | 1 / 1 | complete | 1 | PASS; booking remains success |
| Retry after SMTP failure | 200 replay on retry | 1 / 1 total | stored snapshot | 1 total | PASS; no duplicate, no recovery |
| Two concurrent same-key requests | both 200, same booking | 2 writers | both complete | 1 | PASS in writer-new/writer-replay mock |

## Contract checks

- Booking commit remains the `webbooking_commit_booking` RPC boundary.
- The route does not insert/delete `Bookings` or `BookingItems` directly.
- `status: 'NEW'`, `totalAmount` from canonical pricing, `customerId`,
  `idLegacy: idemp:<key>`, and the existing snapshot response are unchanged.
- No email is sent before database verification.
- Verification failure returns retryable 503 and does not claim success.
- SMTP failure does not turn an already committed booking into API failure;
  the response keeps the existing pending flag behavior.
- Replay and writer replay do not resend, preserving duplicate suppression.

## Files changed

- `scripts/test-go-live-api.mjs`: expanded actual-route mock harness and added
  branch/recovery/race assertions. This script uses only a mailer stub.
- `scripts/test-booking-route-control-flow.mjs`: added static guards that
  writer replay and uncertain-commit reconciliation remain before mail dispatch
  and contain no mailer call.
- `plans/email-production-20260910/agent-2-flow.md`: this handoff.

Read but not modified: `src/app/api/bookings/route.ts`,
`src/lib/booking/contract.ts`, `README.md`, `DEVELOPMENT_NOTES.md`, and the
investigation plan. No changes were made to `src/lib/mailer.ts`, checkout,
admin, database, SQL, package scripts, or deployment files.

## Tests

All commands ran locally with mocks and no real email:

```text
node scripts/test-go-live-api.mjs                         22/22 PASS
node scripts/test-booking-route-control-flow.mjs           PASS
node scripts/test-atomic-website-mock.mjs                  9/9 PASS
node scripts/test-terra-2-booking-api.mjs                 14/14 PASS
npx tsc --noEmit                                           PASS
npm run lint                                                PASS (existing warnings only)
git diff --check                                            PASS
```

The route file itself has no diff. The Next.js docs path mentioned by the repo
instructions (`node_modules/next/dist/docs/`) was absent in this checkout; no
Next runtime API was changed.

## Blocker / handoff

The local reproducer confirms a control-flow delivery gap but cannot select a
safe route-only fix. Integrator/Agent 3 should correlate a production request
ID, booking ID, deployment SHA, route timeline, and SMTP outcome before calling
this production-confirmed. If recovery is required, design persistent dispatch
state with explicit `accepted`/`failed`/`unknown` handling, bounded retries,
and crash-safe commit-to-dispatch behavior before changing replay or reconcile
to send mail.

No commit, push, deploy, resend, or production canary was performed.
