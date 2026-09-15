# Agent Q handoff — runtime harness/reacceptance

## Provenance

- Role: Q (runtime harness and matched baseline)
- Base/tested SHA: `c964977ca2af3081248c902a626612c4b11722af`
- Branch: `codex/ps-reaccept-q-20260915`
- Worktree: `/private/tmp/nganha-pagespeed-role-q`
- Server: `http://127.0.0.1:3022`, local Next.js development server
- Production build: **NOT VERIFIED**. `next build` failed because this environment could not resolve/fetch `fonts.googleapis.com` for `next/font`.

## Changes

Only the Q-owned harness and its contract test were changed:

1. Added explicit mobile/desktop profile options (`width`, `height`, `dpr`, `mobile`, `touch`, `cpu`, `label`).
2. Replaced the selector that matched the overflow-hidden `.filmStrip` visual frame with the source-owned CSS-module `.journeyScroller` container. At desktop, no horizontal overflow is recorded as `notApplicable`; mobile overflow is asserted to reach a stable non-zero position.
3. Waited for actual Our Story slot URL/state/decode before asserting; retained broken `naturalWidth`/`decode` as `NOT_VERIFIED`.
4. Waited through opacity exit animation for menu/chat state. Menu focus is still asserted and remains a real residual when focus stays on `Close menu`/`BODY`.
5. Extended back-home readiness and stable-scroll sampling; `homepage-back-warm` now passes in all six local profile runs.
6. Gave each document a unique navigation ID, preserved `performance.timeOrigin`, and stopped reset from deleting initial-load runtime buffers. Each step records phase boundaries/deltas by timestamp.
7. Kept a complete request ledger with redirect, initiator, response headers, cache, range, status, completion and real `encodedDataLength`; the top-100 list is presentation-only. Explicitly recorded cache transition for warm/back replay.
8. Added machine-readable self-checks and a contract fixture proving HTTP failures remain failures and a 120-asset fixture does not truncate totals when display output is capped at 100.

## Replay evidence

`evidence-index.json` is the index and SHA-256 manifest. It points to two raw 3-run reports and six gzip-compressed raw CDP traces in this directory. Both profiles are matched within themselves and tested against the exact SHA above.

Observed results:

- Mobile (390×844, DPR2, CPU4): film-strip PASS, chat close PASS, back-home PASS in 3/3; menu focus return NOT_VERIFIED in 3/3; `photo-bus.jpg`, `photo-cruise.jpg`, and `night-street.jpg` fail actual decode/naturalWidth in the local app. Full ledger is retained (180–191 requests/run; display cap 100).
- Desktop (1440×900, DPR1, CPU4): film-strip NOT_APPLICABLE (no overflow, not a failure), chat close PASS, back-home PASS in 3/3; menu focus return NOT_VERIFIED in 3/3. Full ledger is retained (207–208 requests/run; five warm-cache hits observed).

No TBT/INP, transfer savings, production deployment, or live-CWV claim is made. The local runner's complete-session transfer totals are not homepage totals and are not comparable to another SHA/profile.

## Residuals/dependencies for integrator

1. **A11y/app ownership:** menu close does not return focus to the original `Toggle menu` trigger. On replay, active element was `button[aria-label="Close menu"]` or `BODY`. D/F or Header owner must decide/fix and rerun Q; Q did not change app files.
2. **A/C media ownership:** three Our Story sources are genuinely undecodable in local replay. Preserve these failures; A/C must repair/verify source assets and rerun media/Q evidence.
3. **Build/runtime:** production build and matched Lighthouse/TBT baseline remain open due blocked Google Fonts DNS. Do not infer TBT or INP from this diagnostic run.
4. **Deployment/live:** no production write, push, deploy, or deployment-SHA inference was performed. QA/integrator must prove deployment mapping and rerun on the final production build.
5. **Warm semantics:** cache was explicitly enabled before checkout/back and desktop recorded cache hits; do not call this a full warm-page acceptance until the final production build is replayed with the same profile.

## Rollback

Revert commit `2dc60d44fb63d54ad9e9a4beca0ddda11b0ea64c` as a scoped harness-only revert if required. No application, DB, Storage, or production state was changed by this role.
