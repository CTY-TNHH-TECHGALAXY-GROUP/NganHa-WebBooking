# Agent R7 — local Hero video renditions and source-selection proof

Date: 2026-09-14
Base: `15d2356a95497b18a449013fb834e927d75d05cb`
Worktree: `/private/tmp/nganha-agent-r7-final-20260914`
Branch: `codex/ps-final-r7-20260914`

## Scope

This worktree contains only a local rendition builder, a pure source-selection contract harness, browser proof, and this evidence document. It does not change `Hero.tsx`, `heroVideos.ts`, CMS data, Supabase, production URLs, Next configuration, dependencies, deployment, or Vercel settings. The homepage remains on the existing video Hero path.

The existing Hero contract was read from `src/lib/config/heroVideos.ts` and `src/components/Hero/Hero.tsx`. It currently normalizes only `url`/`media_url` plus poster fields and renders one `<video src={activeVideo.url}>`. The read-only active configuration evidence in the integrated Agent C handoff contains one canonical MP4 URL and no mobile/desktop rendition fields. Therefore this turn deliberately stops at proof and contract documentation; it does not add unused CMS fields or attach a second source to the production consumer.

## Reproducible local build

`build-hero-renditions.mjs` accepts a local input only. It rejects HTTP(S) input, uses an explicitly supplied FFmpeg binary, maps the first video and optional audio streams, emits H.264/yuv420p MP4 files with `+faststart`, and writes a JSON manifest containing the encoder version, source/output hashes, bytes, dimensions, and external-action flags. Outputs are written outside the repository by default.

Command run:

```text
HERO_INPUT=/private/tmp/nganha-active-hero.mp4 \
HERO_FFMPEG=/private/tmp/nganha-video-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1 \
HERO_OUTPUT_DIR=/private/tmp/nganha-r7-script-output \
node plans/pagespeed-remediation-20260914/agent-r7/build-hero-renditions.mjs
```

Encoder: FFmpeg `7.1`, isolated under `/private/tmp`; no system-wide or project dependency was installed. Input facts: 26,974,458 bytes, SHA-256 `e3ce2ce9ba565db44f13b9e48831ae4766ca4e6fed9980581424f7b6a1e72b39`, H.264 High 1920×1080, 30 fps, 25.10 seconds, AAC audio.

The run reproduced the reviewed candidate bytes exactly:

| Candidate | Filter/CRF | Dimensions | Bytes | SHA-256 | Reduction from source |
| --- | --- | ---: | ---: | --- | ---: |
| mobile | `scale=720:trunc(ow/a/2)*2`, CRF 24 | 720×404 | 774,319 | `998c2d3f31f2d0763204016c42ffe71f83ae212bb36b2e99518025b1b733591c` | 97.13% |
| desktop | `scale=1280:trunc(ow/a/2)*2`, CRF 22 | 1280×720 | 2,359,502 | `2986ddd790bb532e552b23d315cfaaf7539b1423256ea64766f7da09215d8461` | 91.25% |

Both outputs decode as H.264 High/yuv420p, 30 fps, 25.10 seconds, with AAC audio and `faststart` metadata. The mobile expression intentionally uses an even-height expression because the source aspect ratio otherwise produces an odd 405-pixel height. A three-row contact sheet made from the source/mobile/desktop at approximately 1, 12, and 23 seconds was inspected locally and preserved the frame content at that scale. This is a local candidate result, not Safari/iOS acceptance or a production savings claim.

## Responsive contract proof

`hero-rendition-selection.mjs` documents the additive fields that may be considered after the external migration gate:

```text
mobile_url?: string
desktop_url?: string
```

Selection precedence is one candidate only: below 768 CSS pixels, `mobile_url`, then `desktop_url`, then canonical `url`/`media_url`; at or above 768 pixels, `desktop_url`, then `mobile_url`, then canonical `url`/`media_url`. Empty values are ignored. The helper supports both snake_case contract keys and camelCase fixture aliases for test ergonomics. It does not invent a URL.

The production consumer should adopt these fields only when all of the following are true:

1. The CMS/API contract and migration preserve the existing canonical fallback and are versioned separately from this local proof.
2. The server/client render path resolves the viewport candidate before mounting a `<video>` or assigning `src`; the initial element must have no source and `preload="none"`.
3. One selected URL is assigned exactly once, followed by one explicit `load()`. The other candidate must never appear as a `<source>` or `src` during the same attempt.
4. Retry, autoplay-blocked, error, visibility pause, poster fallback, locale copy, and active-video navigation are re-tested after integration.
5. The browser network gate confirms only the selected rendition is fetched on mobile and desktop; only then can the fields be added to the production normalizer.

`hero-rendition-selection.test.mjs` covers mobile/desktop precedence, missing-rendition fallback, current canonical-only behavior, and the local-only test gate. It passed 5/5.

`hero-rendition-selection.browser.mjs` serves the locally generated MP4 candidates from a temporary loopback HTTP server. It does not use remote URLs. For each 390×844 mobile and 1440×844 desktop scenario it asserts:

- The video starts with no `src` and `readyState === 0`.
- The responsive choice is made before assigning `src` and calling `load()`.
- Exactly one rendition path is requested; the other candidate is never fetched.
- The request uses a local MP4 response with range support and decodes to the expected dimensions and 25.1-second duration.

Browser command and result:

```text
node plans/pagespeed-remediation-20260914/agent-r7/hero-rendition-selection.browser.mjs
PASS — mobile selected only `/hero-mobile-720.mp4`, one `bytes=0-` request, decoded 720×404, 25.1 s
PASS — desktop selected only `/hero-desktop-1280.mp4`, one `bytes=0-` request, decoded 1280×720, 25.1 s
```

The fixture proves the no-double-fetch invariant for the proposed selection algorithm; it does not claim that the current production Hero already selects these candidates. That consumer integration remains gated on a reviewed CMS schema and post-integration browser tests.

## Validation and external gates

- `node --test plans/pagespeed-remediation-20260914/agent-r7/hero-rendition-selection.test.mjs`: pass, 5/5.
- `HERO_INPUT=https://example.invalid/hero.mp4 node plans/pagespeed-remediation-20260914/agent-r7/build-hero-renditions.mjs`: rejected with exit 1 before invoking FFmpeg, confirming the local-only input gate.
- The local build runner reproduced both candidate hashes and wrote `externalActions.uploaded/configUpdated/deployed: false`.
- `node plans/pagespeed-remediation-20260914/agent-r7/hero-rendition-selection.browser.mjs`: pass for mobile and desktop decode/network scenarios.
- `npx tsc --noEmit`: pass.
- `git diff --check`: pass before commit.

Required follow-up gates remain unperformed: upload versioned objects, verify Supabase HEAD/GET MIME/range/hash, update the active config with a guarded migration/CAS operation, integrate source selection into `Hero.tsx`, run Safari/iOS playback, run matched first-12-second production byte traces, and deploy/verify the official domain. No byte savings are claimed from local file sizes alone.

Rollback is to remove the additive R7 proof files. Since no production consumer or data was changed, no runtime rollback is required.
