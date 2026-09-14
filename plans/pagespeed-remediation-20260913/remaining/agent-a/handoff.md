# A — media identity and Our Story consumer handoff

## Scope and ownership

- Base: `e9463a4c9dd11cf4f4c314ff780232fd789566f6` (`codex/ps-integration-20260913`)
- Branch: `codex/ps-closeout-a-continuation-20260914`
- Owned changes: `src/lib/media/responsiveSources.ts`, `src/components/OurStory/OurStory.tsx`, `src/components/OurStory/OurStory.data.ts`, and A-only media tests.
- Deliberately untouched: `src/app/admin/our-story/page.tsx`, `src/app/api/admin/system-settings/route.ts`, and `scripts/migrate-pagespeed-renditions.mjs` (B/integrator ownership).

## Contract

- A map beside an `image` field uses `responsiveSources` and declares the source it was generated from in `responsiveSourceImage`.
- A map beside a named field uses `${mediaKey}ResponsiveSources` and `${mediaKey}ResponsiveSource`; for example, `cityImageResponsiveSources` and `cityImageResponsiveSource`.
- A non-empty declared identity that differs from the current original image disables the map. An identity-less legacy map remains a compatible fallback, as required by Addendum 7/A.2.
- The exported `replaceMediaSourceAndClearRenditions` helper preserves metadata on text-only edits and clears only that media field's map plus identity when its original changes.

## Changes

- Our Story hydrator accepts and sanitizes responsive maps for location, film, atmosphere, pillar, and menu-niche media, retaining all existing text, locale, watermark, aspect-ratio, alt, and badge fields.
- `DeferredStoryImage` uses a map only when identity allows it; it exposes `aria-busy` until decode succeeds or a final error occurs, retries the original once if a responsive source errors, and preserves the existing +200px IntersectionObserver/SSR placeholder policy.
- Added deterministic contract coverage and a loopback-only browser harness (HTTP/final URL, root-margin URL gating, decode, `aria-busy`, horizontal film strip, three cold contexts, and no-IntersectionObserver fallback).

## Required B writer delta

1. When a writer or rendition migration generates a map, write the matching identity field in the same CAS mutation.
2. When an incoming original source differs from the stored source, remove only that media field's rendition map and identity before save; retain both for text-only edits or an unchanged source.
3. Keep legacy identity-less maps untouched for unchanged records. Do not convert a source change into a legacy fallback: the writer must clear its stale map.
4. `scripts/migrate-pagespeed-renditions.mjs` currently only targets Our Story city/street media; if additional Our Story slots are rendited, add their matching pointer/identity handling under B ownership.

## Verification

| Command | Result |
| --- | --- |
| `node scripts/test-our-story-media-contract.mjs` | PASS |
| `npx tsc --noEmit` | PASS |
| `node scripts/test-pagespeed-rendition-safety.mjs` | PASS |
| `node --check scripts/test-our-story-media-browser.mjs` | PASS |
| `git diff --check` | PASS |
| `NEXT_DIST_DIR=.next-a-browser npm run build` | NOT VERIFIED: application compilation/type-check completed, but static export failed at `/admin/login` because this isolated environment has no Supabase URL/API key. No usable `prerender-manifest.json` was produced, so `next start`/browser execution was not possible. |

## Evidence and gates

See `evidence-index.json`. R4 source identity is **PARTIAL**: deterministic consumer/hydrator coverage passes, but the B-owned writer/migration delta is still required. R5 is **NOT VERIFIED**: no generated 64/128/192 thumbnail inventory, size/bytes budget, or browser `currentSrc` evidence exists. Our Story browser/decode/network/three-run acceptance is **NOT VERIFIED** because the production server cannot start from the missing-env build.

The SSR/no-JS policy is unchanged: before client IntersectionObserver setup, `DeferredStoryImage` emits a geometry-preserving transparent placeholder rather than a CMS image URL. That is documented here rather than treated as no-JS image acceptance.

## Rollback

Revert this one commit. It changes only consumer/type/test files and has no storage, database, deploy, settings, or external side effects.
