# Role QA handoff — independent candidate closeout

Date: 2026-09-15 (Asia/Ho_Chi_Minh)

## Scope and provenance

- Role: QA / independent integration and release-readiness audit.
- Base provenance: `c964977ca2af3081248c902a626612c4b11722af` (integrator audit boundary).
- Tested candidate SHA **before this QA-only commit**: `3a98d898fe23ca3cae69c8e85b3d85acc8f22076`.
- Worktree/branch: `/private/tmp/nganha-pagespeed-role-qa` / `codex/ps-reaccept-qa-20260915`.
- QA-only changes: `scripts/test-pagespeed-qa-closeout.mjs` and evidence under `plans/pagespeed-remediation-20260913/remaining/agent-qa/`.
- No application source, DB, Storage, Vercel setting, push, merge, or deploy was changed by QA.
- The QA commit changes the evidence/script only; it is not a new app candidate and must not replace the tested candidate SHA in release reporting.

## Commands and outcomes

| Command / activity | Exit | Outcome |
| --- | ---: | --- |
| `git diff --check` | 0 | QA-only worktree has no whitespace errors. |
| `npx tsc --noEmit` | 0 | Candidate typecheck passed. |
| `npm run lint` | 0 | Passed with existing warnings; no lint error. |
| `npm run build` (sandbox) | 1 | DNS blocked `fonts.googleapis.com`; no source change. |
| `npm run build` (approved network retry) | 0 | Next 15.5.14 production build; 70 static pages; `.next/BUILD_ID` captured. |
| `node scripts/test-pagespeed-rendition-safety.mjs` | 0 | Source/migration safety contract passed. |
| `node scripts/test-cas-concurrency-contract.mjs` | 0 | Source contract only; explicitly not a DB acceptance result. |
| `node scripts/test-cas-postgres.mjs --tested-sha=3a98d89...` | 2 | Correct fail-closed `NOT_VERIFIED`: no disposable PostgreSQL URL/server. |
| `node scripts/test-our-story-media-contract.mjs` | 0 | Consumer identity/load contract passed. |
| `node scripts/test-media-rendition-budgets.mjs` | 0 | 23 originals × 69 local candidates; local budget passed; storage/live currentSrc NOT_VERIFIED. |
| `node --test plans/pagespeed-remediation-20260914/agent-c/hero-source-selection.test.mjs` | 0 | 4/4 source-selection assertions passed. |
| `node scripts/test-trace-runtime-loopback-contract.mjs` | 0 | Runtime harness self-check passed after loopback permission escalation. |
| `TEST_BASE_URL=http://127.0.0.1:3377 node scripts/test-our-story-media-browser-ac.mjs` | 0 | Candidate production server: mobile cold ×2, desktop cold, IO-absent = 4/4 `PASS_LOCAL_BROWSER`. |
| `QA_BASE_URL=http://127.0.0.1:3377 node scripts/test-pagespeed-qa-closeout.mjs` | 0 | 65 route probes, 47 local sitemap entries, browser/menu/cart/chat/cache/MIME evidence. |

## Route and deployment audit

`route-matrix-20260915.csv` is generated from App Router files, `src/lib/seo/routes.ts`, and the candidate server's `/sitemap.xml`. It records 65 concrete paths, including 47 sitemap paths, final URL, initial/final status, content type, cache-control, and canonical.

Important observed results:

- Public representative pages and all five locale roots/selected localized pages returned local HTTP 200.
- `/en/new-user/select-menu` returns a redirect whose final URL is `/en/pure-relaxation`; this behavior is recorded, not silently counted as a standalone menu page.
- `/en/history` returned 404 because History is not a localized App Router page/sitemap entry; preserve as a route-inventory residual for product decision.
- `/admin/login` is classified admin and returned 200; `/api/services` is classified API and returned JSON 200; `/public/flipmenu/index.html` and `/nonexistent` are classified demo/negative and returned 404. These are not public-page PASS counts.
- Hashed chatbot WebP assets returned HTTP 200, `image/webp`, and `public, max-age=31536000, immutable` locally. This is local candidate evidence only.
- Local canonical HTML points to `https://oria-spa.vercel.app`; official alias/project/deployment SHA mapping remains **NOT_VERIFIED**.

No claim is made that an HTTP 200 response identifies a Vercel deployment SHA. No live deployment mapping or production read-back was attempted.

## Final QA gate table

| Gate | Disposition | Evidence / residual |
| --- | --- | --- |
| Candidate provenance | PASS | Exact pre-QA tested SHA `3a98d89`; all worker handoffs must still be checked for SHA mismatch. |
| Typecheck/lint/build | PASS with warning/environment note | Typecheck/lint/build exit codes above; build required approved network for Google Fonts. |
| Route inventory | PASS local | Router + SEO source + sitemap captured; public/admin/API/demo separated. |
| Cache/MIME/canonical | PARTIAL local | Hashed WebP local headers pass; official live alias/deployment mapping NOT_VERIFIED. |
| Media browser/decode | PASS_LOCAL | Four independent candidate loopback profiles pass; no production transfer claim. |
| Menu/cart/locale/checkout regression | FAIL / PARTIAL | Cart opens empty; menu Escape/close behavior FAIL in both profiles; chat Escape FAIL in both; route/checkout probes are read-only. |
| SQL CAS/ACL/concurrency/rollback | NOT_VERIFIED | Real runner exit 2 with no disposable PostgreSQL URL/server; no simulation accepted. |
| Runtime attribution/TBT | NOT_VERIFIED | No matched production-build baseline/candidate TBT or component attribution; existing Q raw evidence is stale/partial. |
| Accessibility manual/device | NOT_VERIFIED | D/F handoff records Escape/focus failure, contrast incomplete, zoom/pinch/license gaps and Playfair 700 unresolved; evidence is not promoted to candidate PASS. |
| Hero 12-second transfer | NOT_VERIFIED | Local source-selection/fallback only; no matched CDP transferred-byte runs for active published renditions. |
| Production deployment SHA/alias | NOT_VERIFIED | No Vercel project/deployment mapping or live read-back; HTTP 200 alone is insufficient. |

## Residuals and dependencies

1. Do not mark the overall closeout `APPROVED`: menu/chat regressions are reproducible failures and required SQL/runtime/a11y/media/deployment gates remain open.
2. Worker evidence provenance is not uniform: B/D/F/Q evidence mostly tests `c964977`; A/C evidence tests `f266c8e`; QA local replay alone tests `3a98d89`. Integrator must replay required evidence after final candidate freeze.
3. Real PostgreSQL CAS/ACL/two-transaction race/read-back and migration crash/restart/resume/rerun/rollback remain open.
4. Matched Hero 12-second transfer reduction is not demonstrated; local file sizes are not network transfer proof and no Storage read-back was performed.
5. Runtime TBT target/attribution and production Lighthouse/PSI are not verified. Synthetic traces must not be relabeled as field INP.
6. Manual accessibility residuals remain: menu Escape/focus return failure, chat keyboard unavailable/failure, contrast incomplete adjudication, zoom 200/500, physical pinch, font license/FOUC/glyph coverage and Playfair 700 check.
7. Official Vercel project/deployment/SHA/alias mapping, production RPC dependency, canonical/cache/MIME live read-back, and live route regression require integrator/authorized operator access.

## Rollback and ownership

This handoff contains no application or data mutation. Revert the QA commit to remove only the QA script/evidence. The integrator owns any cherry-pick decision and must not merge QA artifacts as application behavior. No production writes, push, merge, or deploy were performed.
