# Agent 3: Mailer / SMTP Investigation

Date: 2026-09-10
Base SHA: `2f391ad1cdb176bc7560a58396f46f5159cc28e1`
Scope: `src/lib/mailer.ts`, `scripts/test-mailer-hardening.ts`, this report only.

## Conclusion

Production root cause: `UNKNOWN`.

No Vercel, Zoho, production SMTP, deployment or inbox evidence was accessed. The findings below are deterministic local fake-transporter reproductions only (`REPRODUCED_ONLY`), so they must not be presented as proof that a specific production booking failed at the mailer.

No production email was sent. No commit, push or deploy was performed.

## Reproduced Before-State Findings

| Area | Before-state evidence | Confidence |
| --- | --- | --- |
| Template before `sendMail` | A service `name` getter throwing resulted in `sendMail` count `0`, but the public result was only `{ success: false, error: "Notification delivery failed." }`; no stage or safe reason was available. | REPRODUCED_ONLY |
| Transporter config | Missing SMTP credentials returned a generic failure. Invalid SMTP ports were not validated before transporter creation. | REPRODUCED_ONLY |
| Port 465/587 | With `SMTP_PORT=587`, a primary auth failure still invoked the fallback factory with `587`; the old warning also always claimed a 465 attempt. | REPRODUCED_ONLY |
| Timeout/TLS/auth | Any primary `sendMail` throw entered the 587 fallback, including auth and non-retryable failures. There was no allowlisted code, command, response code, stage, attempt or elapsed time in the result/log. | REPRODUCED_ONLY |
| Recipient rejection | `{ accepted: [reception], rejected: [customer], messageId }` resolved as `success: true`. This could report customer delivery as sent when only BCC/reception was accepted. | REPRODUCED_ONLY |
| Partial accepted | Customer and reception outcomes were not separated; the old implementation used the single resolved `sendMail` result as success for the whole message. | REPRODUCED_ONLY |
| Attachment | Attachment failures occurring during `sendMail` fell into the generic catch and could not be distinguished from SMTP failures. | REPRODUCED_ONLY |
| Synthetic recipient | Synthetic customer recipient skipped SMTP and returned `success: true`, including when a real reception address was present; no message was actually sent. | REPRODUCED_ONLY |

The existing pre-change `node scripts/test-mailer-hardening.ts` passed, but it did not cover these failure contracts. It specifically encoded the old synthetic `success: true` behavior.

## Return Contract Proposed

The mailer draft keeps `success` and `messageId` for current callers, while adding:

- `customer.outcome` and `reception.outcome`: `accepted | failed | unknown | skipped`.
- `reasonCode` and `stage` with safe, non-PII values.
- `smtp`: allowlisted `port`, `attempt`, `elapsedMs`, `stage`, `code`, `responseCode`, and `command` only.
- `success: true` only when the primary target is SMTP-accepted. This is not inbox receipt confirmation.
- A timeout after `DATA` is `unknown` and is not blindly resent.
- Fallback is allowed only from primary 465 for connection/TLS/connection-timeout classes. No fallback is attempted for primary 587, auth, recipient rejection, attachment failure, or unknown-after-DATA.

## Patch Review: Keep or Reject

Do **not** keep the current mailer diff verbatim as the integration patch. The exact current worktree diff is approximately `558` added and `122` deleted lines in `src/lib/mailer.ts` (the rough “680-line patch” description includes the broad expansion). It addresses real reproduced defects, but it is too large for the demonstrated scope and should be reduced/re-reviewed before integration.

The behaviors worth retaining in a smaller patch are:

1. Explicit customer/reception recipient outcomes and no false success on customer rejection.
2. No same-port fallback and no fallback for auth, recipient rejection, attachment failure or unknown post-DATA outcomes.
3. Safe SMTP diagnostics without raw error text, credentials or recipient addresses.
4. Template/attachment preflight reasons and strict 465/587 validation.
5. Synthetic skip reported as `skipped`, not as a sent email.

The current draft should therefore be treated as an investigation artifact, not production-approved code. Agent 2 must agree to the return contract before any integration. No route, checkout, admin, DB or SQL file was changed by Agent 3.

## Tests / Verification

- Baseline `node scripts/test-mailer-hardening.ts`: PASS.
- Baseline `npx tsc --noEmit`: PASS.
- Before-state fake reproductions confirmed the port retry and partial-recipient false-success cases described above.
- The test script was expanded for template, attachment, transporter config, invalid port, 465/587, timeout, TLS, auth, RCPT rejection, post-DATA unknown, partial acceptance, five template languages and synthetic skip.
- Per the stop instruction, the expanded test was not run after the final edit, and final post-edit typecheck was not rerun after the legacy `error`/`reason` compatibility fields were added. Final verification remains required before integration.

## Blockers / Handoff

- No production timeline or root-cause confirmation is available from this agent.
- Local SMTP was not used; fake transporters only.
- Production acceptance E10, Zoho outbound evidence and inbox confirmation remain unverified.
- Integrator should review/reduce the draft diff, run targeted test plus typecheck, then obtain production evidence with one controlled canary. Do not use local PASS as production PASS.
