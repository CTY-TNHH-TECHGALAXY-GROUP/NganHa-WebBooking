# Integrator report: production booking email investigation

Date: 2026-09-10
Plan: `EMAIL_PRODUCTION_3_AGENTS_INVESTIGATION_AND_FIX_20260910.md`

## Result

Production root cause is `UNKNOWN`. The three agents did not have access to a single correlated production request containing booking ID, deployment ID, Vercel runtime logs and Zoho outbound trace. No production booking or email was created during this investigation.

The following is confirmed from the current repository and read-only checks:

- `origin/master`, `origin/vercel`, local `master` and local `vercel` currently point to `2f391ad1cdb176bc7560a58396f46f5159cc28e1`.
- A recent database booking candidate exists with `source=WEB_BOOKING`, `status=NEW`, `customerEmail` present, `customerId` present, `idLegacy` using the established `idemp:` marker and one `BookingItems` row.
- The existing route verifies `Bookings` and `BookingItems` before dispatching mail.
- The existing route can return a successful replay/reconciliation response before dispatching mail. Agent 2 reproduced this for initial replay, writer replay, timeout reconciliation, lost writer response reconciliation and retry after SMTP failure.
- The existing mailer sends after template and attachment preparation. It retries a primary port failure through 587, then returns a generic failure. It does not persist delivery state.

These source findings are `REPRODUCED_ONLY` for the reported production booking. They do not identify which branch handled that booking.

## Agent outputs

- Agent 1: [production evidence](./agent-1-evidence.md). Deployment detail, request timeline, Vercel runtime logs, Zoho outbound trace and inbox evidence remain unavailable.
- Agent 2: [booking flow](./agent-2-flow.md). Route mock and static guards pass; 22/22 mocked scenarios pass. No route patch was approved.
- Agent 3: [mailer investigation](./agent-3-mailer.md). Mailer defects were reproduced with fake transporters. Its large draft patch was rejected from the working code because production evidence was absent and post-edit verification failed once on a partial-recipient assertion.

After the review, the large Agent 3 mailer draft was removed. A small observability patch was applied instead: the route logs dispatch start/result/throw, and the existing SMTP fallback logs allowlisted code, command and response code without raw error text. This patch does not change recipient selection, retry behavior, booking writes or admin semantics.

## Verification after agent work

- `npx tsc --noEmit`: PASS.
- `node scripts/test-booking-route-control-flow.mjs`: PASS.
- `node scripts/test-go-live-api.mjs`: 22/22 PASS.
- `node --experimental-strip-types scripts/test-mailer-hardening.ts`: PASS against the restored baseline mailer.
- `git diff --check`: PASS.
- After the observability patch, the same route and mailer checks remain PASS: 22/22 route mock cases, control-flow guard and mailer hardening assertions.
- No SQL, schema, admin flow, booking route or mailer production patch was deployed.

The modified route test files are investigation coverage only:

- `scripts/test-booking-route-control-flow.mjs`
- `scripts/test-go-live-api.mjs`

## Why the customer can have a booking without a mail

The system has two separate stages:

1. The RPC commits the booking and its items. The admin dispatch system can receive this committed row.
2. The route then calls the SMTP mailer. If the mailer fails, the current route keeps the booking successful and returns a pending email flag.

The route also has replay/reconciliation branches that intentionally do not send a second email. This protects against duplicates when a previous SMTP attempt may have been accepted but the response was lost. Without a persistent delivery state, the route cannot safely decide whether to resend after an uncertain commit or a retry with the same idempotency key.

This explains the possible behavior but is not the root cause of the specific production incident until the request branch is captured.

## Required final evidence

For one reported booking, correlate all values by the same booking ID and UTC window:

1. Vercel Production deployment ID, target, branch, full SHA and runtime region.
2. Vercel Runtime Logs for `POST /api/bookings`, including status, duration, request ID and any mailer line.
3. Browser response fields `success`, `idempotent`, `bookingId`, `emailStatus` and `messageId`, or mark them `NOT_CAPTURED`.
4. Read-only DB parent/item evidence for that exact booking.
5. Zoho outbound trace for the exact sender and masked customer recipient.
6. Admin dispatch confirmation and customer inbox receipt.

Interpretation:

- No `email dispatch started` or mailer line: route branch/deployment/runtime path issue.
- Mailer transporter/preflight failure: runtime configuration, packaging or template issue.
- SMTP connection/TLS/auth failure: production runtime/provider connection issue.
- Zoho accepted message: delivery/inbox/provider trace issue, not booking commit.
- Replay or reconciliation branch: delivery recovery design is required; do not add unconditional resend.

## Next implementation decision

Do not deploy a behavior-changing route or mailer change based on the current evidence. The small observability patch is ready for review so one controlled `TEST` booking with a fresh idempotency key can identify the failing stage. Choose the behavior fix from the interpretation table only after that evidence is captured.

If recovery after SMTP failure is required, design a separate website mail delivery state/outbox with bounded retry and `accepted`/`failed`/`unknown` handling. Do not add `pending` to `Bookings`, alter `BookingStatus`, change `Bookings`/`BookingItems` schema, or change the admin dispatch contract without a separate review.
