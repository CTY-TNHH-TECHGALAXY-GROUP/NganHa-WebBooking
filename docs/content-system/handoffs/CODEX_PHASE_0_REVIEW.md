# Task Handoff — Codex Phase 0 Architecture Review

## Task

CONTENT-001: Phase 0 Architecture Review / Contract Gate

## Owner

Codex — Senior Content Architecture Gatekeeper

## Status

Approved with corrections. Contract V1.0.0 frozen.

## Worktree and Branch

- Worktree: `/Users/charlotte/Desktop/NGÂN HÀ/CTY TechGalaxy Group/NganHa-WebBooking-codex`
- Branch: `review/content-contract-codex`
- Initial Git status: clean

## Documents Reviewed Completely

- `README.md`
- `DEVELOPMENT_NOTES.md`
- `docs/content-system/IMPLEMENTATION_SPEC.md`
- `docs/content-system/CONTENT_CONTRACT_V1.md`
- `docs/content-system/ARCHITECTURE_DECISIONS.md`
- `docs/content-system/PHASE_STATUS.md`
- `docs/content-system/OWNERSHIP.md`
- `docs/agents/TASK_BOARD.md`
- `docs/agents/FILE_LOCKS.md`
- `docs/agents/status/ANTIGRAVITY.md`
- `docs/content-system/handoffs/ANTIGRAVITY_PHASE_0.md`

## Code Areas Independently Verified

- Blog schema/API/admin/public path:
  `supabase/migrations/20260906_webbooking_cms_foundation.sql:22-62`,
  `src/app/api/admin/posts/[id]/route.ts:14-34`,
  `src/app/api/posts/route.ts:8-16`,
  `src/app/admin/posts/page.tsx:59-81`.
- `WebbookingContentRevisions` and `SystemConfigs` audit/config conventions:
  `src/lib/api/contentRevision.ts`, `src/app/api/admin/content/route.ts`,
  `src/app/api/public/site-content/route.ts`.
- `MarketingMedia`, RLS, storage, admin capability boundary, and upload path:
  `supabase/migrations/create_marketing_media_table.sql:7-29`,
  `supabase/migrations/20260907_p0_media_recruitment_security.sql:31-115`,
  `supabase/migrations/20260912_webbooking_admin_analytics_reviewed.sql:329-378`,
  `src/app/api/admin/media-library/route.ts:20-114`,
  `src/app/admin/media-library/page.tsx:72-109`,
  `src/lib/uploads/validateUpload.ts`.
- Localization: `src/lib/constants.ts` and
  `src/components/TranslationProvider.tsx`.
- Legacy rendering and migration targets:
  `src/components/Blogs/BlogsPage.tsx`,
  `src/components/Blogs/SaigonCoffeeArticle.tsx`,
  `src/components/LocalTour/LocalTourPackagePage.tsx:430-511`,
  `src/components/HomeSpa/HomeSpaPage.tsx:131-208`, and
  `src/components/OurStory/OurStory.tsx`.
- Next.js/server-client/image boundary:
  `next.config.ts`, `src/lib/supabase-server.ts`,
  `src/lib/api/withAuth.ts`, and the client markers in the legacy pages.
- Existing dependencies: `package.json`; no Zod, Tiptap/ProseMirror, or
  dnd-kit dependency is installed.

## Findings

### BLOCKER Findings

No unresolved blockers remain after the corrections below. The following
pre-freeze blockers were corrected in the frozen contract:

Issue: Rich-text link marks accepted an unconstrained `href` in the proposed
contract.

Severity: BLOCKER (resolved before freeze)

Evidence: `CONTENT_CONTRACT_V1.md` originally typed `href?: string` and only
listed URL validation for image/video and CTA fields.

Why it matters: A future renderer could turn a structured JSON link into an
unsafe protocol path, violating the no-JavaScript/no-XSS requirement.

Smallest compatible correction: Freeze a shared safe URL policy for rich-text
links and external media; reject `javascript:`, `data:`, `vbscript:`, `file:`,
and protocol-relative URLs; validate the AST strictly; apply safe `rel` rules
for `_blank`.

Contract change required: YES — applied in V1.0.0.

Issue: Internal video blocks stored a raw `url`, conflicting with the required
`mediaId` source of truth for internal media.

Severity: BLOCKER (resolved before freeze)

Evidence: Proposed `VideoBlockProps` had `provider` and `url`, while the core
axiom required internal image and video references by `mediaId`.

Why it matters: Storage URL changes would not be centrally resolvable and the
video contract could bypass media permissions/metadata.

Smallest compatible correction: Use a discriminated `VideoSource`: internal
`{ type: 'internal', mediaId }` or external YouTube/Vimeo `{ type: 'external',
provider, url }`.

Contract change required: YES — applied in V1.0.0.

### MAJOR Findings

Issue: Existing blog editing is mutable-row editing, not isolated draft/publish
versioning.

Severity: MAJOR

Evidence: `WebbookingBlogPosts` has mutable `content` and `status` columns
(`20260906_webbooking_cms_foundation.sql:35-62`); the admin PUT calls
`PostsService.updatePost` directly (`src/app/api/admin/posts/[id]/route.ts:14-34`);
the public API reads the same table by status (`src/app/api/posts/route.ts:8-16`).

Why it matters: Editing a published row can change the public document before a
safe publish operation. `Published V12 -> Draft V13 -> Draft V14 -> Publish
V14` is not guaranteed by the current path.

Smallest compatible correction: Keep the current row as legacy entity/fallback,
add immutable `WebbookingContentVersions` plus draft/published pointers, and
make public reads resolve only the published pointer. Do not repurpose
`WebbookingContentRevisions`.

Contract change required: YES — repository-specific DB/API/RLS boundary added;
implementation deferred to the publishing phase.

Issue: The proposed contract did not clearly separate persisted JSONB from
server-resolved media data.

Severity: MAJOR

Evidence: `ImageBlockProps` and gallery items included optional `resolvedAsset`
fields beside persisted `mediaId`.

Why it matters: Resolver data could be written into snapshots, become stale,
and blur the API DTO/persistence boundary.

Smallest compatible correction: Remove resolver fields from persisted props and
define them only on server-prepared render DTOs; persistence Zod must reject
them.

Contract change required: YES — applied in V1.0.0.

Issue: RLS and preview behavior were not sufficiently explicit for the new
version table.

Severity: MAJOR

Evidence: Current CMS tables enable RLS with no browser policies and rely on
server service-role routes (`20260906_webbooking_cms_foundation.sql:117-123`);
current admin routes use capability checks, but no version table or published
pointer exists yet.

Why it matters: A future public query or preview route could expose drafts if
the published predicate and permission boundary are not mandatory.

Smallest compatible correction: Require server-only admin mutations, a public
published-pointer predicate, scoped short-lived preview tokens, and explicit
RLS/ACL tests before enabling content documents.

Contract change required: YES — applied in V1.0.0 and ADR-010.

Issue: The existing Media Library client upload bypasses the server validator.

Severity: MAJOR

Evidence: `src/app/admin/media-library/page.tsx:81-109` uploads directly to
Supabase Storage and then registers JSON metadata; the server-side
`validateUpload` call is only in the multipart branch at
`src/app/api/admin/media-library/route.ts:24-63`.

Why it matters: The current path does not guarantee magic-byte/payload checks
before a public storage object is created.

Smallest compatible correction: Content Builder uploads must use the validated
multipart/server-owned path or an equivalent server validation boundary. Phase
3 must repair or bypass the unsafe client upload route before enabling upload.

Contract change required: YES — implementation gate added; no production code
was changed in this review.

Issue: Public blog rendering is currently client-side and summary/modal based,
not SSR article rendering.

Severity: MAJOR

Evidence: `src/components/Blogs/BlogsPage.tsx:1` is a client component and
fetches `/api/posts` in `useEffect` at lines 80-85; `SaigonCoffeeArticle.tsx`
uses client scroll state at lines 141-163.

Why it matters: A new renderer cannot inherit the current client boundary and
still meet the SSR/SEO/CLS goals.

Smallest compatible correction: Keep `ContentRenderer` server-safe and isolate
interactive video/gallery/modal behavior in narrow client islands. Leave legacy
pages intact until a parity pilot.

Contract change required: YES — renderer boundary added; no legacy code changed.

Issue: The initial contract did not define deterministic locale fallback or a
required baseline type.

Severity: MAJOR

Evidence: Existing helpers use requested locale, then `en`, then `vi`
(`BlogsPage.tsx:22-23`, `TranslationProvider.tsx`), while the draft
`LocalizedString` comment claimed a Vietnamese requirement but its fields were
optional.

Why it matters: Admin and public renderers could disagree on missing
translations, and empty required content could pass type review.

Smallest compatible correction: Freeze requested locale -> `en` -> `vi` and add
`RequiredLocalizedValue<T> = LocalizedValue<T> & { vi: T }` for required
editorial baselines.

Contract change required: YES — applied in V1.0.0.

Issue: Forward migration pseudocode could unsafe-cast unsupported/future raw
JSON into `ContentDocument`.

Severity: MAJOR

Evidence: The draft migration accepted `any` and returned `doc as
ContentDocument` after a loop.

Why it matters: Malformed blocks or a future schema version could crash or
silently render incorrectly.

Smallest compatible correction: Use `unknown`, reject unsupported versions,
validate after each migration, and return diagnostics/skip behavior through a
safe parser. Route an unusable published document to legacy fallback where
available.

Contract change required: YES — applied in V1.0.0.

### MINOR Findings

Issue: Existing `MarketingMedia` lacks dimensions, MIME, file size, alt
metadata, and `updated_at`.

Severity: MINOR for the contract; Phase 3 implementation dependency.

Evidence: `create_marketing_media_table.sql:7-14` contains only id, title,
type, url, source, and created_at.

Why it matters: `next/image`/CLS-safe rendering cannot rely on the proposed
`MediaAsset` fields until the additive upgrade exists.

Smallest compatible correction: Keep fields nullable in the resolver contract,
add them additively in Phase 3, and require dimensions or a reserved aspect
ratio before public image render.

Contract change required: NO — implementation gate documented.

Issue: Zoom step was described but not part of the validation rule.

Severity: MINOR (resolved before freeze)

Evidence: The draft listed a `0.05` step but only bounded the number.

Why it matters: Admin and public composition could disagree at arbitrary zoom
values.

Smallest compatible correction: Require `1.0..2.0` and a `0.05` increment in
the persistence schema/UI.

Contract change required: YES — applied in V1.0.0.

Issue: Existing legacy content uses direct URLs/raw HTML handling in some
surfaces.

Severity: MINOR for the frozen contract; migration risk remains.

Evidence: `BlogsPage.tsx:25-37` normalizes legacy markup as text, while other
legacy components still contain `dangerouslySetInnerHTML` paths.

Why it matters: A legacy fallback must remain isolated from the structured
renderer and must not become a new raw-HTML source of truth.

Smallest compatible correction: Preserve legacy fallback as-is during migration;
never route new ContentDocument rich text through `dangerouslySetInnerHTML`.

Contract change required: NO — renderer boundary documented.

## Final Contract Decisions

- **Status:** APPROVED WITH CORRECTIONS
- **Contract:** `Content Contract V1.0.0`, FROZEN
- **Change protocol:** Any later change requires `docs/content-system/requests/CR-XXX.md`.
- **Phase boundary:** No Phase 1 production code was started.
- **Booking isolation:** Booking, cart, checkout, pricing, duration, quantity,
  Custom For You, Focus/Avoid, Body Map, KTV, payment, auth business rules, and
  operational workflows were not modified.

## Database Decision

Use a hybrid relational entity + immutable JSONB snapshot model. Keep
`WebbookingBlogPosts` as a legacy-compatible entity, add a dedicated version
table and pointers in a future migration, and use `WebbookingContentPages` for
new editorial pages. Do not use `SystemConfigs` as permanent CMS storage and
do not repurpose `WebbookingContentRevisions`.

## Draft / Publish Decision

The only approved public source is `current_published_version_id`. Draft saves
create immutable snapshots and advance only the draft pointer. Publish atomically
advances the published pointer after validation and authorization. Restore creates
a new draft snapshot; it never overwrites history.

## Media Decision

Internal image/video references use `mediaId` resolved from `MarketingMedia`.
External media is explicit and protocol-validated. The original asset remains
unchanged. Resolver metadata is server-only.

## Image Positioning Decision

Composition belongs to the block instance. Persist normalized `focalPoint.x/y`
in `0..100`, bounded `zoom` in `1.0..2.0` at `0.05` steps, controlled aspect
ratio/fit/presentation, and no raw pixel offsets.

## Multilingual Decision

One shared ordered block tree serves `vi`, `en`, `cn`, `jp`, and `kr`. Values
fallback deterministically from requested locale to `en` to `vi`; block order
never diverges by locale.

## Rich Text Decision

Structured AST is canonical. Only declared nodes/marks are accepted; unsafe
protocols, raw HTML, arbitrary CSS/classes, and JavaScript are rejected.

## Security Decision

Validation is required at form, API/Zod, persistence, and renderer boundaries.
Unknown/malformed blocks are skipped with diagnostics. Admin/preview are
capability-protected, public reads cannot select drafts, and upload validation
must be server-owned before Content Builder use.

## Legacy Compatibility Decision

Dual-mode rendering remains mandatory: published ContentDocument through the
new server-safe renderer; otherwise current legacy renderer. No mass migration
is required before pilots.

## Server / Renderer Boundary Decision

Public rendering is Server Component-compatible with narrow client islands for
interactive behavior. Intrinsic media dimensions/aspect reservations and
responsive `sizes` are required to control CLS; no unnecessary client hydration
or blanket image priority is approved.

## Documentation Updated

- `docs/content-system/CONTENT_CONTRACT_V1.md`
- `docs/content-system/ARCHITECTURE_DECISIONS.md`
- `docs/content-system/PHASE_STATUS.md`
- `docs/agents/TASK_BOARD.md`
- `docs/agents/FILE_LOCKS.md`
- `docs/agents/status/CODEX.md`

## Handoff Created

`docs/content-system/handoffs/CODEX_PHASE_0_REVIEW.md`

## Recommended Phase 1 Scope

Only after an explicit Phase 1 start: TypeScript types, Zod schemas, the
server-safe `ContentRenderer`, Block Registry, and the eight core block
renderers. Do not start the Admin Block Editor, migrations, or transactional
changes as part of this handoff.

## Overall Project Progress

5%
