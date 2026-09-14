# PageSpeed / accessibility closeout

Date: 2026-09-14 (Asia/Ho_Chi_Minh)

## Decision

**PARTIAL — production release remains blocked.** This candidate closes local code-contract gaps for one-source Hero selection, media identity and stale-map clearing, plus the loopback measurement harness. It does not prove database behavior, media transfer reduction, manual accessibility, runtime attribution, or production state.

## Provenance

- Integration worktree: `/private/tmp/nganha-pagespeed-integrator`
- Branch: `codex/ps-integration-20260913`
- Tested code SHA: `bf4750a1ab29a4295811bef2e6a7829d287b5b2a`
- Parent candidate: `c921e9ad43ab8c2093af729b839fe43ddb792979`
- Integrated closeout commits: `35b58c1` (Hero source selection), `6b8146f` (Q harness), `8868ffd` (Our Story identity consumer), and `bf4750a` (B writer/migration identity link).
- Official origin: `https://oria-spa.vercel.app`; production branch: `master`.
- No push, deploy, Vercel/Supabase setting change, Storage write, or production DB write was performed.

## Verified locally on this candidate

- `node scripts/test-pagespeed-rendition-safety.mjs`: PASS. Rollback input remains immutable; release runs are one document at a time; CAS use and source-identity writer/migration hooks are present.
- `node scripts/test-our-story-media-contract.mjs`: PASS. Explicit V1/V2 identity mismatches are rejected, unchanged legacy maps remain compatible, and text-only versus source edits retain versus clear only the relevant rendition metadata.
- `node --test plans/pagespeed-remediation-20260914/agent-c/hero-source-selection.test.mjs`: PASS (4/4). A Hero selects and attaches exactly one rendition per attempt with canonical URL fallback.
- `node scripts/test-trace-runtime-loopback-contract.mjs`: PASS. The Q harness keeps all request totals before the capped display list and reports failed HTTP as `NOT_VERIFIED`.
- `npx tsc --noEmit`, `node --check scripts/migrate-pagespeed-renditions.mjs`, and `npm run build`: PASS. The build generated 70 static pages. Build skips lint by project configuration.
- Earlier loopback evidence on the pre-integration SHA was limited but clean: one History gating run passed; 64 read-only locale/viewport cases had no observed errors, overflow, or broken rendered images; axe had zero violations across 24 cases. Those runs are not evidence for this final SHA and are not used for performance, media, or release claims.
- Local header spot checks showed a content-addressed WebP served as `image/webp` with `public, max-age=31536000, immutable`; an unhashed WebP served with `max-age=0`. CDN/live cache behavior is not verified.

## Gate status

| Gate | Status | Required closure evidence |
| --- | --- | --- |
| R1 rollback input | PASS local / NOT VERIFIED DB | Disposable DB rollback and read-back |
| R2 atomic CAS | PARTIAL | Applied reviewed SQL, ACL, stale and concurrent writer tests |
| R3 restart/partial failure | PARTIAL | Crash/resume/rerun/rollback against a disposable DB and durable backup |
| R4 source identity | PARTIAL | Final writer/admin source V1→V2 browser/API replay and migration read-back |
| R5 thumbnails/sizes | OPEN | 64/128/192 output inventory, box×DPR/no-upscale/byte evidence, decode QA |
| R6 Hero fallback | PASS local / live open | Final-candidate retry/error/visibility replay and live check |
| R7 video bytes | PARTIAL | Encoder/versioned upload, three matched 12-second transfer and range runs |
| R8 accessibility | PARTIAL | Resolve/adjudicate incomplete contrast checks; manual keyboard, Escape/focus and real-device zoom/pinch |
| R9 runtime/fonts | PARTIAL | Three final-SHA app runs from Q, source attribution, font/glyph/FOUC/CLS matrix |
| R10 public shape | PASS local / live open | Legacy/object/empty replay and live consumer check |
| R11 cache | PASS local / live open | CDN MIME/cache and V1→V2 revalidation |
| R12 provenance | PARTIAL | Deployment SHA/alias and durable final evidence index after an authorized release |

## Explicit non-results and blockers

- The local disposable PostgreSQL endpoint `127.0.0.1:55439` refused connections. No substitute DB test was claimed; the CAS migration is not applied.
- No approved encoder, versioned Hero uploads, or matched 12-second transfer results exist. The active production source is still historically about 26.97 MB; do not infer savings from local source selection.
- Q’s repaired harness has fixture proof only. It still needs three matched final-candidate app runs before E may make runtime changes or attribution claims.
- The zero-violation axe run had incomplete contrast findings and no real-device pinch verification. It does not close R8.
- Historical manifests mentioning 75 WebP uploads and 25 references are historical only, not a current Storage read-back.

## Release rule

Do not push `master` or deploy this candidate until DB CAS, final media identity/decode, Hero transfer, manual accessibility, and Q/E runtime evidence are available, unless the user explicitly authorizes a documented P0 partial release. Any authorized release must verify the deployed SHA and `oria-spa.vercel.app` alias, route/canonical matrix, WebP MIME/cache, and read-only menu/cart/checkout behavior.
