# Agent E handoff — runtime/reflow attribution and scoped History fix

## Provenance

- Role: E (runtime/reflow/animation)
- Base SHA: `0b44ad0505aba9946c9e3531770ff5c16339fe24`
- Branch: `codex/ps-reaccept-e-20260915`
- Worktree: `/private/tmp/nganha-pagespeed-role-e`
- Commit SHA: emitted with this handoff after the scoped commit is created
- Candidate tested before commit: `0b44ad0505aba9946c9e3531770ff5c16339fe24` with the working-tree patch described below
- Runtime server: `http://127.0.0.1:3023`, Next.js development server, Next.js `15.5.14`
- Production build: **NOT VERIFIED**. The available environment could not resolve/fetch `fonts.googleapis.com`; no production TBT/Lighthouse claim is made.

## Attribution and change

Q's diagnostic trace mapped the repeated app-owned geometry reads to
`History.useEffect.updateActiveChapter` (`History.tsx`, pre-change source lines
915–917): every scroll rAF measured every chapter and the timeline with
`getBoundingClientRect()`. The pre-change diagnostic recorded 184 such
History-owned calls in one matched mobile run. No trace assigned a costly task
to FloatingWidgets or an animation declaration, so those files and History
animation CSS were left untouched.

`src/components/History/History.tsx` now:

1. Captures chapter/timeline geometry in one read batch as document-space
   coordinates.
2. Uses `window.scrollY` and the cached coordinates for each scroll rAF, while
   preserving the existing 0.52 viewport anchor and nav visibility thresholds.
3. Invalidates the cache on `ResizeObserver`, window resize, and
   `document.fonts.ready`; cancels the rAF and disconnects the observer on
   unmount.

No animation was removed, no blanket `will-change` was added, and no Hero,
OurStory, FloatingWidgets, font, accessibility, DB, Storage, or production
configuration file was changed.

## Verification

Commands and results:

- `npx tsc --noEmit` — exit 0.
- `node --check scripts/trace-runtime-loopback.mjs` — exit 0.
- `node scripts/test-trace-runtime-loopback-contract.mjs` — exit 0 (to be
  recorded by the integrator if dependencies are not available in its
  worktree).
- Q timing runner, 3 matched mobile runs, 390×844, DPR2, touch, CPU4×,
  `mode=timing` — exit 0, report status **NOT_VERIFIED**.
- Q timing runner, 3 matched desktop runs, 1440×900, DPR1, no touch, CPU4×,
  `mode=timing` — exit 0, report status **NOT_VERIFIED**.
- Q diagnostic runner, one mobile run, 390×844, DPR2, touch, CPU4× — exit 0,
  report status **NOT_VERIFIED**; after patch no `History.tsx` stack appeared
  in runtime-phase geometry reads.
- `git diff --check` — exit 0.

The after-run application residuals remain explicit in every report:

- Our Story slots 3, 4, and 7 fail visible image naturalWidth/decode in the
  local fixture.
- Menu close does not return focus to the original `Toggle menu` trigger.
- The dev fixture emits existing SEO/Supabase fallback errors.

These are not E-owned and were not changed or recast as PASS.

## Measured comparison (diagnostic only)

The source-state hashes are recorded in `evidence-index.json` because Git's
`testedSha` remains the same for the pre-commit working tree:

- Pre-change `History.tsx` blob: `998eb31e5897092a165b2b5534a7ae7c50e7e0636306a0af75075dec232e0871`
- Post-change `History.tsx`: `a5616a805a15db4ff2faa9b4c3a3c97324f6e31d1dd0f46ac94e475a1e983ec8`
- Pre-change diagnostic: 184 History-owned geometry calls in runtime phases.
- Post-change diagnostic: 0 History-owned geometry calls in runtime phases;
  348 total calls were harness assertions and one unrelated app call.

The matched timing reports are diagnostic loopback evidence, not Lighthouse
TBT. Mobile all-session long-task sums were 2581/2177/2760 ms after the patch
(median 2581 ms); the synthetic `max(duration−50)` proxy was 781/577/860 ms
(median 781 ms). History-phase sums were 2404/2045/2626 ms (median 2404 ms),
versus the referenced c964977 baseline 2924/1928/3300 ms (median 2924 ms).
Desktop after sums were 2160/2336/2625 ms (median 2336 ms), versus baseline
2654/2193/1419 ms (median 2193 ms). Because this is a development server and
the session includes checkout, it does not close the production TBT gate;
the desktop result is not a proven improvement.

## Gate disposition

- Runtime attribution: **PASS for the scoped History geometry-read finding**.
- Runtime behavior/History cycle replay: **PASS** in the after-run steps that
  reached History; no History-cycle step failed.
- Production TBT target (≤200 ms or ≥30% reduction): **NOT VERIFIED**.
- Full Q matched acceptance: **NOT VERIFIED** due the residuals above and no
  production build.
- Production deployment/live CWV: **NOT VERIFIED**; no push/deploy or live
  write was performed.

## Ownership, residuals, and rollback

- Integrator must resolve the small `History.tsx` cherry-pick overlap with
  A/C's `f266c8e` motion-fallback changes semantically; do not take one side
  wholesale. E owns only the geometry block added in this commit.
- A/C owns the three media decode failures. D/F (or Header owner) owns menu
  focus return. QA/integrator owns production-build and deployment replay.
- Scoped rollback: `git revert <E commit SHA>` removes only this History
  geometry-cache change and its evidence; do not reset or overwrite other
  worktrees.
- No DB/Storage/production state was changed.
