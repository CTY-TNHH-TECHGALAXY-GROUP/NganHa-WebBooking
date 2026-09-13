# History media gating evidence — Agent A

The candidate was served from `http://127.0.0.1:3312` after `npm run build` on the isolated worktree. The test was read-only:

```text
TEST_BASE_URL=http://127.0.0.1:3312 node scripts/test-history-media-gating.mjs
```

The test visited `/history` at 390×844 DPR 2, captured History WebP requests, inspected every stage `<picture>`, then scrolled the last chapter thumbnail into view. It saved the full output to `history-media-gating-report.json`.

All assertions passed:

- Stage `<source>` nodes existed only for active and next eligible scenes before and after scrolling.
- Ineligible stage `<img>` nodes stayed on the one-pixel placeholder and therefore did not initiate scene requests.
- Thumbnails retained `loading="lazy"`.
- The scrolled thumbnail loaded its distinct `-w320.webp` candidate, while stage media selected `-w960.webp`.
- The route returned HTTP 200 and captured 12 unique History rendition requests during the test.

The fix is limited to the stage `responsiveSources` prop in `src/components/History/History.tsx`; the thumbnail path and chapter IntersectionObserver behavior remain unchanged.
