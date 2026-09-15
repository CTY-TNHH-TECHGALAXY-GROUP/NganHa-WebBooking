# Handoff D/F — Accessibility, fonts and CSS delivery

Date: 2026-09-15 (Asia/Ho_Chi_Minh)

## Provenance

- Role: D/F (a11y + font evidence)
- Base SHA: `c964977ca2af3081248c902a626612c4b11722af`
- Branch: `codex/ps-reaccept-d-f-20260915`
- Worktree: `/private/tmp/nganha-pagespeed-role-df`
- Tested candidate SHA: `c964977ca2af3081248c902a626612c4b11722af` (before this handoff commit)
- Server: `http://127.0.0.1:3312`, Next production server from this worktree
- Browser: Chromium 149.0.7827.55, Playwright 1.61.1, axe-core 4.11.1

## Scope and changes

Only D/F test/evidence scope changed:

- Added `scripts/test-font-delivery.mjs`, a rerunnable five-locale font matrix with nested Playwright viewport, font-face/check/resource/duplicate-request capture, layout-shift observation and explicit zoom/pinch/license dispositions.
- Re-recorded `raw-axe-candidate-20260915.json` on this SHA using the existing a11y runner; the historical `raw-axe-after.json` was preserved unchanged; no application component/layout/font declaration was changed.
- Added the 768px supplemental raw run and manual interaction/zoom evidence.
- No production DB, Storage, remote branch, deployment or application behavior was changed.

## Commands and outcomes

1. `npm ci --ignore-scripts` — exit 0.
2. `npm run build` with the existing local environment file loaded (read-only build-time Supabase reads) — exit 0; Next 15.5.14 generated 70 static pages. A build without environment/network access failed at `next/font` fetch and missing Supabase settings; this is an environment dependency, not treated as a passing build.
3. `TEST_BASE_URL=http://127.0.0.1:3312 node scripts/test-agent-d-accessibility.mjs` — exit 0 for the runner's confirmed-failure policy; 24 route/viewport cases, 0 confirmed axe violations, 1,357 incomplete node occurrences, rules `color-contrast` and `no-autoplay-audio`. Output was retained as versioned `raw-axe-candidate-20260915.json`.
   - Dimensions asserted by raw axe: 390x844 DPR2 and 1440x900 DPR1. The old suite does not replace the 768 supplement.
4. 768 supplement (`/en`, nested `viewport:{width:768,height:1024}`, DPR2) — 0 violations, 114 incomplete nodes; raw `testEnvironment` and page dimensions match.
5. `TEST_BASE_URL=http://127.0.0.1:3312 TEST_SHA=c964977ca2af3081248c902a626612c4b11722af node scripts/test-font-delivery.mjs` — exit 0; vi/en/cn/jp/kr all HTTP 200, 390x844 DPR2, no duplicate font resource URLs, CLS samples 0–0.00356.
6. Manual smoke (390x844 DPR2) — menu opens and explicit close works, but Escape does not close menu and focus returns to BODY; QR explicit/Escape close passed in this state. Chat trigger was not visible in the captured state (footer visibility hides it), so chat keyboard behavior remains unverified. Checkout received 20 Tab steps without submitting a booking.
7. `git diff --check` — exit 0.

## Gate disposition

| Gate | Result | Evidence / reason |
| --- | --- | --- |
| Build on candidate | PASS | Build output recorded above; requires local env and network for `next/font`. |
| axe WCAG 2.1 A/AA, tested viewports | PASS for confirmed violations; OPEN for incompletes | 0 confirmed violations; raw incomplete nodes retained and not silently promoted. |
| Viewport/DPR | PASS | 390x844/DPR2, 768x1024/DPR2 supplement, 1440x900/DPR1. |
| Contrast adjudication | NOT VERIFIED | axe reports overlap/pseudo-element `color-contrast` incompletes; no pixel/composited background adjudication was performed. |
| Manual keyboard menu/chat/QR/checkout | FAIL/NOT VERIFIED | Menu Escape failed; focus-return failed. Chat trigger unavailable in captured state. QR and checkout smoke evidence retained. |
| Zoom 200%/500% | NOT VERIFIED | No real browser zoom/device capture; viewport meta permits zoom. |
| Pinch gesture | NOT VERIFIED | No physical iOS/Android device was available. |
| Font family/weight/glyph | PARTIAL | Five locale routes returned 200; Inter 400 and Cinzel 700 checks true. Playfair 700 check was false in each sampled page, requiring consumer/weight follow-up. Glyph visual review is not a substitute for this raw check. |
| FOUC/CLS/duplicate requests | PARTIAL | CLS observed at 0–0.00356 and no duplicate font URLs; FOUC visual first-paint and license proof remain NOT VERIFIED. |
| Legacy/minify/license | NOT VERIFIED | No license reference for remote Google responses/public font files was found in this scoped pass; no legacy compatibility code was removed. |

## Residuals and dependencies

- Owner D/integrator: resolve menu Escape/focus-return behavior or transfer Header ownership before changing `Header.tsx`; this role did not modify shared Header code.
- Owner D/QA with physical device: run 200%/500% browser zoom and real pinch on iOS/Android, including model/OS/browser and screenshots.
- Owner D/QA: manually adjudicate every `color-contrast` incomplete with composited background/pseudo-element colors; do not convert 1,357 occurrences into a violation count or a PASS claim.
- Owner F/integrator: explain or load the missing Playfair 700 consumer/face, then re-run the font matrix on the final integrated SHA. Verify glyphs and first-paint/FOUC screenshots for all five locales.
- Owner F/QA: provide a durable font license reference and decide whether legacy compatibility code is required for supported Safari/iOS before any removal.
- No claim of full D/F acceptance or site-wide APPROVED status is made from this handoff.

## Rollback / safety

The only code addition is the standalone audit script. Revert the scoped commit to remove it and the scoped evidence; existing application behavior and assets are untouched. Raw evidence is immutable by SHA/hash in `evidence-index.json`; earlier evidence was not deleted or rewritten outside the owned `agent-d` files.
