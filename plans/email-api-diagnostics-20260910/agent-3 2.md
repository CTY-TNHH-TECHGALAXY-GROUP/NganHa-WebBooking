# Agent 3 Handoff: Email Diagnostics Contract Review

Date: 2026-09-10 (Asia/Ho_Chi_Minh)

## Ownership and scope

- Base SHA reviewed: `b30322c33e54c7ffdca4ec4d2642e4d418d14c55`.
- Agent 3 changed only `scripts/test-email-diagnostics-contract.mjs` and this report.
- Shared worktree HEAD at handoff: `51a5802ab1d3874d78189b5823b62a3a1afaaf75`; this parallel-work commit was not created by Agent 3.
- No production code, Agent 1/2 test file, booking, SMTP request, Vercel request, or database write was performed.
- Agent 1/2 changes and other pre-existing worktree changes were left intact.

## Test result

Command:

```text
node scripts/test-email-diagnostics-contract.mjs
```

Initial result was **12/13 passed; 1 failed**. After integration fixes, the same test is **13/13 passed**. The test uses a VM-loaded booking route with mocked Supabase and mailer dependencies. It performs no network, SMTP, production booking, or DB write.

Covered assertions include:

- exact diagnostics enums, `diagnosticsVersion: 1`, public field/attempt allowlists, and maximum two attempts;
- accepted, SMTP auth/connect/TLS/recipient failures, timeout and post-DATA unknown outcomes;
- preparation/configuration zero-attempt outcomes and synthetic skip without a fake `messageId`;
- primary failure plus fallback acceptance;
- thrown, malformed, messageId-only, contradictory, and raw provider/PII-containing mailer results;
- replay no-resend behavior with `EMAIL_REPLAY_NOT_ATTEMPTED` and empty attempts;
- no direct booking writes/deletes and no sentinel secret, recipient, host, token, or stack leakage in response/log capture.

The initial failing case was actionable: an injected result with `success: true`, `outcome: "accepted"`, but `code: "SMTP_CONNECTION_FAILED"` could produce `sent: true`. The mapper now treats contradictory result fields as malformed and returns `unknown`/`EMAIL_RESULT_UNKNOWN` with `sent: false` and no `messageId`.

## Scope risks found

1. Fallback is now limited to retry-safe connection setup or STARTTLS failures; timeout/DATA uncertainty is not retried blindly.
2. The API mapper rejects more than two or malformed/duplicate attempts as `EMAIL_RESULT_UNKNOWN` instead of silently hiding them.
3. Replay diagnostics are deliberately diagnostics-only and omit legacy `sent`/`pending`/`messageId`, which matches the plan because the route has no persisted historical delivery receipt. Do not convert this into a historical delivery claim.

## Integrator acceptance checklist

- [ ] Normal and replay responses expose `diagnosticsVersion: 1` where `emailStatus` is present.
- [ ] `emailStatus` contains only `sent`, optional `pending`/`messageId`, `diagnosticsVersion`, `outcome`, `stage`, `code`, and `attempts`.
- [ ] Outcome is only `accepted|failed|unknown|skipped`; stage is only `preparation|configuration|smtp|unknown`; code is only the plan enum.
- [ ] `sent: true` requires customer recipient acceptance evidence, `outcome: accepted`, and `code: SMTP_ACCEPTED`; a message ID alone never proves acceptance or inbox delivery.
- [ ] Failed, unknown, and skipped outcomes never claim `sent` or expose a message ID. Synthetic skip has zero SMTP attempts.
- [ ] Preparation/configuration failures have zero attempts. Every public attempt has only `attempt`, `stage`, and `code`; total attempts and actual `sendMail` calls are at most two.
- [ ] Partial acceptance (reception BCC accepted, customer rejected) is `SMTP_RECIPIENT_REJECTED`, not sent. Missing recipient arrays are `EMAIL_RESULT_UNKNOWN`.
- [ ] SMTP auth/connect/TLS errors classify from structured fields without raw provider response, hostname, username, password, token, recipient arrays, error message, or stack in response/logs.
- [ ] Timeout or error after DATA is `unknown` and does not blindly retry. Primary failure plus a genuinely retry-safe fallback acceptance preserves both bounded attempt records.
- [ ] Mailer throw or malformed/contradictory result is safe unknown; booking remains successful after verified commit.
- [ ] Replay performs no mail dispatch and returns `EMAIL_REPLAY_NOT_ATTEMPTED` with `attempts: []`; validation/verification failures do not send mail.
- [ ] No claim of inbox delivery is made from SMTP acceptance or `messageId`; production evidence still requires admin/outbound/inbox observation by the website owner.

## Required reruns after Agent 1/2 integration

```text
node scripts/test-email-diagnostics-contract.mjs
node --experimental-strip-types scripts/test-mailer-hardening.ts
node scripts/test-go-live-api.mjs
node scripts/test-booking-route-control-flow.mjs
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

Do not create another booking while a diagnostics field is missing. A production TEST request should be made only by the website owner, then capture the URL, UTC submit time, booking ID, idempotent flag, diagnostics version, outcome/stage/code/attempts, admin receipt, provider outbound evidence, and independent inbox evidence with customer data masked. A green mock is only contract evidence, not delivery proof.
