# Video loading browser verification

Tested locally with Playwright Chromium, on an isolated Next dev server at port 3123.
This is not production acceptance. The workspace contains concurrent unrelated edits.

## Results

| Scenario | Observed result |
| --- | --- |
| Desktop 1440x900, / | HTTP 200, no page errors, one mounted hero video, playing with readyState 4 |
| Mobile viewport 390x844, /vi | HTTP 200, no page errors, playing with readyState 4, no horizontal overflow |
| Video request blocked | Error screen and retry button displayed; page remains HTTP 200 |
| Retry after restoring video access | Video plays and error/loading screen disappears |
| Client config requests | Zero /api/hero-videos requests in all tested scenarios |
| Default media requests | Zero local default-video requests in tested scenarios; only configured Supabase video URL observed |

Desktop and mobile screenshots were visually inspected. Raw results are in browser-results.json.
Repeated requests to the configured URL were observed; request counts alone do not establish duplicate full downloads.

## Remaining issues and limits

- Vietnamese loading/error copy is unaccented and should be corrected.
- No compressed or fast-start replacement was generated or deployed.
- No before/after first-frame timing benchmark was performed.
- Safari/iPhone hardware, autoplay-denied, config-empty/error, slow config, slow media, and carousel transitions remain unverified.
- Initial production-mode local test returned 500 with incompatible .next artifacts. Isolated dev tests above passed; production-mode runtime needs a separate isolated build test.
- Earlier TypeScript/build passes belong to the preceding implementation checkpoint, not a frozen snapshot of this concurrently edited workspace.

No booking submission, production config change, commit, or push was performed during this test.
