# Email API Diagnostics Integrator Report

Date: 2026-09-10 (Asia/Ho_Chi_Minh)

## Result

The diagnostics plan is implemented and locally verified. A committed booking still returns HTTP success when mail fails or is uncertain, while `emailStatus` now exposes only the safe versioned diagnostics contract. No database schema, RPC, booking status, price, idempotency, or admin dispatch behavior was changed.

`sent: true` is emitted only when the customer recipient is present in SMTP accepted evidence. A message ID or reception/BCC acceptance alone is not treated as customer delivery. SMTP timeout or DATA-stage uncertainty is returned as `unknown` and is not blindly retried; fallback remains available only for retry-safe connection setup or STARTTLS failures.

## Verification

- `node scripts/test-email-diagnostics-contract.mjs`: 13/13 passed.
- `node --experimental-strip-types scripts/test-mailer-hardening.ts`: passed.
- `node scripts/test-go-live-api.mjs`: 24/24 passed.
- `node scripts/test-booking-route-control-flow.mjs`: passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed with existing repository warnings; no new lint failure.
- `npm run build`: passed with Next.js 15.5.14.
- `git diff --check`: passed.

All tests used mocks or static checks. No production booking, SMTP request, database write, Vercel login, or real email was performed by the agents.

## Production acceptance step

After the deployment containing the final SHA is serving, the website owner should create one controlled booking with a `TEST` prefix. Capture the API response fields `bookingId`, `idempotent`, `emailStatus.diagnosticsVersion`, `outcome`, `stage`, `code`, and `attempts`, then compare that booking with the admin dispatch receipt and the mail provider/inbox evidence. A mock PASS or `SMTP_ACCEPTED` proves only provider acceptance, not final inbox delivery.

## Decision table

- `SMTP_AUTH_FAILED`: verify deployed SMTP credentials and provider permission.
- `SMTP_CONNECTION_FAILED` or `SMTP_TLS_FAILED`: verify runtime network/port/TLS configuration.
- `SMTP_TIMEOUT` or `SMTP_DELIVERY_UNKNOWN`: delivery state is unknown; do not resend automatically.
- `EMAIL_PREPARATION_FAILED`: inspect template/input preparation.
- `EMAIL_CONFIGURATION_UNAVAILABLE`: verify deployed transporter configuration.
- `SMTP_RECIPIENT_REJECTED`: inspect the recipient rejection evidence.
- `EMAIL_RESULT_UNKNOWN`: inspect the structured result boundary; no delivery claim is safe.
