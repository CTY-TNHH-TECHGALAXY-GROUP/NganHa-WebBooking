# Go-Live Recheck - 2026-09-08

## Conclusion

Do not approve booking go-live yet. The inspected public pages generally render,
but checkout has a reproduced timezone/hydration defect and the configured
Supabase project is missing the atomic booking schema. Currency, translations,
mobile navigation and deployment cleanup also need follow-up.

This is a review, not a deployment or a migration. No real booking was submitted,
no email sent, no customer data read, and no production content changed.

## Scope And Evidence

- Live target: https://oria-spa.vercel.app
- Browser: Chromium, desktop 1440x900 and mobile 390x844.
- Initial route checks: homepage, blogs, history, Design Your Journey,
  Pure Relaxation, EN standard checkout, Lost & Found, admin login, demo-3d,
  history-demo.html.
- Additional route checks: space, booking, therapy, local-tour, privileges,
  unauthenticated admin/system-settings.
- Checkout timezone checks: UTC, Asia/Ho_Chi_Minh, America/Los_Angeles.
- Pure Relaxation language checks: CN, JP, KR, plus initial VI render.
- Public catalog: 80 services returned by /api/services.
- Supabase: read-only metadata checks using the local environment configuration.
  This does not independently verify Vercel's environment variables.
- Local TypeScript check: `npx tsc --noEmit --incremental false` passed.
- Existing static booking control-flow test passed. This is not an integration test.
- Additional API tests used mocked Supabase and mailer, with no network writes.
- Live and working tree differ. Several earlier fixes remain uncommitted locally.

## P0 - Booking Release Gate

### 1. Atomic Booking Schema Is Not Ready

Confirmed against the configured Supabase REST metadata:

- Selecting `Bookings.idempotency_key,idempotency_fingerprint` with `limit=0`
  returned 42703: `Bookings.idempotency_key` does not exist. This failed query
  does not establish whether the second column exists independently.
- The daily counter table was not found in PostgREST's schema cache (PGRST205).
- The service-role OpenAPI schema did not expose `/rpc/create_booking_atomic`.

The local booking route calls that RPC and returns 503 when it is unavailable:
`src/app/api/bookings/route.ts:611` and `:649`.

Impact: deploying the new API against this schema blocks booking creation.
No valid POST was made to live, so this report does not assert the currently
deployed API returned 503. An older live fallback may behave differently.

Required work:

- Review and apply the hardened migration to staging first.
- Apply function creation and permission revocation transactionally; only the
  server service role may execute the privileged function.
- Correct and execute metadata verification. The current verification script
  compares `pg_get_function_identity_arguments` against a types-only string
  despite named parameters. Use a types-only catalog representation, and verify
  parameter names separately.
- Run concurrent distinct-request and identical-key tests on staging.
- Confirm no partial parent/item insert and no duplicate email on replay.
- Coordinate DB readiness before deploying the fail-closed API.

## P1 - Correctness And Data Protection

### 2. Checkout Uses The Visitor's Clock For The Spa Schedule

Live reproduction at the same real time:

- UTC: Sep 7, initial slot 19:00.
- Asia/Ho_Chi_Minh: Sep 8, initial slot 09:00.
- America/Los_Angeles: Sep 7, initial slot 12:00.

The VN and Los Angeles browser contexts reported React error #418. UTC did not.
The page recovered and rendered; this was not a persistent full-page crash.

Relevant source:

- `src/app/[lang]/new-user/[menuType]/checkout/page.tsx:699`: initial date.
- Same file `:741` and `:769`: date strip and time slots use local device time.
- `src/app/api/bookings/route.ts:196`: API interprets appointments as UTC+07.

Fix: use Asia/Ho_Chi_Minh consistently for appointment dates and slot filtering,
and make server/client initial rendering deterministic. Recalculate expired
slots while checkout remains open. Test near midnight in all three timezones.

### 3. Private-Room USD Pricing Is Inconsistent

Live catalog `NHS0900`: 105,000 VND and 4 USD.

Cart code adds 105,000 VND and **5 USD**:

- `src/lib/bookingCartStorage.ts:155` and `:258`.
- `src/components/Menu/MenuContext.tsx:123` and `:146`.

Reprice reads the catalog's USD value instead:
`src/app/api/bookings/reprice/route.ts:89`.

Impact: each private-room unit can differ by 1 USD between cart construction and
canonical repricing. VND matches today's catalog, but remains hardcoded too.

Separately, `src/lib/paymentConstants.ts:36` hardcodes 24,000 VND/USD. Catalog
USD amounts do not consistently equal conversion at that rate (for example,
720,000 VND is listed as 29 USD, not 30 USD). This needs an explicit decision:
independently authored USD prices versus a single conversion policy.

Fix: one canonical addon price source for all cart operations; define currency
rounding and exchange-rate policy. Test add/edit/quantity/reprice consistency.
This is pricing consistency work, not a request to enable advance payment.

### 4. Nested Booking Options Are Not Fully Validated

Mocked execution of the current local POST route:

- Valid control reached RPC once, then returned the mock schema-unavailable 503.
- `options.bodyParts.focus = "NECK"` returned 500 before any RPC call.
- `quantity = true` passed quantity validation and reached the RPC.

Source: `src/app/api/bookings/route.ts:155`, `:430`, `:476`.

Fix: validate types and limits for nested options before transforming them.
Focus/avoid must be arrays of allowed strings; quantity must not accept booleans.
Validate addon flags and permitted options against service configuration. Return
structured 400 errors for malformed input, not an unexpected 500.

### 5. Unverified Booking Input Can Rename An Existing Customer

Code inspection: `src/app/api/bookings/route.ts:713` searches `Customers` by
submitted phone; `:727` and `:733` overwrite the existing `fullName` with the
submitted booking name. No ownership verification appears in this path.

Impact: someone booking with another person's phone can change that profile.
Not exercised against real customer data.

Fix: preserve the existing customer profile. Store submitted guest details on the
booking; profile changes need a verified user or authorized staff operation.

## P2 - Incomplete Content And UI Work

### 6. Pure Relaxation Is Not Fully Translated On Live

In CN, JP and KR, service names and controls translate, but the Body Massage
editorial remains English, including the full paragraphs beginning
`The Art of Manual Therapy at Oria Spa`.

Live catalog coverage:

| Field | VI | EN | CN | JP | KR |
| --- | --- | --- | --- | --- | --- |
| Missing names | 0 | 0 | 0 | 0 | 0 |
| Missing descriptions | 0 | 0 | 14 | 14 | 14 |

This is not evidence that all services ignore the database. The catalog is
connected and names are populated. Editorial and missing description coverage
are separate problems.

Source: `src/components/PureRelaxation/PureRelaxationPage.tsx:219` and
`pureRelaxationResolvers.ts:14`. Local locale defaults alone do not prove the
entire page is translated, particularly media tags and grouped service headings.

Fix: audit every visible field by locale, preserve stable CMS keys, complete
missing catalog descriptions and editorial translations, then test CMS changes
round-trip on staging in all five languages.

### 7. History Requests An Unavailable Image

On live `/history`, the browser requested this URL and received 404:
`/images/history/2020-ngan-ha-team-ao-dai.jpg`.

Current source defaults use `.png` at `src/components/History/History.tsx:131`.
Verify the effective CMS value and deployed assets; changing the default alone
may not repair an existing CMS override. No CMS update was made in this review.

### 8. Mobile Logo Overlaps BOOK

Screenshot at 390x844 confirms the centered logo overlaps the BOOK control.
Document width still equals viewport width, so an overflow-only test misses it.

Inspect `src/components/Header/Header.tsx:400` and the mobile layout rules.
Reserve non-overlapping tracks for logo and actions; test 320/360/390/430 widths.
Keep the Google badge as requested.

### 9. Demo Removal Has Not Reached Live

- `/history-demo.html`: HTTP 200; four story assets return 404.
- `/demo-3d`: HTTP 200 and displays `Cinematic 3D Demo`.

The working tree deletes `public/history-demo.html` and blocks its URL, but that
change is not reflected on live. `src/app/demo-3d/page.tsx` still exists locally.

Fix: remove obsolete routes/assets after checking references, and deploy through
the intended `vercel` branch. A production component with "Demo" in its filename
is not automatically removable: Design Your Journey currently imports one.

### 10. Tablet Continue Admin Setting Is Not Wired To The Consumer

`tabletContinue` exists in `src/lib/config/urlSettings.ts` and the admin form.
No consumer of this key was found outside configuration/admin code.

`src/components/Checkout/OrderConfirmModal.tsx:543` still navigates to `/`;
its tablet QR at `:1101` constructs the locale URL directly.

Fix: resolve the saved setting at the actual action/QR consumers, validate it,
and test a configured destination plus empty/invalid fallbacks. This is a local
source finding; the protected admin save flow was not exercised.

## Checks That Passed And Remaining Limits

- Inspected main routes rendered without a persistent fatal page crash.
- The checkout duration drawer opened without reproducing the old hook-order error.
- No document-level horizontal overflow in the three inspected mobile routes.
- Admin login had no sidebar. Unauthenticated system settings redirected to login.
- Design Your Journey showed a hotline contact matching the visible number.
- Public catalog had no missing names or zero VND/USD prices among 80 entries.

Not verified: authenticated admin CRUD, SMTP delivery, actual booking commit,
concurrent SQL behavior, database ACL execution tests, every media frame, every
CTA, tablet layouts, Safari/iOS, and production environment parity. Do not treat
HTTP 200 or TypeScript passing as proof these workflows are complete.
