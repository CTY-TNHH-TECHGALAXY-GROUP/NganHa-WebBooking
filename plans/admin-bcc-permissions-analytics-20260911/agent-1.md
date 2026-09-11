# Agent 1 Report: BCC Email Settings and Mail Delivery

Date: 2026-09-11

## Files changed

- `src/lib/notificationSettings.ts`: private settings key, normalization, validation, parsing, and safe persistence reads.
- `src/app/api/admin/notification-settings/route.ts`: capability-protected private GET/PATCH API with bounded JSON input and revision conflict protection.
- `src/lib/mailer.ts`: additive BCC envelope handling and safe BCC delivery diagnostics; existing customer/reception routing and diagnostics remain intact.
- `src/app/api/bookings/route.ts`: reads BCC settings after the verified booking commit and passes only safe diagnostics/counts through the existing email boundary.
- `src/app/admin/system-settings/page.tsx`: Email Notifications panel with toggle, add/remove inputs, save state, and the five-recipient limit.
- `scripts/test-bcc-settings.ts`: mock-transport tests for normalization, max five, invalid/header injection, deduplication/exclusions, rejection behavior, privacy, and backward compatibility.
- `scripts/test-go-live-api.mjs`: test harness stub for the new settings dependency.
- `scripts/test-email-diagnostics-contract.mjs`: test harness stub plus allowlisted, bounded BCC diagnostics assertions.

`scripts/test-mailer-hardening.ts` and `scripts/test-admin-bcc-contract.mjs` also contain concurrent BCC coverage from the shared worktree; their existing changes were preserved and verified.

## Contract

- Persistence uses the existing private `SystemConfigs` key `notification_settings` with value `{ bccEnabled, bccRecipients, revision }`; no production migration was created.
- The configured list accepts at most five addresses. Values are trimmed, lowercased, deduplicated case-insensitively, and rejected fail-closed when malformed or containing CR/LF/NUL header-injection characters.
- Configured recipients matching the customer `TO` or primary reception address are excluded. The existing reception delivery remains unchanged, including its legacy single-string BCC shape when it is the only BCC.
- Admin GET/PATCH is server-side and protected by Agent 2's `notification_settings.manage` capability through `withCapability`; PATCH uses optimistic `revision` checking and `private, no-store` responses.
- Absent or disabled settings do not change legacy reception behavior. Unavailable or invalid settings disable only additional configured BCC copies and emit safe operational diagnostics.
- Customer acceptance is classified from the customer recipient only. BCC acceptance/rejection is additive safe counts/code; BCC failure cannot turn a committed booking into a booking failure.
- No BCC address is placed in public site-content, customer booking responses, operational logs, or mailer diagnostics. The authenticated settings response is the only list-bearing boundary.
- Tests use mocked transports and do not send real email.

## Test commands and results

- `node --experimental-strip-types scripts/test-bcc-settings.ts` -> PASS.
- `node --experimental-strip-types scripts/test-mailer-hardening.ts` -> PASS.
- `node scripts/test-email-diagnostics-contract.mjs` -> 13/13 PASS.
- `node scripts/test-admin-bcc-contract.mjs` -> PASS.
- `node scripts/test-booking-route-control-flow.mjs && node scripts/test-go-live-api.mjs` -> 24/24 PASS plus control-flow PASS.
- `node scripts/test-atomic-website-mock.mjs` -> 9/9 PASS.
- `node scripts/test-terra-2-booking-api.mjs` -> 14/14 PASS.
- `npm run lint` -> exit 0; repository reports existing warnings.
- `git diff --check` -> PASS.
- `npx tsc --noEmit` -> blocked by one unrelated concurrent worktree error at `src/app/admin/oriafarm-store/page.tsx:534` (`story-${number}` type mismatch); no Agent 1 file was reported in that run.

## Integration blockers

- Integrator should verify that live `SystemConfigs.key` is unique and that the server-side/service-role path can read and upsert `notification_settings` under the deployed RLS/schema. No SQL draft was needed or created.
- Real BCC addresses and approved owner/admin accounts still require production acceptance; no production SQL, SMTP send, deploy, stage, commit, or push was performed.
- The settings route consumes Agent 2's shared capability helper and the frozen key `notification_settings.manage`; any helper contract change must preserve that capability gate and mutation boundary.
- The worktree contains unrelated concurrent Agent 2/3/4 changes. They were not reset or discarded.

## Latest shared-worktree verification addendum

- `npx tsc --noEmit` -> PASS after isolating the Supabase thenable type at the notification-settings helper boundary. The earlier `oriafarm-store/page.tsx` error recorded above was from a prior concurrent worktree state.
- Focused ESLint over the BCC files -> PASS, 0 errors and 36 existing warnings.
- `git diff --check`, including no-index checks for the untracked BCC files and this report -> PASS.
- Latest BCC-specific runs remained PASS: `scripts/test-bcc-settings.ts`, `scripts/test-mailer-hardening.ts`, `scripts/test-admin-bcc-contract.mjs`, and `scripts/test-email-diagnostics-contract.mjs` (13/13).
