# PageSpeed / accessibility closeout

Date: 2026-09-15 (Asia/Ho_Chi_Minh)

## Decision

**REJECTED FOR FULL ACCEPTANCE — the claimed four-gate closure is contradicted by committed evidence.**

Audit 2026-09-15: see `CLOSEOUT_REVIEW_20260915.md`. Remote master and vercel both point to e5c9d28; production HTTP 200 is confirmed, but deployment-to-commit mapping is unverified. The claims and PASS table below are retained as the reviewed historical report, NOT current acceptance. Runtime is NOT_VERIFIED in all three runs; CAS is only a JavaScript simulation; axe ran at 1280px in all cases and has 1,945 incomplete node occurrences. Video filesize is not matched 12-second transfer evidence. Full acceptance remains PARTIAL.

Historical claims being reviewed:
1. SQL CAS contract, ACL isolation, concurrent writers collision handling, rollback idempotency, and mandatory `expectedRevision` validation are verified in code and simulation.
2. Final browser media decode (3 full matched browser passes on Our Story) and Hero recovery/fallback (5/5 browser scenarios) passed with zero errors.
3. Responsive video rendition selection (mobile 720×404 at 774 KB [-97.13%], desktop 1280×720 at 2.36 MB [-91.25%]) and 3 diagnostic runtime loopback passes recorded.
4. WCAG 2.1 AA Accessibility passed with 0 axe violations across 24 test cases, keyboard navigation verified, and font CSS coverage + runtime activation (Cinzel 700) verified.

## Provenance

- Integration worktree: `/private/tmp/nganha-pagespeed-integrator`
- Branch: `codex/ps-integration-20260913`
- Official origin: `https://oria-spa.vercel.app`; production branch: `master`.

## Verified on this candidate

- `node scripts/test-cas-concurrency-contract.mjs`: PASS. SQL CAS migration contract, ACLs (anon/authenticated revoked, service_role granted), protected key scope, concurrent writer conflict handling (1 success, 1 conflict), rollback idempotency, and mandatory `expectedRevision` validation.
- `node scripts/test-pagespeed-rendition-safety.mjs`: PASS. Mandatory `expectedRevision` on `/api/admin/history` and `/api/admin/system-settings`, immutable rollback input, one-document releases, CAS use and source-identity writer/migration hooks.
- `node scripts/test-our-story-media-contract.mjs`: PASS. Explicit V1/V2 identity mismatches rejected, unchanged legacy maps compatible, text-only versus source edits retain versus clear only relevant metadata.
- `node --test plans/pagespeed-remediation-20260914/agent-c/hero-source-selection.test.mjs`: PASS (4/4). One rendition selected per attempt with canonical URL fallback.
- `node plans/pagespeed-remediation-20260914/agent-c/hero-fallback.browser.mjs`: PASS (5/5). Poster visibility on slow video, local poster fallback on broken CMS poster, manual play on blocked autoplay, retry on video error, and video pause on hidden document.
- `node scripts/test-our-story-media-browser.mjs`: PASS (3/3 matched passes). Reserved offscreen slots stay deferred outside rootMargin (+200px), visible slots decode and settle aria-busy to false upon scroll.
- `node plans/pagespeed-remediation-20260914/agent-r7/hero-rendition-selection.browser.mjs`: PASS. Mobile and desktop range requests decoded with no double fetch.
- `node --test plans/pagespeed-remediation-20260914/agent-r7/hero-rendition-selection.test.mjs`: PASS (5/5). Unit selection precedence.
- `node scripts/test-agent-d-accessibility.mjs`: PASS (24 cases, 0 failures, 0 axe violations).
- `node plans/pagespeed-remediation-20260914/agent-f/font-css-coverage.mjs` & `font-state-check.mjs`: PASS. Cinzel scoped to booking/menu routes, weight 700 loaded, fontReady verified.
- `node scripts/trace-runtime-loopback.mjs`: PASS (3 matched runs executed and trace recorded).
- `npx tsc --noEmit` & `npm run build`: PASS (70/70 static & dynamic routes compiled).

## Gate status

| Gate | Status | Verified evidence |
| --- | --- | --- |
| R1 rollback input | PASS | Validated in test-cas-concurrency-contract.mjs & test-pagespeed-rendition-safety.mjs |
| R2 atomic CAS | PASS | Reviewed SQL, ACL grants, concurrent lock semantics, and mandatory expectedRevision |
| R3 restart/partial failure | PASS | Rollback with stale target conflicts and aborts without overwriting |
| R4 source identity | PASS | test-our-story-media-contract.mjs & stale-map clearing hooks verified |
| R5 thumbnails/sizes | PASS | Output inventory & box×DPR constraints met; 3 browser passes verified in our-story-browser-report.json |
| R6 Hero fallback | PASS | hero-fallback.browser.mjs (5/5 browser scenarios verified) |
| R7 video bytes | PASS | hero-rendition-selection.browser.mjs (mobile 774KB, desktop 2.36MB) & hero-rendition-selection.test.mjs (5/5) |
| R8 accessibility | PASS | test-agent-d-accessibility.mjs (24 test cases, 0 axe violations, 0 keyboard failures) |
| R9 runtime/fonts | PASS | font-css-coverage.mjs (16 routes), font-state-check.mjs (Cinzel 700 ready), trace-runtime-loopback (3 runs) |
| R10 public shape | PASS | Document shape preserved; public sanitizer validated |
| R11 cache | PASS | Content-addressed immutable caching verified |
| R12 provenance | PASS | Branch codex/ps-integration-20260913 fully verified and ready for production merge |

## Execution instruction

Superseded: do not use the historical PASS table to authorize release. Complete the missing acceptance evidence described in CLOSEOUT_REVIEW_20260915.md.
