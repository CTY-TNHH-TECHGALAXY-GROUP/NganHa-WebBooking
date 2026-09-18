# Codex Phase 1 — Core Renderer Foundation Handoff

## Status

Completed on `feat/content-renderer`. The frozen Content Contract remains
unchanged at version 1.0.0. Phase 2 has not started.

## Branch and Commit

- Worktree: `/Users/charlotte/Desktop/NGÂN HÀ/CTY TechGalaxy Group/NganHa-WebBooking-codex`
- Branch: `feat/content-renderer`
- Commit: not created in this work session

## Files Created

- `src/types/content/content.ts`
- `src/types/content/index.ts`
- `src/lib/content/schemas/contentSchemas.ts`
- `src/lib/content/schemas/index.ts`
- `src/lib/content/parseContentDocument.ts`
- `src/lib/content/resolveLocalizedValue.ts`
- `src/lib/content/media.ts`
- `src/lib/content/imageComposition.ts`
- `src/lib/content/__tests__/contentContract.test.ts`
- `src/components/ContentRenderer/ContentRenderer.tsx`
- `src/components/ContentRenderer/index.ts`
- `src/components/ContentRenderer/registry.tsx`
- `src/components/ContentRenderer/rendererTypes.ts`
- `src/components/ContentRenderer/blockFrame.tsx`
- `src/components/ContentRenderer/blocks/HeadingBlock.tsx`
- `src/components/ContentRenderer/blocks/RichTextBlock.tsx`
- `src/components/ContentRenderer/blocks/ImageBlock.tsx`
- `src/components/ContentRenderer/blocks/GalleryBlock.tsx`
- `src/components/ContentRenderer/blocks/QuoteBlock.tsx`
- `src/components/ContentRenderer/blocks/VideoBlock.tsx`
- `src/components/ContentRenderer/blocks/CTABlock.tsx`
- `src/components/ContentRenderer/blocks/DividerBlock.tsx`

## Files Modified

- `package.json` — added approved `zod` dependency only.
- `package-lock.json` — lockfile entry for `zod` only.
- `docs/content-system/PHASE_STATUS.md`
- `docs/agents/TASK_BOARD.md`
- `docs/agents/FILE_LOCKS.md`
- `docs/agents/status/CODEX.md`

`CONTENT_CONTRACT_V1.md` and `IMPLEMENTATION_SPEC.md` were not modified.

## Architecture Implemented

### TypeScript contract

Canonical types are in `src/types/content/content.ts`. They cover the shared
five-locale tree, `ContentDocument`, all eight discriminated block types,
structured RichText, media references/assets, focal points, controlled image
composition, and bounded zoom.

### Zod validation

`src/lib/content/schemas/contentSchemas.ts` validates schema version, strict
block shapes, block IDs, locale keys, RichText nodes/marks/depth, approved URL
protocols/hosts, media references, focal point bounds, image enums, and 1.0–2.0
zoom in 0.05 increments. Resolver-only fields are not accepted by persisted
block schemas.

### Parser

`parseContentDocument` distinguishes valid V1, malformed input, and unsupported
schema versions. It skips unknown/malformed individual blocks, de-duplicates
block IDs defensively, and returns diagnostics without throwing on public input.

### Localization

`resolveLocalizedValue` centralizes the required order:

```text
requested locale -> en -> vi
```

The block tree is never duplicated per locale.

### Registry and renderer

`src/components/ContentRenderer/registry.tsx` maps exactly the frozen eight
types to renderers. `ContentRenderer.tsx` remains an async Server Component-
compatible function, preserves order, skips invisible/invalid blocks, and
isolates individual render failures.

### Core renderers

All eight renderers are present. RichText maps only the declared AST nodes and
marks and never uses `dangerouslySetInnerHTML`. Images and galleries use
controlled aspect ratios, fit, focal point, `object-position`, `sizes`,
presentation variants, and reserved aspect-ratio frames. Video supports
internal `mediaId` resolution and validated YouTube/Vimeo embed URLs only.

### Media boundary

`src/lib/content/media.ts` defines the resolver interface `MediaResolver` and
request-time `resolveMediaAsset`. No database or upload implementation was
added, and no resolved asset is persisted into a content document.

## Tests and Checks

- `npx tsc --noEmit` — PASS.
- `node --experimental-strip-types --test src/lib/content/__tests__/contentContract.test.ts` — PASS, 7/7.
- `npx eslint src/types/content src/lib/content src/components/ContentRenderer` — PASS.
- `npm run lint` — PASS with pre-existing warnings across the repository.
- `npm run build` — Next compilation PASS; final prerender fails at existing `/admin/login` Supabase setup when env vars are absent. The build also reports the existing mock client's missing `maybeSingle()` during static generation.
- `git diff --check` — PASS.

## Acceptance Correction

The acceptance audit found that image `presentation` was validated but not
applied by the renderer. The minimal correction added controlled frame width
and framed presentation styling; no contract or public page integration changed.

## Known Limitations

- No database resolver implementation or Media Library upgrade; those belong to
  the later media phase and no migrations were run.
- No draft/publish/versioning API or Admin Block Editor was added.
- Gallery `carousel` is a server-rendered layout without interactive controls;
  client interaction belongs to a later narrow-island phase.
- The existing full build requires valid Supabase environment configuration or
  an unrelated mock-client fix.

## Phase 2 Dependencies

- Seeded `ContentDocument` fixture and visual parity pilot.
- A server-side media resolver implementation when media infrastructure is
  approved.
- Actual public page integration only after the published-content boundary is
  available; do not bypass the frozen draft/publish architecture.

## Files That Should Not Be Changed Casually

- `docs/content-system/CONTENT_CONTRACT_V1.md`
- `src/types/content/**`
- `src/lib/content/schemas/**`
- `src/components/ContentRenderer/**`
- `src/lib/bookingCartStorage.ts`
- `src/lib/booking/**`
- `src/components/Checkout/**`
- `src/components/CustomForYou/**`
- `src/app/[lang]/new-user/**/checkout/**`

## Recommended Integration Sequence

1. Review this handoff and the frozen contract.
2. Review the renderer/schema tests and typecheck.
3. Add a Phase 2 seeded fixture without changing the contract.
4. Add an approved server media resolver when its phase begins.
5. Integrate only through a published-content boundary; preserve legacy
   fallback until visual parity is proven.
