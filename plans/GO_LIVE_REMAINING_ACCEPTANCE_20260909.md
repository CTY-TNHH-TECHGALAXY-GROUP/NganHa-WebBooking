# Remaining go-live plan after 3-agent implementation

Date: 2026-09-09
Status: implementation and initial local tests completed; final review and live acceptance pending.

This is the active remaining-work handoff. Do not repeat completed implementation or use older plans that require operations-admin edits.

## Final contract

The website writer creates a new web booking with:

- `id` and `billCode`: `WB-DDMMYYYY-NNN`.
- `source`: `WEB_BOOKING`.
- `Bookings.status`: `NEW`.
- `BookingItems.status`: `WAITING`.
- `customerId`: preserved when resolved.
- `idLegacy`: existing `idemp:<request-key>` convention.
- `price` and `totalAmount`: server/database catalog values.
- `bookingDate`: appointment wall time in `Asia/Ho_Chi_Minh`.

The operations admin project remains unchanged. Its existing confirmation, dispatch, status transition and internal booking flows remain the owner of those operations.

`webbooking_allocate_booking_number` uses only the new `WebbookingBookingDailyCounters` table for numbering. `webbooking_commit_booking` writes the existing `Bookings` and `BookingItems` rows in one transaction. Neither function adds columns or changes existing schema.

Do not run historical atomic migrations or `webbooking_submit_booking`.

## Completed locally

- Agent 1 created the website writer SQL and read-only preflight/postflight.
- Agent 2 integrated the website route with the writer RPC and removed the separate parent/items write fallback.
- Agent 3 created the isolated/mock tests, browser manifest and acceptance report template.
- Disposable PostgreSQL runtime suite: `16/16` pass.
- Actual route mock: `13/13` pass.
- Terra API matrix: `14/14` pass.
- TypeScript and production build: pass.
- No production SQL, booking, customer, catalog or admin data was changed.

These results prove the local contract and fixture behavior. They do not prove the deployed DB, admin revision, Realtime delivery or inbox delivery.

## Remaining execution

### Agent ownership and deliverables

Three agents can prepare in parallel. The integrator owns approvals, combined review and release sequencing. Do not allow concurrent edits to the same file or concurrent QA submissions to the same customer case.

| Owner | Write scope | Required deliverable |
| --- | --- | --- |
| Agent 1: DB contract and SQL | Counter/writer SQL and their verification SQL only | `plans/atomic-customer-flow-20260909/DB_GATE.md`, metadata evidence and exact reviewed SQL hashes |
| Agent 2: website integration | Booking route/helpers/checkout only; no SQL or admin edits | `plans/atomic-customer-flow-20260909/API_GATE.md`, focused fixes and regression evidence |
| Agent 3: independent acceptance | Test scripts and acceptance evidence directory only | `plans/atomic-customer-flow-20260909/REPORT.md`, per-case records and screenshots |

Agent 1 starts by checking actual live metadata against the supplied SQL. Record every required column, type/default, constraint, trigger and effective privilege. Review catalog row locking and replay without current catalog dependence. Preserve the separate counter/writer artifacts. Prepare SQL Editor instructions if direct DB access is unavailable; never treat inaccessible metadata as PASS.

Agent 2 starts by reviewing the RPC adapter and snapshot handling, then fixes any demonstrated gap. Explicitly test NULL/empty/malformed RPC result, `success:false`, legacy `BOOKING_IN_PROGRESS`, timeout after commit, missing committed snapshot, same-key changed intent, partial items, and email failure. A generated booking ID alone is not proof of commit. A writer-reported failure must never produce a success response or confirmation email. Preserve success for a valid complete booking. Compare payload fields with Agent 1's frozen contract.

Agent 3 starts by checking what existing tests actually execute. The standalone JavaScript AtomicStore model is not proof of PostgreSQL behavior. The browser manifest is only a list, not executed E2E. Use `scripts/test-atomic-website-postgres.mjs` for real disposable SQL checks and `scripts/test-go-live-api.mjs` for the actual route with mocked dependencies. Record fixture limitations; PostgreSQL tests do not prove live schema, Supabase Realtime or inbox delivery.

The previously used disposable PostgreSQL was stopped after testing. Its data directory is `/private/tmp/oria-atomic-acceptance.j7X3Tc/data`; runtime binaries were under `/private/tmp/oria-go-live-pg/node_modules/@embedded-postgres/darwin-arm64/native/bin`. Confirm these still exist and the port is free before reuse. The test script targets loopback port 55439 and must never be redirected to production. Ask for tool escalation if the sandbox blocks local shared memory or loopback access; do not misreport that as a missing runtime.

Record the exact commands, exit status, test date and source hash for any newly changed code. Rerun relevant tests after fixes; previous counts apply only to the earlier tested revision. The old counter static suite may assert a direct-insert contract and must be updated to the approved transaction contract rather than reverting the implementation.

### Execution dependencies

1. Agents 1-3 prepare their scoped work concurrently.
2. Integrator reviews DB/API gates and regression evidence. Resolve P0/P1 before any live apply.
3. Agent 1/operator runs live read-only preflight and obtains a reviewed apply artifact. Creating this plan does not itself apply SQL or publish code.
4. Authorized operator applies reviewed SQL; Agent 1 verifies postflight. Agent 2 starts the reviewed website build with the explicitly agreed database.
5. Agent 3 runs CF01 and waits for DB/admin/inbox verification before CF02-CF10.
6. Integrator records GO/NO-GO, prepares a scoped deployment on `vercel`, and verifies production smoke once deployment is authorized.

Step 6 negative/fault checks below belong before controlled live SQL application, despite their placement after the browser-case description.

### Step 1: final source review

1. Review [GO_LIVE_COUNTER_ONLY_READY_TO_PASTE.sql](../supabase/GO_LIVE_COUNTER_ONLY_READY_TO_PASTE.sql) and [GO_LIVE_WEBSITE_ATOMIC_WRITER_READY_TO_PASTE.sql](../supabase/GO_LIVE_WEBSITE_ATOMIC_WRITER_READY_TO_PASTE.sql) as separate files.
2. Confirm the writer allowlist maps only existing columns and does not write Customers, dispatch fields or mutable operations status.
3. Confirm the API calls allocator first, then the atomic writer, with no direct `Bookings`/`BookingItems` fallback and no compensating delete.
4. Confirm email runs only after a successful new transaction; replay does not send a second email.
5. Record the deployed website revision and the operations admin revision used for acceptance.

### Step 2: production read-only preflight

Run these in SQL Editor against the connected production database, one at a time, before any write:

- `supabase/verification/20260909_counter_only_preflight_read_only.sql`
- `supabase/verification/20260909_booking_namespace_read_only.sql`
- `supabase/verification/20260909_website_atomic_writer_preflight_read_only.sql`

Save the result. Stop if any of these is true:

- A required existing column/default/constraint is different from the writer mapping.
- Either writer or allocator already exists with a different signature or owner.
- `Bookings` or `BookingItems` schema, trigger, RLS, publication or index would need alteration.
- Existing namespace data conflicts with `WB-DDMMYYYY-NNN`.
- The active website or admin revision differs from the reviewed contract.

### Step 3: controlled SQL apply and postflight

Only after Step 2 passes:

1. Apply `GO_LIVE_COUNTER_ONLY_READY_TO_PASTE.sql`.
2. Run `20260909_counter_only_postflight_read_only.sql`.
3. Apply `GO_LIVE_WEBSITE_ATOMIC_WRITER_READY_TO_PASTE.sql`.
4. Run `20260909_website_atomic_writer_postflight_read_only.sql`.
5. Expected effective privileges for both functions: `public = false`, `anon = false`, `authenticated = false`, `service_role = true`.
6. Confirm no new `webbooking_submit_booking` or `create_booking_atomic` was created.
7. Save before/after schema metadata. The only new application objects allowed are the counter table and the two website functions.

Do not call the allocator as a health check because every successful call consumes a number.

### Step 4: one canary booking

Entry conditions: DB_GATE and API_GATE pass; exact SQL postflight passes; build/DB target recorded; operations knows the QA appointment; browser and mailbox/admin observation methods are available. Local frontend connected to production is still a real production write.

Use a valid future appointment and the real checkout UI. The first canary must:

1. Select one currently active service and inspect the quote.
2. Use the QA customer email `nghik22@gmail.com` and phone `+84 389898593`.
3. Submit once with Terms consent.
4. Confirm the response contains one `WB-*` ID.
5. Verify one committed parent and all expected child rows in DB.
6. Verify `customerId`, `WEB_BOOKING`, `NEW`, `WAITING`, DB price and appointment time.
7. Verify the unchanged operations admin displays the booking with its complete service list.
8. Verify the real confirmation email arrives in the inbox.

Do not continue if the canary has missing items, wrong status/source, wrong price/time, duplicate booking, admin display error or missing inbox email.

Use a name/note such as `QA CF01 <run-id>` to identify each case. Use only the user's approved contact details. Existing Terms approval applies to QA; no payment is required. Do not change the customer's master data manually as test setup. Normal booking customer resolution can have its existing side effects and is outside the booking/items transaction; capture linkage and report unexpected changes.

Capture initial source/status before any operator action. If operations confirms later, a transition such as NEW to PREPARING or WEB_BOOKING to STANDARD_WALK_IN must be attributed to that action, not reported as an incorrect initial writer value. The agent does not confirm/dispatch/cancel orders unless that action is separately authorized. Observe the admin's ordinary receiving path without corrective manual reload as the primary canary check; if reload is required to see complete services, record a failure.

### Step 5: ten customer-flow cases

Run through the actual browser, not direct API calls. Use only services/options currently available in the catalog.

| Case | Locale / viewport | Interaction |
| --- | --- | --- |
| CF01 | EN / desktop | One standard service, quantity 1; canary |
| CF02 | VI / mobile 390 | One body service and supported duration |
| CF03 | JA / desktop | One service, quantity 2 |
| CF04 | KO / tablet 768 | Same service with supported option/duration changes |
| CF05 | ZH / mobile 390 | Service plus eligible private-room addon |
| CF06 | VI / desktop | Foot service with supported strength/focus/avoid options |
| CF07 | EN / mobile 390 | Ear service; edit options before submit |
| CF08 | JA / tablet 768 | Barber plus foot; remove and re-add one service |
| CF09 | KO / desktop | Premium service with supported therapist preference |
| CF10 | ZH / desktop | Multiple services and same-key double-submit/retry |

For every case record: locale, viewport, selected service IDs, quantity, options, quote, date/time, returned ID, parent row, complete item rows, customer linkage, admin evidence and actual inbox evidence.

### Browser procedure for every case

1. Start with a fresh cart for a new intentional booking; retain the same request key only within that case's retry flow.
2. Navigate from the actual service selector. Select the catalog-backed service and options described in the matrix. Do not seed localStorage or call POST directly in place of UI selection.
3. Check cart count, quantity controls, removal, displayed duration and displayed currency. Match currency values to the existing catalog/conversion rule; do not change DB prices or hardcode expected production totals.
4. Open checkout, choose a valid future date/time, enter approved contact details, review quote and accept Terms.
5. Submit through the UI. Record response status, booking ID and screenshot; do not store credentials, access tokens or unredacted unrelated payloads.
6. Query only that QA booking and its items for verification. Compare all service IDs, per-line quantities/options/addons, total, date/time and customer linkage. A nonempty item array alone is insufficient.
7. Observe the separate admin receiving the same order and complete services. Record screenshot/operator confirmation and time without editing internal orders.
8. Verify the confirmation email in `nghik22@gmail.com`: booking ID, services, quantities, date/time and total. Provider acceptance alone remains pending. Use a 5-minute observation window; delayed delivery is pending until observed, and a later arrival must update the record.
9. Capture console/runtime errors, layout overflow and missing translations encountered on that flow. Classify blocking checkout errors separately from cosmetic issues.
10. For CF10 retry the same submission; verify exactly one QA parent/item set and no duplicate confirmation caused by replay. Do not generate a new key to simulate retry.

Use the locale route identifiers actually supported by the app. Labels JA/KO/ZH in the table describe languages, not guaranteed URL segments. Where the catalog lacks an option, record a supported replacement with its actual ID; do not quietly mark the unexecuted case PASS.

### Required per-case evidence

Store `CF01.md` through `CF10.md` and sanitized screenshots under `plans/atomic-customer-flow-20260909/`. Each record must include:

- Run ID, timestamp, website revision/dirty-diff hash, admin revision if available, URL, DB environment and viewport.
- Exact UI actions and selected services/options, expected result, actual result, HTTP outcome and booking ID.
- DB parent/items comparison, admin receiving evidence, inbox evidence and delivery timing.
- Separate UI/DB/admin/email statuses and overall PASS/FAIL/BLOCKED; overall PASS requires all four.
- Any issue with severity, reproduction, responsible owner and retest result. Mask personal information in shared reports; never include service-role keys or accessToken.

If admin or mailbox access is missing, finish independent checks and request operator evidence for the exact booking ID. Do not claim full acceptance while awaiting it. Stop at a failed canary rather than creating nine more unverified orders.

### Step 6: negative and resilience checks

Run destructive/fault tests only on disposable DB or controlled mocks:

- Invalid service, inactive service, invalid quantity, changed price and expired quote.
- `22:30` accepted when valid; `22:31` rejected before any write.
- Same key with same intent returns the original booking.
- Same key with changed service, quantity, option or customer returns conflict.
- Child failure rolls back the parent and all items.
- Lost response reconciles the committed booking without creating a second one.
- 20 same-key requests converge to one booking.
- 50 distinct allocations produce unique numbers.
- `anon` and `authenticated` cannot call either function.
- SMTP failure leaves the committed booking valid and does not create a duplicate on retry.

Never run these load/fault cases against shared production data.

## GO/NO-GO

Final report must distinguish: local regression, disposable SQL runtime, shared-DB preflight/postflight, browser execution, admin receiving and real email delivery. Include the exact tested SQL/source hashes and the list of QA IDs for operations to handle normally. Report unrelated worktree issues separately and preserve other agents' edits.

GO requires all ten browser cases to have complete DB rows, correct unchanged admin display and real inbox evidence, with no unresolved P0/P1 and no business schema/catalog price change.

BLOCKED if live preflight/postflight, deployed revision, admin display or inbox evidence is unavailable. Static tests and provider acceptance do not count as customer-flow acceptance.

On failure, stop new QA submissions, keep existing bookings and counter gaps, and roll back to a verified compatible website build. Do not drop functions, reset counters, delete orders or alter the operations admin flow.
