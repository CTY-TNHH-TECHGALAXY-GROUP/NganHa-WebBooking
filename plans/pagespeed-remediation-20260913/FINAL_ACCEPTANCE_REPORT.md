# PageSpeed / accessibility closeout

Date: 2026-09-14 (Asia/Ho_Chi_Minh)

## Decision

**PARTIAL — production release blocked.** The integration candidate has local media gating, cache scoping, accessibility semantics, and protected-config safety changes. Database CAS application/ACL, Hero byte reduction, stable runtime attribution, manual accessibility, and live production verification remain open.

## Provenance

- Integration worktree: `/private/tmp/nganha-pagespeed-integrator`
- Branch: `codex/ps-integration-20260913`
- Tested integration SHA: `cd69beecdd7778dd8020a34eb5f5557913304678`
- Parent candidate: `c921e9ad43ab8c2093af729b839fe43ddb792979`
- B source commit: `9183a9314a21b7dd7ef4dab3e3439362cc99ded3` (integrated)
- Official origin: `https://oria-spa.vercel.app`; production branch: `master` (user-confirmed)
- No push, deploy, redirect, Vercel setting, Supabase setting, Storage write, or production DB write was performed in this closeout.

## Verified on this SHA

- `node scripts/test-pagespeed-rendition-safety.mjs`: PASS. The local fixture covers immutable rollback input, one-config apply/rollback gating, durable private backup checks, and protected History/Our Story RPC contract.
- `npx tsc --noEmit`: PASS.
- `node --check scripts/migrate-pagespeed-renditions.mjs`: PASS.
- History loopback (`127.0.0.1:3312/history`): HTTP 200; active/next source eligibility, inactive placeholders, lazy thumbnails, and stage candidate assertions PASS in one run. This is not a three-run matched bandwidth result.
- Accessibility loopback: 24 route/viewport cases HTTP 200, no page errors, 0 axe violations. There are 36 incomplete nodes, chiefly `color-contrast` and `no-autoplay-audio`; manual device zoom, contrast adjudication, focus return, and Escape behavior remain unverified.
- Local cache headers: content-hash WebP `public, max-age=31536000, immutable`; unhashed WebP `max-age=0`; HTML `private, no-cache, no-store`.

## Gate status

| Gate | Status | Required next evidence |
|---|---|---|
| R1 rollback input | PASS local / NOT VERIFIED DB | Disposable DB rollback and read-back |
| R2 atomic CAS | PARTIAL | Apply reviewed SQL, ACL and concurrent stale-writer test |
| R3 restart/partial failure | PARTIAL | Crash/resume/rerun/rollback with durable private backup |
| R4 source identity | NOT VERIFIED | Admin source V1→V2 invalidation and legacy fallback |
| R5 thumbnails/sizes | OPEN | Box×DPR descriptors, no-upscale and byte/visual budgets |
| R6 Hero fallback | PASS local / live open | Replay final candidate and live failure/retry cases |
| R7 video bytes | NOT VERIFIED | Encoder, versioned renditions, matched 12s transfer runs |
| R8 accessibility | PARTIAL | Resolve incomplete findings and real-device keyboard/zoom |
| R9 runtime/fonts | NOT VERIFIED | Q full phase trace, source attribution, font/glyph/CLS matrix |
| R10 public shape | PASS local / live open | Legacy/object/empty replay and live consumer check |
| R11 cache | PASS local / live open | CDN MIME/cache and V1→V2 revalidation |
| R12 provenance | PARTIAL | Final tested/deployed SHA and durable evidence index |

## Explicit non-results

- Q closed with `NOT VERIFIED` and no commit. The existing harness still cuts requests before summary, omits Media/range totals, uses unstable absolute scroll targets, lacks source-backed UI assertions, and has no three-run matched evidence. Do not reuse either historical scroll report or its bandwidth numbers.
- A and C exhausted agent quota before handoff. Their uncommitted worktrees are draft material only and are not part of this SHA. Review from `cd69beec` before any future cherry-pick.
- The active production Hero source remains a roughly 26.97 MB MP4. No approved encoder was available; no mobile/desktop rendition or poster WebP transfer reduction is proven.
- The CAS migration `supabase/migrations/20260914_system_configs_jsonb_cas.sql` has not been applied. RPC ACL, race behavior, remote Storage read-back, crash recovery, and rollback on a disposable database are **NOT VERIFIED**.
- Historical manifests mentioning 75 WebP uploads and 25 references are retained as historical evidence only. They are not a fresh read-back for this SHA and must not be used as current bandwidth proof.
- `npm run build` and earlier local checks do not establish browser, live, PSI, CrUX, or INP acceptance.

## Release rule

Do not push `master` or deploy until the DB CAS gate, A media identity/decode gate, C transfer gate, D manual accessibility gate, and Q/E attribution gate have evidence. If the user later authorizes a P0 partial release, record each open gate and verify the deployment SHA/alias `oria-spa.vercel.app`, every public/locale route, canonical path, WebP MIME/cache, menu/cart/checkout read-only behavior, and three matched mobile/desktop PSI runs.
