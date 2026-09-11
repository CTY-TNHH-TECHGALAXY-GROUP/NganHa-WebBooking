# Agent 1 - Production evidence (read-only)

Date: 2026-09-10 (Asia/Ho_Chi_Minh)
Scope: production deployment/branch/SHA, source handler, one latest DB booking, request/runtime evidence, and Zoho evidence.
Actions prohibited and not performed: booking creation, email send, migration, admin write, DB write, commit, push, deploy.

## Classification

- `CONFIRMED`: directly observed in the stated source, Git ref, public HTTP response, or read-only DB query.
- `REPRODUCED_ONLY`: observed in a local/mock or historical artifact, not linked to the current production incident.
- `UNKNOWN`: the required production correlation evidence was unavailable; no inference is made.

## Evidence index

| ID | Classification | Evidence |
| --- | --- | --- |
| E1 | CONFIRMED | Git base and remote branch refs |
| E2 | CONFIRMED | Public Vercel alias and HTTP headers |
| E3 | UNKNOWN | Vercel project/deployment API access |
| E4 | CONFIRMED | Booking route source behavior in the local worktree |
| E5 | REPRODUCED_ONLY | Mailer source behavior; `src/lib/mailer.ts` is modified in the worktree by another actor |
| E6 | CONFIRMED / UNKNOWN for production identity | One latest-row read-only query against the DB configured in `.env.local` |
| E7 | REPRODUCED_ONLY | Historical live HTTP artifact from 2026-09-08 |
| E8 | REPRODUCED_ONLY | Historical direct SMTP receipt from local test script |
| E9 | UNKNOWN | Vercel Runtime Logs, Zoho outbound logs, and inbox receipt |

## Git and deployment target

### E1 - Git refs: CONFIRMED

The current worktree is on `master`, with base commit:

```text
2f391ad1cdb176bc7560a58396f46f5159cc28e1
2026-09-10T00:39:39+07:00
feat(admin): add direct image upload and Google Drive link processing to narrative image frames
```

Read-only `git ls-remote` confirmed:

```text
origin master  = 2f391ad1cdb176bc7560a58396f46f5159cc28e1
origin vercel  = 2f391ad1cdb176bc7560a58396f46f5159cc28e1
```

The local `vercel` ref and `origin/vercel` also point to this SHA. This is Git evidence only, not proof that Vercel deployed this revision.

The worktree was already dirty before this report. Existing unrelated state includes modifications to `src/lib/mailer.ts` and test scripts, plus untracked plan/handoff artifacts. Agent 1 did not alter or revert them.

### E2 - Public alias: CONFIRMED

`README.md` identifies `https://ngan-ha-web-booking.vercel.app/` as the current website. Read-only public HTTP check:

| URL | UTC response | Asia/Ho_Chi_Minh | Result |
| --- | --- | --- | --- |
| `https://ngan-ha-web-booking.vercel.app/` | `2026-09-09T19:14:09Z`, HTTP `307` | `2026-09-10 02:14:09 +07` | `Location: https://oria-spa.vercel.app/` |
| `https://oria-spa.vercel.app/` | `2026-09-09T19:14:12Z`, HTTP `200` | `2026-09-10 02:14:12 +07` | Vercel HTML response |

Observed public headers included `server: Vercel`, `x-matched-path: /`, Next prerender/cache headers, and edge request IDs such as:

```text
hkg1::dlqgt-1788981249809-cad562f9c730
sin1::bjbvz-1788981251643-7c663893ece9
```

These `x-vercel-id` values are request/edge metadata. They are not deployment IDs, Git SHAs, or proof of the runtime region. The two aliases returned the same HTML length and ETag in this check, but that still does not identify the deployed revision.

### E3 - Deployment detail: UNKNOWN

Deployment ID, deployment creation time, target (`Production`), deployed branch, deployed Git SHA, runtime version, and function region are `UNKNOWN`.

Evidence for the block:

- `vercel` CLI is not installed in the workspace.
- Public `api.vercel.com/v9/projects/ngan-ha-web-booking` and `/oria-spa` returned HTTP `403` with `missingToken: true`.
- No browser session or Vercel dashboard access was available.
- Public HTML/headers did not expose a commit SHA or deployment ID.

Therefore the local source cannot be proven to be the source running behind the production alias.

## Source evidence

### E4 - Booking route: CONFIRMED as local source evidence

Reviewed `src/app/api/bookings/route.ts` in the current worktree:

- `:509-517`: replay lookup returns a completed snapshot immediately and does not enter the mail path; incomplete replay returns `409`.
- `:584-608`: atomic writer result is handled, then the booking is read back before acknowledgement.
- `:606-609`: a committed snapshot must be loaded and complete; an unavailable verification returns `BOOKING_TEMPORARILY_UNAVAILABLE`.
- `:611-616`: a writer replay is returned without sending email.
- `:617-622`: the route refuses to acknowledge or mail when the verified snapshot does not match the request.
- `:623-636`: mail dispatch starts only after the verified snapshot and calls `sendBookingConfirmationEmail`.
- `:637-639`: mail exceptions are swallowed and the route still returns booking success; `emailStatus` is assembled in the immediate response only.

This proves the behavior of the inspected local route. It does not prove the production deployment uses this file.

### E5 - Mailer: REPRODUCED_ONLY

Reviewed `src/lib/mailer.ts`:

- `:195-215`: transporter defaults to `smtp.zoho.com`, uses configured SMTP credentials, and has 15-second connection/socket timeouts.
- `:675-680`: missing credentials result in a non-success result; no SMTP call is made.
- `:747-799`: template/attachment preparation happens before `sendMail`; a primary send failure triggers a second transporter on port `587`.
- `:801-805`: any `sendMail` resolve is logged as sent and returned as success with `messageId`; `accepted`/`rejected` recipient arrays are not checked; the final catch returns a generic failure without the SMTP error details.

This is source/reproducer evidence only. The file is already modified in the worktree by another actor, so no deployment claim is attached to these exact working-tree lines.

The checkout client uses a 20-second `AbortController` timeout and sends an `Idempotency-Key` (`src/app/[lang]/new-user/[menuType]/checkout/page.tsx:1169-1180`). No production request was captured to determine whether an abort raced with SMTP.

## DB evidence

### E6 - Latest booking row: CONFIRMED for configured DB; UNKNOWN as production identity

A single read-only REST query was run using the existing `.env.local` Supabase configuration:

- `Bookings`: `order=createdAt.desc`, `limit=1`.
- `BookingItems`: read-only lookup for that one booking ID.
- No values of URL, key, password, token, or full PII were printed.
- No insert, update, RPC write, migration, or admin operation was performed.

Result, with PII masked:

```text
bookingId:          WB-10092026-010
billCode:           WB-10092026-010
source:             WEB_BOOKING
status:             NEW
createdAt:          2026-09-09T16:25:32.504  (no offset returned; timezone UNKNOWN)
updatedAt:          2026-09-09T16:25:32.504  (no offset returned; timezone UNKNOWN)
bookingDate:        2026-09-10T09:00:00
timeBooking:        09:00
customerLang:       vi
customerEmail:      n***@gmail.com (present)
customerPhone:      +8***93 (present)
customerId:         present
idLegacy:           idemp marker present
BookingItems:       1 row, HTTP 200 read
```

The row exists in the DB configured locally and is structurally complete enough for the observed read (`Bookings` plus one `BookingItems` row). The configured DB cannot be independently proven to be the exact production DB because Vercel environment/deployment identity is unavailable. This booking is a historical/latest candidate only; no request ID, submit response, or incident report links it to the email complaint.

## Request/runtime/Zoho evidence

### E7 - Historical live HTTP artifact: REPRODUCED_ONLY

The existing artifact `plans/customer-flow-test-results/results 2.json` records a live HTTP run against `https://oria-spa.vercel.app` at `2026-09-08T17:07:18.873Z`.

It records that CF08 unexpectedly returned HTTP `200` and created `WB-08092099-53UPD855` with status `NEW` for a test slot. The artifact says the row was read back from the configured DB and that the confirmation email was not independently verified. This is not the current complaint request, has no deployment SHA/request ID/runtime log, and is not evidence of the email root cause.

### E8 - Historical SMTP receipt: REPRODUCED_ONLY

The existing receipts `plans/customer-flow-test-results/email-receipt 2.json` and `email-correction-receipt 2.json` came from the local `scripts/test-customer-flow-live.mjs` report-mail path, which uses local `.env.local` credentials and direct Nodemailer. They are not booking-route production receipts.

Observed values, with recipient masked:

```text
recipient: n***@gmail.com
accepted:  [masked recipient]
rejected: []
messageId: <8fb240bd-f3fc-d70d-2c08-2768d4f2887d@techgalaxygroup.com>
messageId: <5d714b61-3034-f3d2-8663-ed939b902273@techgalaxygroup.com>
```

This shows only that a historical direct SMTP call resolved with an accepted recipient array. It does not prove Vercel used the same environment, that the booking notification was sent, that Zoho recorded the message, or that the inbox received it.

### E9 - Required production evidence: UNKNOWN

Unavailable in this run:

- Vercel Runtime Logs for the complaint request or for `WB-10092026-010`.
- Request ID, HTTP status, duration, timeout/termination, and captured response body for the complaint request.
- Production timeline events: request, commit, verification, mail start, SMTP attempt, SMTP result, response.
- Production environment-presence metadata for SMTP on the target deployment.
- Zoho outbound/message trace for the same sender, masked recipient, time window, or message ID.
- Inbox receipt and `receivedAt`/`confirmedAt`.
- Admin dispatch confirmation for the same booking ID.

The statement "no Zoho message exists" is therefore not independently confirmed here. Absence of a Zoho log cannot be concluded without checking the correct Zoho account, sender, recipient, time window, and log retention/filter.

## Required end-to-end timeline

No single production request was captured, so the timeline remains:

| Step | Evidence | Status |
| --- | --- | --- |
| request | request ID/body/response not available | `UNKNOWN` / `NOT_CAPTURED` |
| commit | latest configured-DB row exists, but is not linked to request | `UNKNOWN` for incident; `CONFIRMED` for E6 row existence |
| verification | no runtime log | `UNKNOWN` |
| mail start | no runtime log | `UNKNOWN` |
| SMTP attempt | no Vercel/Zoho trace | `UNKNOWN` |
| SMTP result | no Vercel/Zoho trace; historical E8 is local only | `UNKNOWN` for production |
| response | no captured production response | `UNKNOWN` / `NOT_CAPTURED` |

## Finding and blocker

Production email root cause: `UNKNOWN`.

The inspected source exposes a commit/verification-to-mail boundary and a generic mail failure path, but neither is a confirmed production cause without the same booking ID, request/runtime logs, deployment identity, and Zoho trace. No cause is ranked by assumption.

Acceptance is blocked because the required production correlation is missing. This report does not recommend a code fix, migration, resend, or deployment.

## Exact evidence requested from the website owner

Please provide redacted exports or screenshots for one specific complaint booking/request:

1. Vercel Deployment detail: project, production alias, deployment ID, target, branch, full Git SHA, deployment UTC time, runtime/framework version, and function region.
2. Vercel Runtime Logs for `POST /api/bookings` in the matching UTC window: request ID, status, duration, timeout/termination, route logs, and any mailer log lines. Include the exact deployment selected in the log view.
3. The browser/network response for that request, if retained: `success`, `idempotent`, `bookingId`, `emailStatus`, and `messageId`; otherwise mark it `NOT_CAPTURED`.
4. Read-only DB evidence for that same booking ID: parent row, item count, `status`, `source`, `customerId` presence, `idLegacy` marker, and created/updated timestamps with their type/timezone.
5. Zoho outbound/message trace for the same sender, masked recipient, UTC window, and message ID if present. Include acceptance, rejection/bounce, and SMTP auth/connection evidence separately.
6. Admin dispatch confirmation and inbox receipt for the same booking ID. A `messageId` alone is not inbox confirmation.

Do not send SMTP passwords, access tokens, cookies, or unmasked customer data.

