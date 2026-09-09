# Agent 1 handoff

## Files changed

- `src/lib/mailer.ts`
- `scripts/test-mailer-hardening.ts`
- `plans/email-api-diagnostics-20260910/agent-1.md`

No API route, schema, migration, RPC, admin flow, booking behavior, recipient policy, fallback policy, or SMTP setting was changed. Tests use fake transporters only; no real email or booking was sent.

## Contract

`sendBookingConfirmationEmail` now returns the legacy `success` and `messageId` fields where available, plus:

- `diagnosticsVersion: 1`
- `outcome`: `accepted | failed | unknown | skipped`
- `stage`: `preparation | configuration | smtp | unknown`
- `code`: the plan's allowlisted diagnostic code union
- `attempts`: only actual `sendMail` calls, capped by the existing primary plus port-587 fallback flow

SMTP success requires the intended recipient to appear in the transporter's `accepted` evidence. A BCC/reception-only result or message-id-only result is `unknown`, not customer `success`. An explicit customer rejection is `SMTP_RECIPIENT_REJECTED`. Synthetic/test recipients return `skipped` with no fabricated message ID and no SMTP attempt.

Errors expose only the structured classification; raw error messages, SMTP responses, host/user data, recipient arrays, tokens, and secrets are not returned or logged by this mailer path.

## Tests

- `node --experimental-strip-types scripts/test-mailer-hardening.ts`: PASS
- `npx tsc --noEmit`: PASS

The focused test covers HTML escaping, recipient routing, customer/BCC evidence, message-id-only uncertainty, primary/fallback attempts, auth/DNS/TLS/timeout classification, preparation/configuration failures, synthetic skip, and secret-sentinel non-leakage.

## Unresolved risk

`SMTP_ACCEPTED` is envelope/provider acceptance evidence only. It does not prove final delivery, inbox placement, or customer receipt. The API response mapper still needs to consume this result contract; no production/Vercel evidence was collected in this agent task.
