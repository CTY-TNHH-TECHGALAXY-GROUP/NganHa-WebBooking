# Final execution and customer-flow acceptance

SUPERSEDED by `GO_LIVE_3_AGENTS_ATOMIC_WEBSITE_FINAL_20260909.md`: user selected a website transaction with no operations-admin changes. Do not execute this older plan's admin changes or no-writer restriction.

Date: 2026-09-09
Status: PLAN READY; integration acceptance pending.
This plan supersedes conflicting next-step instructions in earlier counter plans.

## 1. Final direction

- Keep the established website direct INSERT path for Bookings and BookingItems.
- Add only WebbookingBookingDailyCounters and webbooking_allocate_booking_number for number allocation. No booking-writer RPC.
- Preserve existing schema, prices, customer linkage, idLegacy convention, source WEB_BOOKING, initial NEW/WAITING, and operations-owned transitions.
- Fix parent/child receiving timing in the separate operations project. Website CMS remains content/media only.
- No create_booking_atomic, webbooking_submit_booking, new pending status, shared-table migration, or automatic changes to real catalog/customer records.
- Use bookingDate and Asia/Ho_Chi_Minh consistently; verify persisted timestamp and admin display because bookingDate has no timezone type.

## 2. Evidence and limits

External source: /Users/charlotte/Downloads/admin_dispatch_contract_audit.md, local audit of main at c8eeaf87.
According to that audit, operations generates BK-11NDK-NNN-DDMMYYYY IDs and NNN-DDMMYYYY bill codes, accepts WB-DDMMYYYY-NNN, and changes WEB_BOOKING to STANDARD_WALK_IN on confirmation. Historical STANDARD_WALK_IN rows with WB codes can therefore be converted website orders; source alone does not prove a second WB allocator.

Namespace compatibility is supported by the supplied source audit. This does not prove deployed code matches that commit, all writers are covered, or admin's own MAX+1 generator is concurrency-safe. Confirm deployed revision and writers during acceptance.

Function absence inferred from migration files is not live DB proof. User-supplied pg_catalog preflight previously showed allocator absence; refresh metadata before applying SQL.

Admin's parent-only Realtime subscription creates a credible timing risk. Reproduce it in an isolated environment, then demonstrate the fix. Counter allocation alone does not make the two inserts atomic. Customer linkage must remain preserved even though NULL is accepted.

## 3. Four agents with separate ownership

### Agent 1: Website booking reliability

Own src/app/api/bookings/route.ts and booking submit UI only. Read README.md, DEVELOPMENT_NOTES.md and relevant local framework docs first.

- Audit current replay, key reuse, number-conflict retry and child-write failure behavior against this contract.
- Verify replay compares complete persisted service/quantity/options intent; a nonempty item list alone is insufficient evidence of completion.
- Handle an ambiguous items-write timeout by reconciling persisted state before destructive cleanup. Review existing parent deletion against possible concurrent admin confirmation; do not delete an order that has entered operations processing.
- Preserve request key across retries; a new intentional booking receives a new key. A retry must not reset status, duplicate items or resend confirmation automatically.
- Return explicit retryable/incomplete outcomes; UI must retain the cart and must not report an incomplete order as successful.
- Success requires persisted intended items. Send confirmation after completion; mail failure must not cause a second booking.
- Do not implement an unapproved request store or alter shared tables to resolve limitations. Report any failure that cannot be resolved within this scope as a release blocker.
- Deliver code diff and evidence to plans/handoffs/FINAL_AGENT_1.md.

### Agent 2: Operations receiving and dispatch guard (separate project)

Own WebBookingBoard receiving logic and its server confirmation validation in the operations project. Do not change allocation, pricing, status transitions or schema.

- On parent INSERT, load the authoritative booking with items. Show a loading state while details are incomplete; disable confirmation for that state.
- Refresh on relevant BookingItems changes where an existing publication supports them. Do not add a publication/schema change without separate review. Provide bounded retry/refetch and reconnect/manual refresh fallback.
- Deduplicate events, cancel stale requests, and prevent stale responses from overwriting a later complete or already-dispatched order.
- Add a server-side readiness check immediately before confirmation. Verify intended service completeness using the existing contract, not merely items.length > 0. Document how expected completeness is established without a new field; if it cannot be established, report BLOCKED.
- Never change status merely to announce readiness. Keep existing dispatch action/RPC and business transitions.
- An order that remains empty/inconsistent must show a recoverable error and remain unavailable for dispatch. A deleted/rolled-back parent must disappear on reconciliation.
- Test delayed children, permanent child failure, duplicate events, disconnect/reconnect, and confirmation attempted before readiness.
- Deliver deployed revision, code references and runtime evidence to FINAL_AGENT_2.md for return to this project.

### Agent 3: Counter and isolated DB verification

Own supabase/GO_LIVE_COUNTER_ONLY_READY_TO_PASTE.sql, verification SQL and a new isolated-counter test harness. No route edits.

- Check SQL only creates/modifies its new counter table and allocator. Confirm fixed search_path and EXECUTE denied to PUBLIC/anon/authenticated and allowed to service_role.
- Verify preflight/postflight against a disposable PostgreSQL database. A static regex test is not runtime SQL verification.
- Test 50 concurrent allocations, existing codes in both ID columns, sequence above 999, VN date boundaries, rejected invalid input, and namespace coexistence.
- Counter consumption can leave gaps. Never reset or reuse consumed numbers.
- Compare shared-table schema/constraints/triggers/RLS and fixture catalog before/after; no changes permitted.
- Review deployed writer inventory and latest read-only preflight. Prepare apply/postflight instructions, but do not execute live migration as part of agent tests.
- Deliver exact SQL artifact and runtime results to plans/handoffs/FINAL_AGENT_3.md. If disposable DB unavailable, report BLOCKED and identify the needed test environment.

### Agent 4: Integration QA and acceptance

Own new acceptance scripts and plans/customer-flow-final-20260909/ only. Do not modify implementation owned by agents 1-3.

- Prepare the scenarios below immediately. Run full integration once agents 1-3 hand off compatible revisions.
- Record build/commit, environment and connected DB explicitly. Local website can still write production DB; local does not mean isolated.
- Use mocked/disposable infrastructure for fault injection, destructive cases and load. Real customer-flow acceptance uses UI service selection and real confirmation emails.
- Deliver case report, sanitized evidence and remaining blockers. Never label API mocks or provider acceptance as browser/inbox acceptance.

Integrator owns this plan and merges/reviews all handoffs. Agents can prepare and implement in parallel; integration and release gates are sequential. No two agents edit the same file.

## 4. Isolated fault and concurrency scenarios

| Scenario | Required outcome |
| --- | --- |
| Children delayed 0.1, 1 and 5 seconds | Admin eventually shows all items; no premature confirmation |
| Children permanently fail | No success/mail; orphan handled visibly; no accidental dispatch |
| Items commit but response times out | Reconcile actual persisted state; no destructive deletion of completed order |
| Cleanup fails | Explicit unresolved state and observable failure; no claim of rollback success |
| 20 same-key parallel requests | One parent and one intended item set; retries converge to same booking |
| Same key, changed quantity/options/customer | Conflict; no replacement booking or overwrite |
| 50 distinct requests | Unique numbers and correct complete orders; fixture prices preserved |
| Replay after admin confirms | Return existing booking without resetting status/source/customer |
| Realtime duplicate/disconnect/stale response | No duplicate card, stale empty card or lost completed state |
| Invalid time/date/service/quantity/quote | Reject before creation; 22:30 accepted if valid, 22:31 rejected |
| VN midnight and bookingDate roundtrip | Allocated date, DB timestamp, email and admin show same appointment |
| SMTP timeout/failure | Booking remains valid, honest email-pending UI; no duplicate booking on retry |

If the non-atomic existing path cannot meet an invariant, record the exact residual failure and pause release for a scope decision. Adding atomic writer SQL is not authorized by this plan.

## 5. Ten real browser customer flows

QA email: nghik22@gmail.com. Vietnam phone: +84 389898593. User has approved Terms acceptance for QA bookings. Label QA in name/notes. Coordinate a valid future appointment with operations. Use actual currently available services and prices; capture chosen service IDs and options per case.

| Case | Locale / viewport | UI selection |
| --- | --- | --- |
| CF01 canary | EN / desktop 1440 | One available standard service, quantity 1 |
| CF02 | VI / mobile 390 | One body service with a supported shorter duration |
| CF03 | JA / desktop 1440 | Increase one selected service to quantity 2 |
| CF04 | KO / tablet 768 | Same service with two distinct supported options/durations |
| CF05 | ZH / mobile 390 | Body service plus eligible private-room addon |
| CF06 | VI / desktop 1440 | Foot service with supported strength/focus/avoid choices |
| CF07 | EN / mobile 390 | Ear care; return and edit options before final submission |
| CF08 | JA / tablet 768 | Barber plus foot service; remove and re-add one selection |
| CF09 | KO / desktop 1440 | Premium service with allowed therapist preference |
| CF10 | ZH / desktop 1440 | Multiple services; double click/retry same submission key |

Use the actual locale route keys supported by this app for JA/KO/ZH. If a service/option is unavailable, document a supported replacement before execution; do not edit the catalog to satisfy a test.

For every case record: UI steps, screenshot of selection/quote, quantities/options, date/time, displayed currency and price source, submit result, booking ID, persisted parent and full item set, customer linkage, admin queue details and actual confirmation inbox evidence. Do not expose access tokens or unrelated customer data.

The admin display and email must match the selected services, quantities, options, appointment and total. For non-VND display verify against the configured exchange/DB price rule; preserve database prices. Verify all five locales render the service selection and checkout without blocking untranslated/error states.

CF01 must pass including admin receiving and inbox before CF02-CF10. Provider message ID proves submission to provider only; user inbox confirmation or mailbox evidence is required. Report BLOCKED if inbox/admin evidence is unavailable. Do not send a QA report email in place of booking confirmations.

## 6. Execution order and release decision

1. Agents implement/prepare in parallel; integrator reviews diffs and evidence. Keep database writes isolated during fault tests.
2. Pass isolated counter and integration tests. Resolve admin readiness guard and website cleanup/replay issues.
3. Refresh read-only live preflight; confirm deployment revisions and counter SQL scope. Authorized operator applies only the reviewed counter SQL, then runs read-only postflight. Expected allocator permissions: PUBLIC/anon/authenticated false, service_role true; no writer RPC created.
4. Start the approved website build against the agreed DB; execute CF01, then remaining nine cases. No load/failure injection on shared DB.
5. GO only with ten complete case records, zero unresolved P0/P1, unchanged business schema/catalog, and admin plus inbox verification. Mock results and static audit alone cannot satisfy GO.
6. Commit/deploy approved website changes to vercel branch with matching admin fix deployed; perform controlled production smoke. Deployment authorization remains a separate operational step.
7. On regression stop new submissions or roll back to a verified compatible build. Keep allocated counter values and existing bookings. Operations handles QA orders through its normal process; no automatic deletion/cancellation or sequence reset.

Report columns: case, revisions, DB/environment, locale/viewport, selected services/options, expected/actual, bookingId, admin evidence, email evidence, PASS/FAIL/BLOCKED, issue owner. Current local baseline: counter static 10/10, mocked route 13/13, API matrix 14/14, typecheck/build pass. Real concurrency, admin receiving and ten-case acceptance remain pending.
