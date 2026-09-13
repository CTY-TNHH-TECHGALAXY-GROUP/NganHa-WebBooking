# Final acceptance status — PageSpeed / accessibility workstream

Date: 2026-09-14 (Asia/Ho_Chi_Minh)

## Decision

**PARTIAL — not approved for production release.** The integration candidate contains the verified A/B/C changes and accessibility evidence, but W4 video re-encode and W5/W6 trace/coverage work remain deferred. Production `master` has not been merged or deployed by this workstream.

## Candidate provenance

- Integration worktree: `/private/tmp/nganha-pagespeed-integrator`
- Integration branch: `codex/ps-integration-20260913`
- Integration SHA: `1e64e1e6df8032d3f9f8bd8b0d4a70b4a3d5fced`
- Base checked: `origin/master` at `735f5c0289e89b4b3042ace0588cd84a94906253`
- Official origin: `https://oria-spa.vercel.app`
- Production branch: `master` (user-confirmed); no branch protection bypass performed.
- PR: [#11](https://github.com/CTY-TNHH-TECHGALAXY-GROUP/NganHa-WebBooking/pull/11), head `ea60c4c360e7c2dac265c7335fddedcaf624ae40`, base `735f5c0289e89b4b3042ace0588cd84a94906253`.
- Vercel status for the PR head is `success`; preview alias is `https://ngan-ha-web-booking-git-codex-ps-integration-160cb4-tech-galaxy.vercel.app`. Direct unauthenticated requests return Vercel SSO `302`, so preview HTML/PSI is not counted as verified live evidence.

## Completed and verified in integration

### Media delivery / cache

- History stage now exposes `src` and `srcset` only for the active and next eligible scene; other slides stay on a one-pixel placeholder. Integrated browser regression at 390×844 DPR2: HTTP 200, 12 unique History requests, all stage sources eligible, thumbnails lazy, thumbnail `w320` and stage `w960` candidates selected.
- After a clean rebuild using the post-apply Supabase config, a second browser run again passed all gating assertions and confirmed all 12 captured History requests used two-part content-hash URLs (`sourceHash-outputHash-wN.webp`). Evidence: `history-media-gating-report-live-config.json`.
- After merging the latest `origin/master`, the final integration run passed the same History assertions (12 requests, all content-hash URLs) and the 8-case accessibility run (0 axe violations, 0 failures). Evidence: `history-media-gating-report-final.json` and `remaining/agent-d/raw-axe-after.json`.
- Supabase dry-run inventory found exactly 25 verified pointers and 78 candidates. Apply v2 uploaded/verified 75 Supabase WebP objects; each used `image/webp`, `upsert:false`, one-year cache, public HEAD/GET, byte hash and dimensions. Originals were not deleted or overwritten.
- Two `SystemConfigs` rows were updated after private `0600` backups. The final script aggregates pointers per row, preflights canonical value hash, uses the exact `updated_at` snapshot as conditional, and verifies read-back. Independent read-back found 25/25 pointers with hash URLs and non-empty responsive maps.
- Chatbot consumer now uses the three local content-hash WebP files (1.8 / 4.3 / 7.7 KiB). The old non-hash candidate files were removed from the integration candidate so immutable caching cannot pin them.

### Accessibility

- Integration browser run: 8 route/viewport cases (home, History, `/vi`, `/en`; mobile and desktop), all HTTP 200, no page errors, zero axe WCAG 2A/2AA violations.
- Viewport contract is `width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover, user-scalable=yes`.
- Manual keyboard/zoom evidence is recorded; browser-level zoom was unavailable in headless mode. Axe returned 28 `incomplete` checks across cases; these require manual review and are not silently counted as PASS.

### Build checks

- `npx tsc --noEmit`: PASS.
- `npm run build`: PASS with production `.env.local`; Next 15.5.14 generated all 70 pages. A build without environment variables failed in existing mock Supabase paths, so the environment-backed result is the relevant one.
- `npm run lint`: exit 0 with existing warnings; no new lint error was introduced by the candidate.

## Deferred / blocked gates

- **W4:** active Hero MP4 is 1920×1080, ~25.1 s, 26,974,458 bytes; a controlled trace downloaded nearly the entire object. No approved `ffmpeg`/`ffprobe`/`cwebp`/ImageMagick runtime was available, so no mobile/desktop H.264 faststart rendition or poster WebP was generated. The candidate only supplies a verified fallback JPEG poster when CMS data has no poster. This is not a byte-reduction proof.
- **W5:** forced reflow and long tasks remain unattributed in the available diagnostic capture. No safe runtime patch was made. A CPU/network-controlled Performance trace is required before changing scroll/layout/animation code.
- **W6:** font/CSS/legacy-JS changes remain deferred. Existing audit Error/NO_LCP output cannot identify a safe selector or removable polyfill; coverage and font consumer/license mapping are required.
- No equivalent three-run live PSI/Lighthouse before/after exists. The existing diagnostic LCP/aggregate bytes are not a live PageSpeed improvement claim.
- Official production `oria-spa.vercel.app` has not served this candidate; production verification therefore remains open.

## Release blockers and next actions

1. Review the full diff from `origin/master`; create a real PR targeting `master` only after the integration reviewer accepts the media/schema change and the private backup/journal references.
2. Verify Supabase config read-back and asset HEAD/MIME/cache again immediately before release; do not rerun `--mode=apply` blindly. If `updated_at` is not reliably changed by all writers, replace the conditional with a reviewed database RPC/transaction before another migration.
3. Decide whether to approve a P0 partial release (A+B+D plus poster fallback) with W4–W6 explicitly open, or wait for a complete release. Do not claim all-plan DONE under the partial option.
4. If released, verify Vercel deployment SHA/alias, official HTML viewport/canonical, hashed asset requests, locale/menu/checkout/cart behavior, and three matched PSI/Lighthouse runs. Roll back code with a scoped revert and DB pointers with CAS/journal only when current values still match this release.

## Evidence index

- `remaining/agent-b/applied-manifest-20260913.json`
- `remaining/agent-b/migration-journal-20260913.jsonl`
- `remaining/agent-b/apply-verification.md`
- `remaining/agent-c-hero-inventory.md`
- `remaining/agent-d/raw-axe-after.json`
- `remaining/agent-d/manual-zoom-keyboard.json`
- `history-media-gating-report-integration.json`
- `remaining/agent-e/runtime-reflow-deferred.md`
- `remaining/agent-f/font-css-deferred.md`
