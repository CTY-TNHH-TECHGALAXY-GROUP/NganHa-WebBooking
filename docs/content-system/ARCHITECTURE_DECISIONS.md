# Architecture Decision Records (ADRs) — Dynamic Content Block System

**Project:** NganHa-WebBooking  
**Module:** Content System Architecture  
**Phase:** Phase 0 — Architecture Verification & Contract Definition  
**Status:** ACCEPTED WITH CORRECTIONS — CONTRACT V1.0.0 FROZEN BY CODEX
**Date:** 2026-09-18  

---

## ADR-001: Hybrid Relational Metadata + Typed JSONB Content Document

### Status
ACCEPTED (Contract V1.0.0)

### Context
Editorial and marketing content across the repository (`src/components/Blogs/BlogsPage.tsx`, `src/components/Blogs/SaigonCoffeeArticle.tsx`, `src/components/LocalTour/LocalTourPackagePage.tsx`, `src/components/OurStory/OurStory.tsx`, `src/components/HomeSpa/HomeSpaPage.tsx`) is currently coupled to static TSX components, split crudely via `\n\n` into simple `<p>` tags, or stored in raw JSON structures inside `public.SystemConfigs`. 

When marketing or editorial administrators wish to adjust the order of elements (e.g. placing an image between paragraph 1 and 2, moving a quote above a gallery, or changing aspect ratios), engineers currently must manually edit JSX and deploy new code.

To solve this, we evaluated three data storage paradigms:
1. **Pure Relational Blocks:** Tables for Sections, Rows, Columns, and Blocks with foreign keys.
2. **Monolithic Raw HTML / Markdown:** Unstructured HTML strings stored in text columns.
3. **Hybrid Model:** Relational tables for identity, indexing, routing, and version pointers + typed JSONB documents for ordered block sequences.

### Decision
Adopt the **Hybrid Relational Metadata + Typed JSONB Content Document** architecture.
- **Relational Columns:** `id` (UUID PK), `slug` (indexed/unique), `status` (`draft` | `scheduled` | `published`), `published_at`, `created_at`, `updated_at`, `current_draft_version_id` (UUID FK), `current_published_version_id` (UUID FK).
- **JSONB Column / Entity:** `ContentDocument` with schema versioning `{ schemaVersion: 1, blocks: ContentBlock[] }`.

### Consequences
- **Positive:** Atomic document updates, one bounded entity-to-published-version lookup instead of per-block joins, simple immutable snapshot versioning, and seamless mapping to React server/client component props.
- **Negative:** Schema evolution within JSONB requires forward migration scripts (`migrateContentDocumentV1ToV2`) rather than standard SQL DDL alterations.

---

## ADR-002: Single Ordered Block Sequence with Internal Localization

### Status
ACCEPTED (Contract V1.0.0)

### Context
`NganHa-WebBooking` supports 5 distinct locales: `vi`, `en`, `cn`, `jp`, `kr` (defined in `src/lib/constants.ts`). When an editor alters the document layout (such as inserting an image between paragraphs or swapping two sections), having separate block arrays per language would require editors to perform the exact same layout manipulation 5 times, inevitably causing structural desynchronization.

### Decision
Maintain a **single shared block array** across all languages. Structural actions (adding, deleting, duplicating, reordering blocks) apply globally to all languages. Text, captions, and localized attributes are stored *inside* block properties as `LocalizedValue<T>`:
```typescript
export type LocalizedValue<T> = {
  vi?: T;
  en?: T;
  cn?: T;
  jp?: T;
  kr?: T;
};
```

### Consequences
- **Positive:** Guaranteed layout consistency across all 5 languages. Reordering a block in Vietnamese instantly mirrors the exact structure in English, Chinese, Japanese, and Korean.
- **Positive:** Admin UI can feature lightweight language switching tabs while keeping the block tree fixed.
- **Negative:** If a specific locale requires a completely different visual composition, it cannot diverge within the same article without an explicit locale visibility flag.

---

## ADR-003: Media Reference by Media ID & Enhanced MarketingMedia

### Status
ACCEPTED WITH IMPLEMENTATION GATE (Contract V1.0.0)

### Context
The repository already contains `public.MarketingMedia` and a Supabase Storage bucket (`media-uploads/marketing/`). However:
1. Blocks historically stored raw URLs. If storage buckets, folder paths, or CDN domains change, hardcoded URLs become broken links.
2. `MarketingMedia` only contains `id`, `title`, `type` (`image` | `video`), `url`, `source`, `created_at`. It lacks intrinsic dimensions (`width`, `height`), `mime_type`, `file_size`, and localized alt text.
3. Without intrinsic dimensions, `next/image` cannot reserve correct layout space during SSR, leading to Cumulative Layout Shift (CLS) on mobile and desktop.

### Decision
1. Image and Gallery blocks MUST store internal media references by `mediaId: string` pointing to `MarketingMedia.id`.
2. Public URLs and intrinsic dimensions are resolved on the server by `resolveMediaAsset(mediaId)` during document preparation or SSR.
3. `MarketingMedia` will be enhanced in Phase 3 with additive columns: `width`, `height`, `mime_type`, `file_size`, `alt_i18n`, and `metadata`.

### Consequences
- **Positive:** Stored content documents remain decoupled from physical storage URLs.
- **Positive:** Intrinsic dimensions guarantee zero CLS and optimal Core Web Vitals.
- **Positive:** Centralized alt text can be managed globally in the media library while remaining overridable per block.

---

## ADR-004: Block-Instance Specific Framing & Normalized Percentage Focal Point

### Status
ACCEPTED (Contract V1.0.0)

### Context
Different editorial articles may use the same source media asset with different artistic intents (e.g. an editorial banner needs a wide 16:9 landscape framing focused on the artisan's hands, while a tour card needs a 1:1 square crop focused on a facial expression). Furthermore, permanently cropping images on upload wastes storage, reduces image resolution, and prevents responsive re-framing.

### Decision
1. Framing attributes (`aspectRatio`, `fit`, `focalPoint`, `zoom`, `presentation`) belong strictly to the **block instance**, NOT globally to `MarketingMedia`.
2. The Admin Image Editor will provide an interactive preview where the visual frame stays fixed and the user can drag the image within the frame.
3. Coordinates MUST be persisted as normalized percentage values (`0` to `100`):
   ```json
   {
     "focalPoint": { "x": 43, "y": 27 },
     "zoom": 1.2
   }
   ```
4. Persisting raw pixel offsets (`left: -120px`, `top: -45px`) is strictly forbidden.
5. The public renderer translates normalized percentages to standard responsive CSS:
   ```css
   object-fit: cover;
   object-position: 43% 27%;
   ```
6. The source media file in Supabase Storage remains 100% pristine and uncropped.

### Consequences
- **Positive:** 100% responsive stability across mobile (375px, 390px, 430px), tablet (768px), and desktop (1024px+).
- **Positive:** Non-destructive editing: editors can change aspect ratio or reset focal points at any time without losing image quality.

---

## ADR-005: Decoupled Immutable Version Snapshots & Draft/Published Pointer Model

### Status
ACCEPTED WITH IMPLEMENTATION GATE (Contract V1.0.0)

### Context
Currently, `WebbookingBlogPosts` has only a single mutable row per post with a status column (`draft`, `scheduled`, `published`). When an administrator modifies a published blog post, any auto-save or draft save immediately mutates the live row, leaking incomplete drafts to public visitors and search engine bots.

Furthermore, `WebbookingContentRevisions` currently acts only as an append-only log for `SystemConfigs` without version numbers, entity linking, or restore capabilities.

### Decision
1. Decouple Draft state from Published state using a pointer model on the content entity:
   - `current_draft_version_id UUID`
   - `current_published_version_id UUID`
2. Every draft save writes an immutable content version snapshot to `public.WebbookingContentVersions`.
3. Public routes and APIs query ONLY the version referenced by `current_published_version_id`.
4. Publishing updates `current_published_version_id = current_draft_version_id` and records `published_at = now()`.
5. Reverting an article creates a new draft version copied from a past snapshot, preserving complete non-destructive audit history:
   `Published V12 -> Draft V13 -> Draft V14 -> Publish V14 -> Restore V12 (creates Draft V15) -> Publish V15`.

### Consequences
- **Positive:** Eliminates draft leakage to production users.
- **Positive:** Provides instantaneous, zero-risk rollback of broken or accidentally published content.
- **Negative:** Requires storing version snapshots in `WebbookingContentVersions` (managed by automated cleanup or retention limits).

---

## ADR-006: Dedicated Content Entities vs Permanent Dependence on SystemConfigs

### Status
ACCEPTED (Contract V1.0.0)

### Context
`SystemConfigs` is a key-value store intended for system-wide flags, business hours, and operational configurations. In earlier prototypes, full page content was occasionally serialized into `SystemConfigs` JSON keys (`local_tour_content`, `brand_history`). However, `SystemConfigs` lacks foreign keys, relational indexing, draft/publish lifecycle pointers, and per-entity access controls.

### Decision
1. `SystemConfigs` is explicitly rejected as the permanent architectural home for the Content Builder.
2. Blog posts will use `WebbookingBlogPosts` (extended with version pointers and block document support).
3. Structured editorial pages (e.g. Local Tour, Our Story, Home Spa) will be transitioned to a dedicated entity table `WebbookingContentPages` and version table `WebbookingContentVersions`.
4. Existing legacy admin routes may continue to read/write their existing
   `SystemConfigs` keys during transition, but the new Content Builder must not
   use `SystemConfigs` as its draft/publish store. New structured content uses
   the dedicated entity/version model; public legacy reads remain fallback-only
   until migrated.

### Consequences
- **Positive:** Strong relational schema integrity, proper slug indexing, and clean separation between site-wide settings and editorial content.

---

## ADR-007: Strict Rejection of Raw CSS, customClass, and Arbitrary HTML Injection

### Context
Permitting content editors to inject arbitrary HTML, inline CSS, or unconstrained CSS classes inevitably leads to broken responsive layouts, visual regressions against the Oria luxury design system, and severe XSS vulnerabilities.

### Decision
1. `customClass` is strictly prohibited in all block schemas.
2. Rich text is represented as a structured JSON AST (ProseMirror / Tiptap nodes), not unconstrained HTML strings.
3. Block styling is governed entirely by semantic tokens:
   - Width: `'narrow' | 'content' | 'wide' | 'full'`
   - Spacing: `'none' | 'sm' | 'md' | 'lg' | 'xl'`
   - Variants: semantic tokens defined in the design system (e.g., `'gold-solid' | 'gold-outline' | 'dark-luxury'`).
4. The public `ContentRenderer` maps these semantic options to verified Tailwind CSS v4 classes.

### Consequences
- **Positive:** Guarantees design system compliance across all devices.
- **Positive:** Eliminates XSS attack vectors.

---

## ADR-008: Server-Side Rendering (SSR) & Defensive Block Registry Fallback

### Context
Public pages must maintain top-tier Core Web Vitals, sub-second LCP, and complete SEO crawlability. Furthermore, if a new block type is introduced in the database, older or cached renderer components must not crash the entire page.

### Decision
1. `ContentRenderer` must be fully executable within Next.js Server Components without requiring client hydration unless an interactive element (e.g., a carousel or video player) explicitly requires it.
2. The Block Registry implements defensive error boundaries:
   - If a block type is unrecognized or its props fail validation, the renderer logs a diagnostic warning to telemetry, omits the faulty block, and safely renders the remainder of the page.
   - The page NEVER throws an unhandled exception or renders a blank screen.

### Consequences
- **Positive:** Superior SEO and Core Web Vitals performance.
- **Positive:** High resilience against malformed or unsupported block data.

---

## ADR-009: Strict Scope Isolation from Transactional Booking Systems

### Context
`NganHa-WebBooking` contains critical commercial logic: service catalog, pricing, duration calculation, booking slot availability, KTV therapist allocation, Body Map customizations, cart persistence, and payment gateways.

### Decision
The Content Block System is strictly isolated to editorial and marketing surfaces (`/blogs`, `/our-story`, `/local-tour`, `/home-spa`, `/academy`).
- Under NO circumstances may Content Builder code import, modify, or depend upon `src/lib/bookingCartStorage.ts`, checkout flows, booking calculation utilities, or therapist allocation logic.
- Content CTAs may link to booking routes via standard URL navigation (`buttonUrl: "/new-user/barbershop/checkout"`), but may not execute internal booking state mutations.

### Consequences
- **Positive:** Zero risk of regressions in revenue-generating booking and payment flows.

---

## ADR-010: Published Pointer Is the Only Public Content Selector

### Status
ACCEPTED WITH IMPLEMENTATION GATE (Contract V1.0.0)

### Evidence
The current `WebbookingBlogPosts` table is mutable, while the public posts API
filters by `status`/`published_at`. The admin post API can update the same row
after checking `content.write`/`content.publish`. That is not sufficient to
protect a published document from draft edits.

### Decision
V1 publication uses immutable `WebbookingContentVersions` snapshots plus
`current_draft_version_id` and `current_published_version_id` pointers on the
content entity. Public loaders may read only the published pointer. The current
blog row and `WebbookingContentRevisions` remain legacy/fallback and audit
structures until the publishing phase replaces the mutable document path.

### Required implementation gate
Before a ContentDocument can be enabled for a public entity, the save/publish
routes, entity integrity, optimistic concurrency, and RLS/ACL behavior must be
implemented and tested against `Published V12 -> Draft V13 -> Draft V14 ->
Publish V14` without draft leakage.

---

## ADR-011: Server-Validated Media Upload Boundary

### Status
ACCEPTED WITH IMPLEMENTATION GATE (Contract V1.0.0)

### Evidence
`src/lib/uploads/validateUpload.ts` performs magic-byte and payload checks, but
the current Media Library client uploads directly to Supabase Storage before
registering a JSON metadata row. The client path does not call that validator.

### Decision
The frozen contract requires Content Builder uploads to use a server-side
validated multipart flow (or an equivalent server-owned validation boundary).
The existing direct client upload path is not considered a safe implementation
of the contract. Internal blocks still persist only `mediaId`; URL registration
is not a substitute for upload validation.

### Consequences
Phase 3 must either route the Media Library through the validated endpoint or
provide a separate server-owned endpoint before Content Builder upload is
enabled. No migration or production code change is part of this Phase 0 review.

---

## ADR-012: Server Renderer with Narrow Client Islands

### Status
ACCEPTED (Contract V1.0.0)

### Evidence
The current `/blogs` surface is a client component that fetches post summaries
in `useEffect`; `SaigonCoffeeArticle` also uses client-only scroll state. This
is legacy behavior, not a reason to make the new public renderer client-only.

### Decision
`ContentRenderer` and media resolution remain Server Component-compatible for
public SSR/SEO. Interactive behavior is isolated to explicit client islands
(for example carousel controls or a video player). Legacy client pages remain
unchanged until a migration pilot proves parity.

---

## ADR-013: Persisted Document vs Prepared Render DTO

### Status
ACCEPTED (Contract V1.0.0)

### Decision
`ContentVersion.document` persists only canonical block data. Resolved media
assets, signed URLs, diagnostics, and other request-time values are prepared on
the server after validation and are not written into JSONB. Persistence schemas
must reject these resolver-only fields.

---

## ADR-014: Safe Structured Rich Text Links

### Status
ACCEPTED (Contract V1.0.0)

### Decision
Structured rich text remains the canonical format, but link marks are not
trusted merely because the payload is JSON. Zod validation rejects unsafe and
protocol-relative URLs; the renderer maps only approved protocols and applies
safe `rel` behavior for new-tab links. No `dangerouslySetInnerHTML` path is
introduced by the Content Renderer.
