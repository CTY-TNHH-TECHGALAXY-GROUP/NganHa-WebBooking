# Custom For You: approved DB rules and urgent repair plan

## Goal and scope

Resolve NHS1000 reprice UNSUPPORTED_OPTION, remove invented treatment preferences from private room, and preserve quantity booking. This is an implementation handoff; no application code or database is changed by this plan.
Read AGENTS.md, README.md, DEVELOPMENT_NOTES.md and current worktree before editing. Preserve concurrent changes. No admin dispatch, booking ID/status, SMTP or catalog price redesign.
Incident production domain is oria-spa.vercel.app, branch master. Verify current deployment SHA/repository before release; do not assume the usual vercel branch serves this domain.

## 1. Approved rules: one shared capability contract

Map DB camelCase to UI uppercase exactly once. Preserve explicit false. For strength, the user requires explicit true; do not convert null/missing strength to true as /api/services currently does. Parse focusConfig using structured data: object accepted, valid JSON object string normalized for legacy compatibility; malformed/null/array is no allowed area. Accept only known body-region keys with boolean true, never truthy strings.

Use equivalent policy on server and client:

```ts
custom = SHOW_CUSTOM_FOR_YOU !== false;
strength = custom && SHOW_PREFERENCES !== false && SHOW_STRENGTH === true;
gender = custom && SHOW_PREFERENCES !== false && SHOW_GENDER !== false;
preferences = strength || gender;
focus = custom && SHOW_FOCUS !== false && allowedBodyAreas.length > 0;
notes = custom && SHOW_NOTES !== false;
privateRoom = notes && activeRoomAddonAvailable && eligibleParent && !isRoomService;
```

The room toggle belongs under the notes block as requested. Availability must come from the catalog; do not invent a per-service eligibility DB field. Preserve existing eligibility rules where present and document the fallback when no per-service rule exists. A missing/inactive addon must hide/disable the toggle and remain rejected by server validation if forged.
When custom=false, bypass the modal and do not construct hidden treatment defaults. Preserve the add-to-cart/book action; closing the sheet must not drop the chosen service or quantity.

Expected NHS1000: custom=true; preferences=true; strength=true; gender=false; focus=false; notes=true. Medium and real notes are valid. Therapist must be absent. Nonempty focus/avoid requires repair/review.
Private-room NHS0900: no strength/therapist/body preferences/treatment notes. Preserve identification, quantity, price and child-link metadata. An attached room does not remove the parent treatment's strength or notes.

## 2. Agent/API owner: catalog and canonical options

Inspect src/app/api/services/route.ts, src/lib/booking/contract.ts, src/app/api/bookings/reprice/route.ts and src/app/api/bookings/route.ts.

1. Add a pure capability resolver shared by UI adapters and server catalog handling. Reprice and submit catalog SELECTs must include showCustomForYou as well as current capability fields. Add the corresponding typed field; avoid duplicated unrelated sanitizers.
2. Normalize empty options and casing using the existing contract. Derive allowed fields from DB, not client-provided flags. Validate the same canonical options in both routes.
3. Return all bounded field errors for each invalid cart line: service ID, cartId, field path and code. Do not return customer note values or raw signed quote in diagnostics.
4. Unsupported generated neutral defaults such as therapist=random when gender=false may be proposed for removal. Existing meaningful selections (male/female, actual strength choice, notes/tags, focus/avoid) require visible review before removal. Legacy data cannot reliably distinguish all defaults from intentional choices; do not assume it can.
5. Keep invalid structure, unknown option keys, inactive services and tampered addon invalid. Do not accept every option to remove the 409.
6. Make optionsChanged distinct from hasPriceChanged. Unsupported options must not be presented as a catalog-price change. Define the repair response with proposed canonical options and adjustments but no accepted quote until required changes are reviewed.
7. Keep authoritative server unit prices and quantity multiplication. No migration is expected; verify actual room catalog config read-only before deciding if a catalog correction is separately needed.

## 3. Agent/UI owner: every creation and edit entry point

Primary files: src/components/Menu/Standard/index.tsx; src/components/CustomForYou/index.tsx and types; src/app/[lang]/new-user/[menuType]/checkout/page.tsx; Menu/Standard/Sheets/CartDrawer.tsx; alternative book-now and customization flows.

1. Standard menu already has a custom=false gate. Verify it preserves service addition and quantity, and apply equivalent policy to checkout add/edit, service replacement and other modal entry points.
2. Build initial/reset state from capabilities. Disabled gender yields no therapist, never random. Disabled strength yields no strength, never medium. Supported strength can initialize medium. Supported gender can initialize random.
3. InitialData must not restore disabled options. Retain unsupported customer values in a separate pending-review model rather than silently forgetting them.
4. Preferences render exactly by effective strength/gender rules. BodyMap renders only with at least one enabled region. Current code treats missing FOCUS_POSITION as visible; remove that behavior under the approved rule.
5. Notes render only when enabled. Place/guard the room toggle inside that condition and require addon availability; current toggle is unconditional outside NoteSection.
6. Before onSave, output canonical supported options. Hiding a control alone is insufficient. Changing only quantity must not regenerate preferences or introduce defaults.
7. Remove checkout/invoice fallbacks that display Medium/Random for absent fields. Show only supported present values. Apply all messages/review controls in vi/en/cn/jp/kr.

## 4. Cart repair and quote owner: prevent repeated 409

Files: src/lib/bookingCartStorage.ts, src/components/Menu/MenuContext.tsx, checkout confirmation handlers.

1. Preserve original cart and customer fields when validation fails. Surface affected line and proposed changes; offer Edit or accept reviewed adjustments.
2. Persist accepted normalized options, not just refreshed price/duration. Reprice currently copies only pricing fields; without this change old invalid options keep returning.
3. Use one cart snapshot/revision for reprice and final confirmation. Do not read localStorage independently when React holds newer changes. Ignore asynchronous responses from older revisions.
4. Invalidate quote on quantity/options/add/remove; final submit uses the reviewed snapshot. Persist accepted canonical options before reissuing its quote.
5. No quote on a repair requiring review. After customer acceptance, run reprice again. An unchanged second reprice must succeed without repeating the warning.
6. Never auto-delete a service for unsupported preferences. Never silently discard allergy, pregnancy, free-text notes or avoidance preferences. Do not alter already-saved bookings as part of legacy-cart repair.

## 5. Booking rows and email owner

Inspect buildNotes, buildBookingItems, committed snapshots and email preference formatting.
- NHS1000 parent: strength allowed, notes allowed, no therapist preference or focus/avoid.
- Generated room child currently contains displayName/parentServiceId/isAddon only: preserve this; no pressure defaults added downstream.
- Standalone room: do not take a generic treatment-row default path that adds random therapist or medium strength. Respect any required internal metadata without presenting it as a customer preference.
- Attached room is a priced addon; parent pressure stays associated with parent. Do not suppress all preferences simply because addons.privateRoom=true.
- Render from canonical supported options, preserve existing translations, and test room-specific absence across all five languages.
- Do not change NEW/WAITING, identity format, atomic writer or SMTP timing.

## 6. Test matrix and evidence

API tests use actual handlers with isolated catalog/writer/SMTP boundaries; retain the failing fixture before fixing. Add browser tests for creation/edit/reload and delayed responses.

| Case | Expected |
| --- | --- |
| NHS1000 medium + note, quantity 1/2/3 | Valid; no therapist/focus in accepted payload |
| NHS1000 legacy therapist=random | Identified and repaired; no retry loop |
| NHS1000 legacy focus/avoid or male/female | Review shown before removal |
| Custom disabled room/utility | No modal; selected service still added, no treatment options |
| Preferences disabled, child flags true | No strength/gender generation or display |
| Strength false/null/missing | No medium default under explicit-true rule |
| Gender false | No random default across all entry points |
| Focus false, empty/missing/all-false config | No map or generated body choices |
| Focus true with allowed regions | Only allowed keys accepted |
| Notes false | No tags/text/room toggle; legacy choices reviewed |
| Room inactive/missing | Cannot select or forge room addon |
| Parent with room | Parent valid notes retained; room child has no treatment notes |
| Same service on different lines | Quantity/options stay isolated by cartId |
| Delayed reprice after quantity edit | Old response cannot overwrite new cart |
| Accepted repair then reload/retry | Canonical options persist and reprice succeeds |
| Catalog price changes or quote expires | Customer review retained; no bypass |
| Invalid quantity and duplicate submit | Existing rejection/idempotency preserved |
| Five-language receipt/invoice | No invented room strength; correct parent translation |

Use the screenshot fixture: NHS1000 790,000 + room 105,000 = 895,000 per unit; quantity 2 = 1,790,000 if catalog prices remain those supplied. Separate Combo King example stays 3,360,000 for quantity 2 with room. Do not confuse the two service fixtures.

## 7. Recommended sequencing and ownership

1. API owner defines and tests capability + repair DTO first; shares exported contract.
2. UI owner implements entry points and state under that contract.
3. Integrator wires cart/reprice/submit and notes, with sole ownership of shared checkout edits while integrating.
4. Verification owner executes tests against combined changes and reviews actual network payloads. Existing mock passes are not sufficient.
5. Build and TypeScript run sequentially to avoid generated .next types races; run scoped lint and booking regression tests. Save evidence without customer data.
6. Confirm production branch/SHA, deploy exact tested revision, verify Vercel Ready. One controlled TEST booking with NHS1000 quantity 2 + room must reach dispatch with correct quantities/prices and receipt preferences. A second targeted scenario checks room standalone if supported by product.

## Acceptance and handoff

Close only when original NHS1000 unsupported-option case, old-cart repair, quantity 2, and room-note absence all pass. Report files changed, tests executed, API evidence, deployment SHA, outstanding checks and any proposed DB changes. Do not claim live success from a local test or git push alone.

No generic quantity restriction, no disabling quote validation, and no changing DB flags just to accommodate frontend-generated defaults.
