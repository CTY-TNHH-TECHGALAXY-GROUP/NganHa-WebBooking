# Codex Cross-Review — Antigravity Content Builder UI

## Verdict

ACCEPTED

No unresolved BLOCKER or MAJOR finding remains. Phase 2 was not started.

## Worktree

`/Users/charlotte/Desktop/NGÂN HÀ/CTY TechGalaxy Group/NganHa-WebBooking-codex`

## Branch

`review/antigravity-media-ui`

## Baseline Commit

`98f609d` — `merge(content): integrate Antigravity content media UI`

## Git State

The review began clean. The worktree now contains only the uncommitted review
corrections and documentation listed below. No commit, push, or merge was made.

## Frozen Contract Integrity

Contract version `1.0.0` remains `FROZEN`. Antigravity did not change
`CONTENT_CONTRACT_V1.md`, canonical types, core schemas, content utilities,
ContentRenderer, `package.json`, or `package-lock.json`. No shadow content types
or alternate schema were introduced.

The review added one compatible validator refinement: external video URLs must
match their declared YouTube/Vimeo provider. The persisted contract shape is
unchanged.

## Scope Compliance

Antigravity stayed within its assigned Admin UI paths and coordination docs.
There are no database migrations, APIs, backend writes, draft/publish behavior,
new dependencies, or protected booking/business changes in the merge.

## Acceptance Matrix

| Area | Result | Notes |
|---|---|---|
| Admin Shell | PASS | Shared local document state; tabbed through 1024px; three panels at 1280px+. |
| Block Toolbar | PASS | Exactly the eight frozen V1 block types. |
| Block Construction | PASS | All eight real factory defaults pass canonical Zod validation. |
| Block Cards | PASS | Stable block IDs, canonical fallback, reorder/duplicate/delete/visibility actions. |
| Inspectors | PASS | Controlled V1 fields only; structured RichText is protected from flattening. |
| Multilingual Model | PASS | One shared block tree; localized values and visibility only. |
| Media Picker | PASS | Persists `mediaId`; type-safe confirmation; mock/filter-only sources. |
| Image Position Math | PASS | 0..100 clamp, 1..2 zoom at 0.05, safe pointer bounds/cancel, renderer-matching preview. |
| Canonical Schema Compatibility | PASS | Initial, eight inserts, duplicate, and reorder all validate. |
| React Correctness | PASS | Immutable updates; no listener leaks/render loops; stale picker filters corrected. |
| Responsive UX | PASS | No horizontal overflow at 390/768/1440; both modals viewport-safe. |
| Accessibility | FAIL | Modal focus behavior and icon names corrected; some secondary controls remain below 44px (MINOR). |
| Client/Server Boundary | PASS | Admin interactivity remains client-side; route/metadata remain server-compatible; public renderer unchanged. |
| Security | PASS | No raw HTML/JS/CSS injection, unsafe save path, secrets, auth bypass, or backend mutation. |
| Dependency Isolation | PASS | Manifests unchanged; no dnd-kit/editor framework added. |
| Core Isolation | PASS | Antigravity changed no core files; review changed only the confirmed video validator defect and its test. |
| Protected Paths | PASS | No booking/cart/checkout/pricing/payment/auth business path changed. |
| Documentation Accuracy | PASS | Accessibility, RichText, locale, test-command, and review-correction claims aligned to code. |

## BLOCKER Findings

None.

## MAJOR Findings

Issue: Media Picker could confirm a selected asset excluded by `allowedTypes`.

Severity: MAJOR (resolved)

Evidence: `selectedAsset` originally searched the full mock library independently
of `allowedTypes`.

Impact: An image/poster picker could return a video `mediaId`, producing a
schema-valid but non-renderable media reference.

Smallest compatible correction: Apply `allowedTypes` when resolving the
confirmable selected asset and reset stale filters on each open.

Contract change required: NO

Issue: Plain-text RichText editing silently flattened structured AST content.

Severity: MAJOR (resolved)

Evidence: The inspector extracted only paragraph text, then replaced the whole
locale document with unmarked paragraph nodes on the next keystroke.

Impact: Bold, italic, links, lists, hard breaks, and nested nodes could be lost.

Smallest compatible correction: Permit preparation editing only for plain,
unmarked paragraphs and make richer AST documents read-only until the approved
structured editor phase.

Contract change required: NO

Issue: Image-position zoom preview used a different transform origin than the
public renderer.

Severity: MAJOR (resolved)

Evidence: Admin used `transformOrigin: focalPoint`; ContentRenderer uses the
CSS default center transform origin.

Impact: Saved zoom composition could differ from the Admin preview.

Smallest compatible correction: Remove the Admin-only transform origin and use
the same object-position plus centered scale mapping as the renderer.

Contract change required: NO

Issue: External video provider and URL host could disagree.

Severity: MAJOR (resolved)

Evidence: Switching provider preserved the prior URL; the canonical schema
accepted any supported host for either provider, while the renderer parsed the
URL according to the declared provider.

Impact: A YouTube URL declared as Vimeo could render the wrong Vimeo embed ID.

Smallest compatible correction: Refine the existing external-video schema to
require a host matching the provider and add a regression assertion.

Contract change required: NO

Issue: Between-block insertion was hover-only and always inserted a heading.

Severity: MAJOR (resolved)

Evidence: The affordance used `opacity-0 group-hover` and directly called
`onInsertAt(index, 'heading')`.

Impact: Touch users could not reliably insert between blocks, and no user could
choose the required block type at that position.

Smallest compatible correction: Use a native, keyboard/touch-accessible select
containing the existing eight frozen toolbar descriptors.

Contract change required: NO

Issue: The mock save callback accepted invalid ContentDocument state.

Severity: MAJOR (resolved)

Evidence: Free-form CTA/video URL fields updated local state and `onSaveMock`
received the document without canonical validation.

Impact: A caller could receive invalid or unsafe mock data despite the claimed
contract boundary.

Smallest compatible correction: Run the actual canonical Zod schema before the
callback and show an inline error when validation fails.

Contract change required: NO

## MINOR Findings

Issue: Modal focus entered and escaped the underlying editor without containment
or return.

Severity: MINOR (resolved)

Evidence: Dialogs handled Escape but did not move, trap, or restore focus.

Impact: Keyboard users could lose context or tab behind an open modal.

Smallest compatible correction: Follow the repository's existing modal pattern
for focus entry, Tab containment, Escape, cleanup, and trigger focus return.

Contract change required: NO

Issue: The Media Picker forced a fixed side inspector on mobile, and the builder
entered three-panel mode at 1024px despite the fixed Admin sidebar.

Severity: MINOR (resolved)

Evidence: The picker body was always a row with a fixed 18–20rem inspector; the
builder used `lg` for its twelve-column layout.

Impact: Small viewports and 1024px Admin content space were cramped.

Smallest compatible correction: Stack the picker below 768px and delay the
three-panel builder until 1280px.

Contract change required: NO

Issue: Some compact secondary controls remain below a 44px touch target.

Severity: MINOR (open)

Evidence: Several icon and inspector controls use `p-1`, `p-1.5`, or short
`py-1.5` sizing.

Impact: Touch accuracy is lower for secondary actions, though all critical
flows remain keyboard reachable and between-block insertion now has a 44px
native control.

Smallest compatible correction: Normalize touch target sizing during the
planned Admin UX hardening pass, with visual regression checks for the dense
block card layout.

Contract change required: NO

## Corrections Applied

- Canonical mock-save gate.
- Testable block factory and UUID-backed block/gallery IDs.
- Structured RichText preservation guard.
- Canonical locale fallback in RichText card excerpts.
- Media type confirmation guard and picker-state reset.
- Native eight-type insertion controls.
- Renderer-matching image zoom preview and safe pointer cancellation.
- Responsive picker and Admin-shell breakpoints.
- Modal labelling, focus entry/trap/return, and icon action names.
- External video provider/host schema refinement and regression assertion.
- Factual handoff/status updates.

## Canonical Schema Validation Results

- `initialMockDocument`: PASS.
- Inserted heading: PASS.
- Inserted richText: PASS.
- Inserted image: PASS.
- Inserted gallery: PASS.
- Inserted quote: PASS.
- Inserted video: PASS.
- Inserted CTA: PASS.
- Inserted divider: PASS.
- Duplicated block with a new ID: PASS.
- Reordered document: PASS.

## Tests / Checks

Command: `npx tsc --noEmit`

Result: PASS

Notes: No TypeScript errors.

Command: `node --experimental-strip-types --test src/lib/content/__tests__/contentContract.test.ts`

Result: PASS

Notes: 7/7 tests, including the provider/URL mismatch assertion.

Command: targeted canonical schema validation using the real
`contentDocumentSchema`, `INITIAL_MOCK_DOCUMENT`, and `createDefaultBlock`

Result: PASS

Notes: Initial document, all eight inserts, duplicate, unique IDs, and reorder.

Command: `npx eslint src/components/Admin/ContentEditor src/components/Admin/MediaPicker src/components/Admin/ImagePositionEditor src/app/admin/posts/builder`

Result: PASS WITH WARNINGS

Notes: Zero errors; six `no-img-element` warnings for Admin preview thumbnails.

Command: `npm run lint`

Result: PASS WITH PRE-EXISTING WARNINGS

Notes: Repository lint exits zero; existing warnings remain outside this review.

Command: responsive Playwright review at 390px, 768px, and 1440px

Result: PASS

Notes: No horizontal overflow. Media/Image Position dialogs fit at 390px;
focus entry and return pass.

Command: `git diff --check`

Result: PASS

Notes: No whitespace errors.

## Build Status

PRE-EXISTING / ENVIRONMENTAL

`npm run build` compiles and type-checks successfully, then fails during static
generation at `/admin/login` because Supabase URL/key values are absent. The
existing mock also lacks `maybeSingle()`. No content-builder compilation error
was reported.

## Ponytail Review

- Complexity found: the original default-block factory was trapped inside the
  678-line editor; custom hover-only insertion did less than a native select.
- Safe simplifications applied: extracted the pure factory for direct schema
  checks; reused existing frozen descriptors; used native selects and browser
  UUIDs; removed the unused MediaAsset callback payload.
- Deferred improvements: uniform 44px secondary targets and a full structured
  RichText editor belong to the planned Admin UX/editor phase.
- Abstractions intentionally retained: separate inspectors and the modal
  components already have multiple concrete responsibilities and match current
  ownership boundaries.

## Out-of-Scope Verification

- Phase 2: not started.
- Database migrations: none run or changed.
- Draft/publish/versioning: not implemented.
- Production media backend/upload: not implemented.
- DnD/editor dependencies: not added.
- Booking, cart, checkout, pricing, service duration, quantity, Custom For You,
  Focus/Avoid, Body Map, KTV, payment, auth business rules, and operational
  workflows: unchanged.
- Frozen contract document: unchanged.

## Merge / Continuation Recommendation

PROCEED TO PHASE 2

Proceed only in a separate authorized task after reviewing this uncommitted
correction diff. Do not include the open touch-target cleanup in Phase 2.

## Remaining Risks

- Some secondary Admin controls are smaller than 44px.
- Rich formatted AST content is intentionally read-only until the approved
  structured editor phase.
- Production persistence, real media resolution/upload, DnD, and draft/publish
  remain explicitly deferred.
- Full production build validation requires the existing Supabase environment
  or mock-client issue to be resolved outside this review.
