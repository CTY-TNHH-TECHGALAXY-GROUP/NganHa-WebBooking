# Agent 2 Handoff: API Email Diagnostics

Date: 2026-09-10 (Asia/Ho_Chi_Minh)

## Files changed

- `src/app/api/bookings/route.ts`
- `scripts/test-go-live-api.mjs`
- `plans/email-api-diagnostics-20260910/agent-2.md`

No commit, booking creation, production request, or real email was performed.

## Mapping decisions

- Added a fixed-enum allowlist for `diagnosticsVersion: 1`, `outcome`, `stage`, `code`, and bounded `attempts` (maximum two entries).
- Preserved the legacy response behavior: accepted mail keeps `sent: true` and a safe `messageId`; non-accepted/malformed results keep `sent: false` and `pending: true`.
- Legacy `success: true` without diagnostics remains accepted as `SMTP_ACCEPTED` for caller compatibility. An explicit `skipped` result does not claim `sent`.
- Known mailer reason codes/stages/attempt records are copied only after validation. Empty, malformed, contradictory, or unknown results become `unknown` with `EMAIL_RESULT_UNKNOWN`.
- A thrown mailer error becomes `unknown`/`unknown` with `EMAIL_SEND_FAILED` and zero attempts. Exception fields, raw reason text, SMTP response data, recipient lists, and other mailer fields are never returned or logged.
- Replays still do not resend. Their additive `emailStatus` contains diagnostics only: `unknown`, `EMAIL_REPLAY_NOT_ATTEMPTED`, and `attempts: []`; it does not claim historical `sent`, `pending`, or delivery state.
- Booking validation, verified-commit ordering, HTTP success after committed booking, database/RPC/schema/status behavior, and admin files were left unchanged.

## Tests

- `node scripts/test-go-live-api.mjs`: **24/24 passed** (mocked route; no network/SMTP/production data).
- `node scripts/test-booking-route-control-flow.mjs`: **passed**.
- `git diff --check`: **passed**.

The route harness covers accepted, classified SMTP failure, unknown delivery, malformed/empty results, thrown errors, replay/no resend, and secret omission. It emitted only the existing Node module-type warning.

## Unresolved risks

- `src/lib/mailer.ts` was intentionally not changed. The mapper accepts the planned safe top-level/nested diagnostics fields and legacy results; the integrator should verify the final Agent 1 result shape uses the listed enums.
- Replay diagnostics are request-level no-resend information only. Historical email delivery remains unavailable without persisted dispatch state or external evidence.
- This patch does not add retries or delivery recovery; unknown SMTP outcomes remain unknown by design.
