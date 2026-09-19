# Codex Phase 2 — Saigon Coffee Renderer Pilot Handoff

## Status

COMPLETED WITH MINOR ISSUES

## Worktree / Branch / Baseline

- Worktree: `/Users/charlotte/Desktop/NGÂN HÀ/CTY TechGalaxy Group/NganHa-WebBooking-codex`
- Branch: `feat/saigon-coffee-pilot`
- Baseline: `08cc8f3` (`merge(content): integrate Codex Antigravity UI review`)
- Contract: V1.0.0, FROZEN and unchanged

## Files Created

- `src/content/saigonCoffeePilot.ts`
- `src/components/ContentPilot/SaigonCoffeePilot.tsx`
- `src/components/ContentPilot/SaigonCoffeePilot.module.css`
- `src/app/content-pilot/saigon-coffee/[lang]/page.tsx`
- `src/lib/content/__tests__/saigonCoffeePilot.test.ts`
- `docs/content-system/handoffs/CODEX_PHASE_2_SAIGON_COFFEE.md`

## Files Modified

- `docs/content-system/PHASE_STATUS.md`
- `docs/agents/TASK_BOARD.md`
- `docs/agents/FILE_LOCKS.md`
- `docs/agents/status/CODEX.md`

## Legacy Source Audited

- `src/components/Blogs/SaigonCoffeeArticle.tsx`
- `src/components/Blogs/SaigonCoffeeArticle.module.css`
- `src/components/Blogs/BlogsPage.tsx`
- `src/components/Blogs/blogContent.ts`
- `src/app/blogs/page.tsx`
- `src/app/api/posts/route.ts`
- `src/app/api/admin/posts/[id]/route.ts`
- `src/app/api/admin/media-library/route.ts`
- `supabase/migrations/create_marketing_media_table.sql`

The legacy article contains a page hero/H1, metadata chips, explanatory hero
aside, lede plus summary list, feature image and caption, three H2 sections,
two paragraphs per section, bordered quote, side note, pull quote, CTA, and
three related-story cards. It provides VI and EN copy only. The component is
retained unchanged, but source inspection confirms the current `/blogs` page
does not mount it. Cards continue to open the existing generic modal article
path. The dedicated component is preserved legacy source, not an active routed
fallback.

## Pilot Content Source / Fixture

The pilot is a direct editorial mapping of the VI/EN values in
`SaigonCoffeeArticle.tsx`. The fixture is
`src/content/saigonCoffeePilot.ts`. It contains one shared block sequence and
no persisted URLs. It is parsed and rendered by the same canonical V1 boundary
future persisted documents must use.

## Block Mapping

| Legacy structure | V1 mapping | Classification |
|---|---|---|
| Page hero, H1, metadata, explanatory aside | Server page template metadata | REPRESENTABLE outside article body |
| Lede + quick summary | RichText paragraphs + bullet list | REPRESENTABLE |
| Feature media + caption | Image block | REPRESENTABLE |
| Three article sections | Heading + RichText blocks | REPRESENTABLE |
| Section-one pull quote | Quote block, bordered | REPRESENTABLE |
| Section-one side note | Separate RichText card | REPRESENTABLE WITH MINOR VISUAL DIFFERENCE |
| Oria perspective pull highlight | Quote block, centered-serif | REPRESENTABLE |
| Ask Oria card | CTA block, dark-luxury | REPRESENTABLE WITH MINOR BEHAVIOR DIFFERENCE |
| Related story cards | RichText bullet list styled as cards | REPRESENTABLE WITH MINOR VISUAL DIFFERENCE |

No new block type was added.

## RichText Mapping

Paragraphs and lists use the frozen structured AST. The quick-summary label and
side-note label use a supported bold mark. No raw HTML,
`dangerouslySetInnerHTML`, arbitrary class field, CSS value, or script is stored
in the document.

## Media Mapping

| mediaId | Legacy source | Verified dimensions | Use |
|---|---|---:|---|
| `media-saigon-coffee-hero` | Unsplash `photo-1518057111178-44a106bad636` | 2000×2996 | Page-template hero |
| `media-saigon-coffee-feature` | Unsplash `photo-1559525839-b184a4d698c7` | 1200×1500 | V1 Image block |

`SAIGON_COFFEE_PILOT_DOCUMENT` persists only the feature `mediaId`.
`resolveSaigonCoffeePilotMedia` is a typed, fixture-local resolver; resolved
URLs and dimensions are request-time data and are not written into the V1
document. No `MarketingMedia` row or migration was created.

## Image Composition

The feature image uses a `16:9` reserved frame, `cover`, focal point `{ x: 55,
y: 46 }`, zoom `1`, and `wide` presentation. The hero uses the verified portrait
asset with `object-position: 50% 58%`. Both retain the original source assets;
no crop derivative or raw pixel offset is persisted. The renderer reserves the
image frame and responsive screenshots show no visible clipping; CLS was not
measured with a performance trace.

## Visual / Semantic / Responsive Parity

### Visual findings

- Desktop 1440px: PASS. Pilot screenshots plus legacy source/CSS comparison
  confirm the hero scale, warm palette, serif hierarchy, intro grid, wide
  feature media, quotes, CTA, and three-card related rhythm match the legacy
  design intent.
- Tablet 768px: PASS. Hero stacks, article remains readable, media and CTA stay
  within viewport, and related cards collapse to one column.
- Mobile 390px: PASS. No horizontal clipping; H1, headings, image caption,
  quotes, CTA, and related cards remain legible.

A live side-by-side legacy screenshot was not possible because the dedicated
legacy component has no mounted route in the baseline. Visual acceptance is
therefore based on audited legacy markup/CSS and live pilot screenshots, not a
routed A/B capture.

### Difference classification

- CRITICAL: none.
- MAJOR: none.
- MINOR: the legacy section-one note no longer sits beside its paragraphs; V1
  has no controlled two-column composition block.
- MINOR: related stories retain text and order but lack real story link fields
  and per-card media because V1 has no related-content block.
- ACCEPTABLE: section indices use Heading subtitle data and scoped renderer
  styling rather than hard-coded section wrapper markup.

### Semantic findings

- One page-template H1; article sections are H2.
- Reading order matches the legacy source.
- Lists remain native lists, CTA remains a crawlable anchor, and images have
  meaningful localized alt text.
- The CTA points to the existing `/blogs` route; it does not mutate business
  state. The legacy action has no wired destination, so richer behavior remains
  explicitly deferred.

## SEO / SSR

`SaigonCoffeePilot` and `ContentRenderer` remain server components. No new
`use client`, effect, hydration-only content, or client state was added. The
development route emits title/description metadata and `noindex, nofollow`.
The production public `/blogs` route and its metadata are unchanged. The pilot
route calls `notFound()` in production and therefore cannot expose mock draft
content as a public read.

## Multilingual Findings

The fixture has one shared block tree. VI and EN use audited legacy copy. CN,
JP, and KR intentionally contain no fabricated translations and resolve using
the canonical requested locale -> EN -> VI order. Language routes were checked
against the same document.

## Schema Validation / Tests

- Canonical `contentDocumentSchema`: PASS.
- `parseContentDocument`: valid, zero skipped blocks.
- Block ID uniqueness: PASS.
- Media reference integrity and intrinsic dimensions: PASS.
- Persisted-document URL exclusion: PASS.
- Locale fallback: PASS.
- Representative RichText list and bold mark: PASS.

## Issue Classification

Issue: V1 cannot reproduce the section-one body/side-note two-column
composition.

Severity: MINOR

Evidence: V1 is a flat ordered list with no nested layout or media-text preset.

Impact: Content and order are preserved; the note follows the quote instead of
appearing beside the paragraphs.

Smallest correction: Keep the separate RichText card for Phase 2.

Contract change required: NO

Issue: The dedicated legacy Saigon Coffee component is preserved but is not
mounted by the baseline `/blogs` route.

Severity: MINOR

Evidence: Repository-wide import search finds no caller of
`SaigonCoffeeArticle.tsx`; `/blogs` uses the generic modal article path.

Impact: Phase 2 caused no public regression, but the preserved component is not
an active route-level fallback and direct live A/B screenshot comparison is not
available without adding review-only infrastructure.

Smallest correction: State the boundary accurately and defer production
dual-mode route selection to the approved legacy-compatibility phase.

Contract change required: NO

Issue: V1 cannot model linked related-story cards.

Severity: MINOR

Evidence: The frozen types contain no related-content/card block and the legacy
`href="#"` values are placeholders.

Impact: Related copy is preserved, but items are not individual links/media
entities.

Smallest correction: Preserve them as a structured list until an evidence-led
controlled preset is approved after the pilot phases.

Contract change required: NO

## Legacy Fallback / Public Integration Boundary

`src/components/Blogs/SaigonCoffeeArticle.tsx` and its CSS are untouched. The
dedicated component remains unmounted as it was at baseline; `/blogs` continues
to use its existing generic modal flow. No route replacement, dual-read query,
DB pointer, or production draft/publish behavior was added. The fixture-backed
route is:

`/content-pilot/saigon-coffee/{vi|en|cn|jp|kr}`

It is available only in development and is marked noindex. Production public
reads remain on the existing `/blogs` API/modal path.

## No-Migration Confirmation

- Database migration executed: NO.
- Database migration created: NO.
- Production persistence added: NO.
- `SystemConfigs` used for pilot storage: NO.
- Draft/publish architecture bypassed: NO.

## Checks

- `npx tsc --noEmit`: PASS.
- Canonical Phase 1 tests: PASS, 7/7.
- Targeted pilot tests: PASS, 4/4.
- Targeted ESLint: PASS.
- `npm run lint`: PASS with pre-existing repository warnings.
- `npm run build`: compilation and type validation PASS; prerender FAILS for
  the known missing Supabase environment/mock `maybeSingle()` issue and exits
  at `/admin/login` (PRE-EXISTING / ENVIRONMENTAL).
- `git diff --check`: PASS.

## Recommended Next Phase

Stop at Phase 2. Begin Phase 3 only with separate authorization: implement the
production `MarketingMedia` metadata upgrade and server media resolver, then
replace the pilot-local resolver without changing the V1 document shape.

## Overall Project Progress

25%, per the authoritative roadmap after Phase 2 completion.
