# Luna-1 Handoff

Date: 2026-09-08
Baseline: `05fce624831c47efa057c9349a026d05ea0b50ac`
Scope: VI/EN/JP/KR/CN content, Pure Relaxation admin/editor/API persistence, and History media.

## Delivered

- Pure Relaxation public rendering resolves all five internal locales and preserves intentional empty strings.
- Pure Relaxation admin editing now exposes five language tabs for category title/description/media label, narrative fields, service descriptions, media caption/tag/poster, and privilege fields. Narrative rows, chips, points, closing copy, VIP paragraphs, and final text are editable where rendered.
- Catalog names and descriptions persist to `Services` through the five-tab cards; the catalog PATCH does not write IDs, prices, durations, status, or media keys.
- Content and History writes use revision tokens and compare-and-swap behavior. Conflicts return `409 CONTENT_CONFLICT` while the current draft remains in local state.
- History preserves custom media URLs and only repairs confirmed bundled default `.jpg/.jpeg` paths to `.png`. Multilingual chapter metadata, scene alt text, fit, and image position are editable.
- Existing custom content/media keys are merged rather than replaced. The staging seed is fill-missing only and does not seed production.

## Verification

- `npx tsc --noEmit`: PASS.
- `node scripts/test-luna-1-cms.mjs`: PASS; CMS01-CMS14 mock assertions covered.
- `git diff --check` on Luna files: PASS.
- `npm run lint`: PASS with the repository's existing warnings; `next lint` deprecation warning remains.
- `npm run build`: compile and type-check PASS, then blocked during page-data collection by `PageNotFoundError: Cannot find module for page: /_document`.
- Authenticated staging API calls, browser screenshots, console logs, and network traces: NOT VERIFIED because no staging credentials/environment were available. No production DB connection, seed, or write was performed.

## Data gap / staging follow-up

The repository contains complete reviewed narrative defaults for all five locales, but does not contain source-grounded CN/JP/KR descriptions for active VIP catalog IDs `NHP0001`-`NHP0014`. The admin/API path supports those fields; a staging catalog export or approved translations are required before populating them. The seed intentionally leaves those records untouched rather than inventing copy.

## Files in Luna commit

- `src/app/api/admin/content/route.ts`
- `src/app/api/admin/history/route.ts`
- `src/app/api/admin/services/[id]/route.ts`
- `src/app/api/services/route.ts`
- `src/app/admin/history/page.tsx`
- `src/app/admin/services/ServiceEditModal.tsx`
- `src/app/admin/services/pure/page.tsx`
- `src/components/History/History.localization.ts`
- `src/components/History/History.tsx`
- `src/components/PureRelaxation/PureRelaxationPage.tsx`
- `src/components/PureRelaxation/pureRelaxationData.ts`
- `src/components/PureRelaxation/pureRelaxationDefaults.ts`
- `src/components/PureRelaxation/pureRelaxationResolvers.ts`
- `scripts/fixtures/luna-1/content-manifest.json`
- `scripts/test-luna-1-cms.mjs`
- `supabase/seeds/go_live_content_i18n_20260908.sql`

No booking, checkout, global-settings, `.env.local`, or production seed files were changed by Luna-1.
