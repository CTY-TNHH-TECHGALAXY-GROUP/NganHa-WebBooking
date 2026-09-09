# Final plan: 3 agents, website transaction and customer acceptance

Date: 2026-09-09. Status: implementation and local verification complete; live apply and acceptance pending.

## 1. Authorized direction and scope

This plan supersedes the no-writer restriction and the operations-admin changes in earlier plans. The user has selected a website-side transaction after reviewing the parent/child receiving risk.

- Website validates the request, allocates a number, and commits Bookings plus all BookingItems in one transaction.
- Keep the separate operations application unchanged, including its dispatch RPCs, notifications, status transitions and internal orders.
- Do not ALTER existing business tables, columns, indexes, constraints, triggers, RLS, publication or enums. Do not migrate or rewrite existing rows.
- Counter remains a separate allocator. Add a new server-only website writer function in a separate SQL file; never append the writer to the counter-only SQL.
- Do not deploy historical create_booking_atomic or old writer migrations.
- Preserve DB prices, customer linkage, idLegacy convention, payload semantics and existing customer-resolution behavior. No mass updates or test edits to the real catalog/customer master.
- The transaction prevents a successful parent INSERT from becoming visible before its children commit. Real admin display and mail delivery still require integration acceptance.

## 2. Contract shared by all agents

| Field/behavior | Required contract |
| --- | --- |
| Booking ID and billCode | WB-DDMMYYYY-NNN; allow suffixes above 999 |
| Counter date | Appointment date in Asia/Ho_Chi_Minh |
| Booking source | WEB_BOOKING |
| Initial booking/item status | NEW / WAITING, set by writer, not caller-controlled |
| Customer | Preserve resolved customerId and contact fields; never force NULL |
| Request key | Existing idLegacy = idemp:<key>; existing uniqueness is authoritative |
| Services | Existing serviceId, quantity, unit-price semantics, options and private-room addon rows |
| Amount | Server canonical VND pricing; validate row quantities and total consistency |
| Defaults | Preserve existing database defaults, especially accessToken |
| Existing orders | Replay reads only; never reset status, source, customer, notes or dispatch fields |
| Time | Verify actual timestamp-without-timezone storage against admin rendering before finalizing conversion |

Evidence: external admin audit of main at c8eeaf87 reports namespace compatibility and parent-only Realtime receiving. It is static source evidence, not proof of deployed revision or runtime success. Historical WB rows with STANDARD_WALK_IN may be confirmed web orders; verify this interpretation against canary behavior.

## 3. Freeze the function interface first

Agents 1 and 2 review and freeze this proposed interface in plans/handoffs/ATOMIC_WEBSITE_CONTRACT.md before implementation. Agent 3 can prepare tests in parallel.

Proposed function: public.webbooking_commit_booking(p_booking JSONB, p_items JSONB) RETURNS JSONB.

- Input is assembled by the backend from the existing buildBookingPayload/buildBookingItems helpers, after canonical validation. It is never forwarded directly from the browser.
- Writer explicitly maps allowed columns. No arbitrary JSON-to-row insertion, dynamic SQL, caller-selected status/source, or dispatch field assignment.
- Writer requires one parent and a nonempty bounded items array, all linked to that parent, valid service references and quantities, and consistent canonical amounts/options.
- Return a documented result containing bookingId, billCode and replay indicator. Do not expose accessToken or unrelated customer data. API loads the committed snapshot for its established response.
- Stable failures: validation/catalog conflict, same-key different-intent conflict, identifier collision, temporary database failure. Freeze SQLSTATE/message to HTTP mapping; do not classify every 23505 as the same conflict.
- Do not invent a fingerprint column. Compare normalized persisted parent/item intent for replay, excluding generated IDs/timestamps and mutable operations fields. Preserve quantity, addons and option distinctions; document behavior for legacy rows that cannot be compared reliably.
- Complete matching replay returns the existing order even after operations changes its status/source. Incomplete legacy orders return an explicit unresolved result without automatic repair/deletion.

## 4. Agent 1: SQL transaction and security

Ownership: new supabase/GO_LIVE_WEBSITE_ATOMIC_WRITER_READY_TO_PASTE.sql; new writer preflight/postflight verification SQL; contract document jointly reviewed before freeze. Do not edit API or admin source.

Tasks:

1. Read existing counter SQL, current payload helpers, live metadata supplied by the user, and admin audit. Inspect defaults and triggers; reject assumptions based only on generated types.
2. Create only the new function and its scoped privilege statements. Counter SQL retains its existing narrow purpose. Ensure any new function signature/overload is covered by verification.
3. Use SECURITY DEFINER only with a fixed safe search_path and explicit schema qualification. REVOKE EXECUTE from PUBLIC, anon and authenticated, grant only service_role. Test effective permissions, not just GRANT text.
4. Validate allowlisted fields. Enforce NEW/WAITING and WEB_BOOKING for new orders. Reject malformed/empty/mismatched items, invalid quantities and inconsistent totals. Coordinate catalog checks with Agent 2 so a stale/tampered payload cannot bypass server pricing; cover the read-to-commit window without changing prices or service records.
5. Serialize same-request writes using a transaction-scoped mechanism keyed by the existing idLegacy. Recheck after locking. Existing unique constraints remain the final guard. Different keys must not share an unnecessary global lock.
6. Insert parent and all items in the same function call. Any child failure must raise and roll back the entire call; never swallow the error and return success. Do not insert/update Customers inside this writer.
7. Preserve parent/item field mapping and defaults. No updates to existing bookings, no dispatch calls and no compensating DELETE path.
8. Supply read-only preflight/postflight for signature, owner/search_path, ACLs, referenced columns, schema snapshot and writer body scope. Do not call writer/allocator as a health check.

Acceptance: disposable PostgreSQL executes the SQL; item failure leaves zero newly committed parent/items; permissions deny browser roles; same-key requests converge; schema and fixture catalog unchanged. Report inability to test as BLOCKED.

Deliverable: plans/handoffs/FINAL_ATOMIC_AGENT_1.md with exact SQL paths, contract version, runtime evidence and remaining risks. No live SQL application in this agent task.

## 5. Agent 2: Website API and checkout integration

Ownership: src/app/api/bookings/route.ts; narrowly required booking helpers and submit UI. Read README.md, DEVELOPMENT_NOTES.md and local framework docs first. Do not edit Agent 1 SQL or Agent 3 tests.

Tasks:

1. Preserve current request validation, signed quote, server catalog pricing, customer lookup/linkage, locale/options and date rules. Last accepted appointment time is 22:30 when otherwise valid.
2. Replace the two direct booking/items inserts with the frozen writer RPC. Preserve allocator-only number generation. Never fall back to separate inserts when the writer is unavailable.
3. Keep established customer resolution outside writer scope. Document possible customer-only side effects on failed booking; do not claim rollback covers customer resolution or counter allocation.
4. Preserve fast replay before catalog/time checks for completed requests. Same-key different-intent returns 409. Replay does not consume a new number where it can be resolved before allocation.
5. Number conflict can allocate/retry with a bound; idLegacy conflict must reconcile the existing request. Unknown unique errors fail explicitly.
6. On RPC timeout, reconcile by idLegacy and full intended items before deciding the outcome. Do not delete a parent after an ambiguous commit or issue a fresh request key automatically.
7. Remove obsolete compensating parent deletion for the replaced write path. A committed transaction is the success boundary; email runs afterward.
8. Preserve response contract. Checkout retains request key/cart on retryable errors, prevents double-click duplication, and distinguishes booking success from email pending.
9. Send real booking confirmation after new successful commit; a replay must not resend automatically. Mail failure must not turn a committed order into a failed booking.
10. Verify bookingDate storage and admin/email appointment display end-to-end. Do not silently carry forward a UTC conversion bug into the new writer.

Deliverable: plans/handoffs/FINAL_ATOMIC_AGENT_2.md with changed files, request/error mappings, before/after payload equivalence, limitations and build/typecheck results.

## 6. Agent 3: Independent testing and acceptance

Ownership: new scripts/test-atomic-website-*.mjs and plans/atomic-customer-flow-20260909/; update existing test files only after implementation contract is frozen. Do not modify API or SQL to make tests pass.

Prepare fixtures and assertions immediately. Execute DB tests on disposable PostgreSQL and API tests against the actual new route with controlled dependencies. Never inject faults or load-test shared production.

| Test | Required result |
| --- | --- |
| Parent insert valid, second item invalid | Entire transaction rolls back; no parent or child remains |
| Delay child insert inside transaction | Separate connection cannot observe the new parent before commit |
| 20 parallel same-key submissions | Exactly one booking and intended item set; retries return same ID |
| Same key, changed service/quantity/options/customer | Conflict, no mutation |
| 50 distinct submissions | Unique numbers, full items and correct fixture totals |
| Response lost after commit | Retry recovers committed booking without duplicate/delete |
| Replay after operations status change | Original booking returned; operations fields preserved |
| Legacy incomplete order | Explicit unresolved result; no silent success or cleanup |
| Counter existing IDs, suffix above 999, VN midnight | Correct unique code and appointment date |
| PUBLIC/anon/authenticated call writer/allocator | Permission denied; service_role succeeds with valid data |
| Price/status/source tamper; inactive catalog; expired quote | Rejected or server-fixed per frozen contract; no unauthorized rows |
| Invalid phone/email/options/quantity/past date/22:31 | Reject before creation; valid 22:30 accepted |
| SMTP failure | Booking committed, honest email status, no duplicate retry |
| Schema/catalog before and after | Existing definitions and fixture prices unchanged |

Record runtime failures as FAIL/BLOCKED. Static regex tests, HTTP availability and mock SMTP are insufficient for database/admin/inbox acceptance.

### Ten real browser cases

Email: nghik22@gmail.com. Vietnam phone: +84 389898593. Terms consent already approved for QA. Label QA and coordinate a valid appointment with operations. No payment or automatic cancellation/deletion. Use supported live catalog choices; document replacements when a listed choice is unavailable.

| Case | Locale / viewport | Service-selection interaction |
| --- | --- | --- |
| CF01 canary | EN / desktop | One standard service, quantity 1 |
| CF02 | VI / mobile 390 | Body service and supported duration |
| CF03 | Japanese / desktop | Increase same selection to quantity 2 |
| CF04 | Korean / tablet 768 | Same service with two different supported options/durations |
| CF05 | Chinese / mobile | Eligible service plus private-room addon |
| CF06 | VI / desktop | Foot service with strength/focus/avoid preferences |
| CF07 | EN / mobile | Ear service; edit options before submit |
| CF08 | Japanese / tablet | Barber plus foot; remove then re-add selection |
| CF09 | Korean / desktop | Premium choice with allowed therapist preference |
| CF10 | Chinese / desktop | Multiple selections and double-click/retry same request |

For every case: actually choose services in browser, inspect quote, fill contact/date/time, accept QA terms, submit, capture ID, verify complete DB items, admin display without manual corrective intervention, and real confirmation inbox. Compare quantity/options/total/customer linkage/time across all surfaces. Use actual supported locale routes and preserve DB prices and currency rules.

CF01 must pass admin receiving plus inbox before CF02-CF10. Provider acceptance is not inbox delivery. If mailbox/admin cannot be observed, obtain operator evidence and mark pending until received. Do not replace confirmation emails with a QA report email.

Deliverable: plans/atomic-customer-flow-20260909/REPORT.md and sanitized per-case evidence; include build/DB environment, expected/actual, IDs, admin/inbox evidence and issue owner. No secrets or unrelated customer records.

## 7. Parallel execution and gates

1. Freeze interface and error mapping. Agent 1 prepares SQL, Agent 2 integrates with mocks, Agent 3 builds fixtures concurrently in separate owned files.
2. Integrator reviews combined diff and payload mapping; Agent 3 runs actual isolated SQL/route tests. Fix failures within each owner's files. No live migration before runtime/security checks pass.
3. Refresh live read-only preflight, confirm the active admin revision/contract, and review exact SQL artifacts. Authorized operator applies counter SQL if absent, then the separate writer SQL. Read-only postflight verifies both functions and effective permissions.
4. Start the reviewed local website build against the explicitly agreed DB. Local code can write a shared DB; record this accurately. Run canary, then remaining nine cases.
5. GO requires zero unresolved P0/P1, isolated runtime checks passed, ten complete browser/admin/inbox cases, unchanged business schema/prices, and reviewable deployment revisions. Missing evidence is BLOCKED.
6. Prepare scoped commit/deployment on vercel branch, preserving unrelated work. Publishing remains an operator deployment step. Run controlled production smoke on the released build.

## 8. Rollback and boundaries

Counter numbers may have gaps; never reset them. Transaction failures must not leave new booking/items, but pre-transaction customer resolution may have side effects and must be reported honestly.

If the new writer is unavailable, return a retryable unavailable result; do not restore the known parent/child race through fallback inserts. Roll back to a verified compatible release or temporarily stop new submissions. Preserve existing orders and operations state. Do not drop functions or delete QA bookings as an automatic rollback action.

Implementation and local verification are complete on the current working tree: route contract tests pass, TypeScript/build pass, and the disposable PostgreSQL transaction suite passes 16/16. Live read-only preflight, authorized SQL application, production smoke, and ten-case customer-flow acceptance remain before GO.
