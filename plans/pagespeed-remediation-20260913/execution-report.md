# PageSpeed/accessibility execution evidence — 2026-09-13

## Scope and provenance

- Candidate branch: `codex/pagespeed-accessibility-20260913`, isolated from `origin/master` at `6ce113e`.
- Production deployment was not performed by this worktree. Vercel production branch remains `master`; a production merge/deploy must be reviewed after this branch is pushed.
- Main checkout was not edited. Existing artwork, video, i18n, badges, cart/checkout, and canonical configuration were preserved.
- Raw W0 diagnostic: `live-diagnostic-baseline.json` in this directory.

## W0 live baseline

Captured from `https://oria-spa.vercel.app` at mobile 390×844, DPR 2. The homepage reported LCP 5,764 ms with a `SPAN` candidate, four long tasks totaling 568 ms, and CLS 0. `/history` reported LCP 1,092 ms, three long tasks totaling 385 ms, and CLS 0.

The three reported accessibility failures on both routes were `aria-prohibited-attr` (serious), `color-contrast` (serious), and `meta-viewport` (moderate). The largest homepage image requests included the 622,296-byte chatbot WebP, 542,725-byte OurStory city image, and 410,683-byte street image. History initially requested full remote WebPs for the first two stage images.

## Applied changes

1. Restored pinch zoom with `maximumScale: 5` and `userScalable: true`.
2. Made `SmartLogo` a labelled `role="img"` wrapper and hid its decorative SVG from the accessibility tree.
3. Raised the footer copyright text opacity to clear the measured contrast failure.
4. Added responsive WebP candidates for chatbot, all eligible History scenes, and the two OurStory location images. The browser receives 320/640/960 candidates through `<picture>` and keeps the original URL as the fallback.
5. Added local chatbot candidates at 64/128/192 px and immutable one-year caching for `/images/optimized/*`.
6. Kept History stage and thumbnail geometry stable while switching them to responsive media; lazy loading remains enabled so media follows the existing chapter/viewport flow.
7. Added poster-first Hero rendering, so configured video remains mounted and fades in after its first frame while the configured poster keeps the first paint usable during range negotiation or failure. Retry/status UI remains available on media failure.
8. Made the OurStory horizontal film strip keyboard focusable and labelled after the full axe run identified its scrollable-region issue.
9. Added `scripts/migrate-pagespeed-renditions.mjs`. It is dry-run by default; `--apply` generated WebP derivatives, verified bytes/hash/public headers, and performed conditional `updated_at` + value-hash CAS updates.

## Supabase migration evidence

The apply run covered 23 History sources and 2 OurStory sources. It created or verified 75 immutable WebP objects (320/640/960 for each source), with `Content-Type: image/webp`, `Cache-Control: public, max-age=31536000` on public Supabase responses. No source object was deleted or overwritten.

- Source bytes across the 25 source assets: 57,555,590.
- Responsive candidate bytes across all 75 objects: 6,530,482.
- Aggregate candidate reduction: 51,025,108 bytes (88.7%). This is an aggregate across three widths per source, not a claim that every request is 88.7% smaller.
- `SystemConfigs.brand_history` CAS update after hash: `975c911b872b120d7b600459b9d34903ea3fd53c029f9bbfe2d7583aefd563c5`.
- `SystemConfigs.about_story_content` CAS update after hash: `0a77adfcc61605ebb26d7b4005431d2ac0d493b2e64c3b4ea2254bc8a02543c3`.
- Full per-object source/rendition hashes and URLs: `responsive-renditions-report.json` in this directory.

## Candidate verification

Against the rebuilt local production bundle on mobile 390×844, `/` and `/history` returned HTTP 200, page errors were empty, and full axe WCAG 2A/2AA runs returned zero violations. The viewport is `width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover, user-scalable=yes`.

The browser selected `oria_spa_location_pin-w960.webp`, `dong_khoi_corner-w640.webp`, and chatbot `chatbot-icon-128.webp` for the homepage at this device size. History stage requests selected `w960` while thumbnails selected `w320`; scrolling the thumbnail into view caused the `w320` request and returned HTTP 200. The local chatbot response was `image/webp` with `public, max-age=31536000, immutable`.

The read-only candidate route matrix covered 64 cases: 3 viewport classes (390/768/1440), 5 locales, four public/checkout paths, plus four extra route checks. All returned expected status, zero page errors, no horizontal overflow, and zero broken visible images. Detailed matrix evidence is at `/private/tmp/oria-go-live-browser/results.json`.

## Deferred / required after merge

- The exact PSI report must be rerun on the production deployment. This worktree cannot claim a live PSI improvement before the branch is merged and Vercel builds `master`.
- No ffmpeg/encoder was available in the environment, so the original configured Hero MP4 was preserved and only poster-first delivery/fallback was implemented. A separate trace-backed video rendition can be evaluated after measuring the live candidate.
- Main-thread, forced-reflow, render-blocking, legacy-JS, and animation work remains deferred until a CPU/network trace identifies the responsible code. The screenshots alone do not identify safe source-level changes.
- Remaining PNGs outside the requested chatbot/history/OurStory media scope were intentionally preserved.
