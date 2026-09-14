# Hero MP4 rendition — local evidence

Status: **LOCAL CANDIDATES ONLY — not uploaded, referenced by configuration, deployed, or released.**

## Input

- Downloaded read-only from the active public Hero URL on 2026-09-14.
- `/private/tmp/nganha-active-hero.mp4`
- SHA-256: `e3ce2ce9ba565db44f13b9e48831ae4766ca4e6fed9980581424f7b6a1e72b39`
- 26,974,458 bytes; H.264 High, 1920×1080, 30 fps, 25.10 seconds; AAC audio stream present.

## Encoder

- Isolated temporary runtime: `/private/tmp/nganha-video-tools/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1`
- The runtime was installed under `/private/tmp`; the operating system and project dependencies were not changed.
- Both outputs use H.264/yuv420p, `-movflags +faststart`, and preserve the source audio mapping.

## Candidates

| Variant | Dimensions | Bytes | SHA-256 | Reduction from input |
|---|---:|---:|---|---:|
| mobile | 720×404 | 774,319 | `998c2d3f31f2d0763204016c42ffe71f83ae212bb36b2e99518025b1b733591c` | 97.13% |
| desktop | 1280×720 | 2,359,502 | `2986ddd790bb532e552b23d315cfaaf7539b1423256ea64766f7da09215d8461` | 91.25% |

The first mobile command used `scale=720:-2` and failed because it produced odd height 405. The corrected mobile filter is `scale=720:trunc(ow/a/2)*2`.

## Visual check

`/private/tmp/nganha-hero-comparison.png` is a three-row contact sheet: source, mobile, desktop; columns represent approximately 1 s, 12 s, and 23 s. It was inspected locally and preserves the frame content at this scale. This is not device/Safari playback acceptance.

## Required next gates

1. Run decode/playback checks including Safari/iOS and a controlled first-12-second network measurement.
2. B must upload versioned objects, verify HEAD/GET MIME/range/hash, and conditionally update only the active Hero config after the migration/CAS gate is complete.
3. Change source selection so only the appropriate rendition is attached before loading; preserve retry, visibility pause, locale and existing Hero behavior.
4. Verify the official domain after deploy. Do not infer live savings from these local file sizes.
