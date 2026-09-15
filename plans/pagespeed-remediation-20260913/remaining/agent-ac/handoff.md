# Role A/C handoff — media consumers, thumbnails, Hero

## Decision

**LOCAL A/C ACCEPTANCE PASS; production release evidence remains incomplete.**
The consumer contract, local thumbnail budget matrix, Hero fallback/recovery, and
the loopback Our Story browser matrix pass at the committed implementation SHA.
Storage read-back, active CMS rendition publication, and matched 12-second live
transfer remain **NOT_VERIFIED**. No production write, push, merge, or deploy was
performed by this role.

## Provenance

- Worktree: `/private/tmp/nganha-pagespeed-role-ac`
- Branch: `codex/ps-reaccept-a-c-20260915`
- Base SHA: `c964977ca2af3081248c902a626612c4b11722af`
- Implementation commit: `f266c8ed9d4a18db39c0d9dbf093d42288d9928a`
- Evidence `testedSha`: `f266c8ed9d4a18db39c0d9dbf093d42288d9928a`
- No `git push`, production DB/Storage mutation, merge, or deploy was run.

## Scoped implementation

- `src/lib/media/responsiveSources.ts`: stable identity pairing for History and
  Our Story reorder/source replacement, plus a deterministic box × DPR candidate
  selector that reports undersized maps instead of silently claiming coverage.
- `src/components/OurStory/OurStory.tsx`: source-generation guard, stale decode
  invalidation, image remount on responsive/original fallback, and safe no-IO
  motion behavior.
- `src/components/History/History.tsx`: safe no-IO motion behavior.
- `src/components/Hero/Hero.tsx` and
  `src/components/FloatingWidgets/FloatingWidgets.tsx`: use a callable
  `IntersectionObserver` check so `undefined` does not throw in no-IO browsers.
- `scripts/test-our-story-media-contract.mjs`: identity, reorder, source
  replacement, candidate-budget, and stale-decode assertions.
- `scripts/test-our-story-media-browser.mjs` and
  `scripts/test-our-story-media-browser-ac.mjs`: production-build browser
  harnesses using real DOM targets; no `page.setContent` reimplementation.
- `scripts/test-media-rendition-budgets.mjs`: local-only Sharp candidate audit;
  it never uploads or edits CMS/manifest data.

## Evidence at the exact SHA

| Gate | Command/result | Evidence |
|---|---|---|
| Consumer identity/load contract | `node scripts/test-our-story-media-contract.mjs` — PASS | Contract assertions in implementation commit |
| Hero source selection | `node --test plans/pagespeed-remediation-20260914/agent-c/hero-source-selection.test.mjs` — 4/4 PASS | Existing focused test, hash in `evidence-index.json` |
| Hero fallback/recovery | `HERO_TEST_BASE_URL=http://127.0.0.1:3345 node plans/pagespeed-remediation-20260914/agent-c/hero-fallback.browser.mjs` — 5/5 PASS | Existing focused browser runner, hash in `evidence-index.json` |
| Our Story browser | 390×844 DPR2 cold ×2, 1440×900 DPR1 cold, and IO absent 390×844 DPR2 — 4/4 PASS | `our-story-browser-ac-report.json` |
| Thumbnail local matrix | 23 originals × 3 widths (64/128/192) = 69/69 candidates PASS; viewport 390/768/1440 × DPR1/2/3 | `thumbnail-budget-report.json` |
| Type/build/lint | `npx tsc --noEmit` PASS; `npm run build` PASS (Next 15.5.14, 70 pages); scoped ESLint exit 0 with existing warnings only | Command logs retained in task handoff |

The browser report includes DOM geometry, `currentSrc`, native decode state,
`naturalWidth`, `aria-busy`, request URLs, film-strip preservation, and the
no-IntersectionObserver fallback. Screenshots are captured for all four browser
profiles. The thumbnail report contains input/output hashes, intrinsic sizes,
budget checks, and the full box × DPR selection matrix.

## Explicit residuals / handoff dependencies

1. The 64/128/192 derivatives are disposable local Sharp outputs under
   `/private/tmp/nganha-ac-thumbnail-output`. `storageReadback` and
   `productionAppCurrentSrc` are **NOT_VERIFIED**. B/writer ownership must publish
   versioned objects, read them back by HEAD/GET, and update only the intended
   manifest entries under the approved CAS flow.
2. This role did not claim the required matched 12-second CDP transfer (three
   runs, mobile and desktop) for active Hero renditions. Existing local MP4
   candidate byte sizes are not transfer evidence. The live active config still
   needs B/QA publication and network verification.
3. Identity/reorder behavior is verified by local contract fixtures. A live CMS
   V1→V2 write/read-back and production storage permission check remain outside
   A/C authority.
4. Browser coverage is Chromium loopback only. Safari/iOS playback, official
   domain validation, DB CAS/concurrency/rollback, accessibility, and runtime
   attribution remain other-role gates.

## Reproduction

```text
cd /private/tmp/nganha-pagespeed-role-ac
node scripts/test-our-story-media-contract.mjs
node scripts/test-media-rendition-budgets.mjs
TEST_BASE_URL=http://127.0.0.1:3345 node scripts/test-our-story-media-browser-ac.mjs
node --test plans/pagespeed-remediation-20260914/agent-c/hero-source-selection.test.mjs
HERO_TEST_BASE_URL=http://127.0.0.1:3345 node plans/pagespeed-remediation-20260914/agent-c/hero-fallback.browser.mjs
```

The local `next start` server must be built from the same worktree/SHA. Do not
interpret HTTP 200, local file size, or this local PASS as a production deploy
or a storage/network reduction claim.
