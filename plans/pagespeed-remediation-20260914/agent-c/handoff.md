# Agent C — R6/R7 Hero fallback and video delivery handoff

Status: **PARTIAL / BLOCKED (MP4 only)**

R6 is implemented and browser-verified locally. The R7 poster WebP subpart is complete; MP4 rendition generation remains blocked by the absence of an approved encoder/probe runtime. No upload, database write, config change, push, merge, or deploy was performed.

## Provenance and scope

- Worktree: `/private/tmp/nganha-agent-c-final-20260914`
- Branch: `codex/ps-final-c-20260914`
- Base SHA: `62b3740149e9e0d75aabe65943215ff20c222851`
- Files changed: `src/components/Hero/Hero.tsx`, `public/images/hero-spa-poster.webp`, `plans/pagespeed-remediation-20260914/agent-c/hero-fallback.browser.mjs`, this handoff.
- Scope audit: no History, Space, FarmStore, booking/cart, Galaxy/flipbook, API, Supabase, DB, or deployment files were changed.

## Active source inventory

Read-only `GET https://oria-spa.vercel.app/api/hero-videos` returned one active record:

```text
id: 1786820518217
url: https://adzfohfdindovfcpaizb.supabase.co/storage/v1/object/public/media-uploads/homepage/0807(1).mp4
poster: https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg
sort_order: 2
```

Existing controlled trace evidence for the active MP4 recorded status 200, MIME `video/mp4`, `content-length: 26,974,458` bytes, `accept-ranges: bytes`, duration 25.1 seconds, and 1920×1080 video dimensions. A Chromium mobile trace with `preload="auto"` downloaded the range covering approximately the complete object. No codec, frame-rate, bitrate, or audio-stream claim is made because no probe binary is available.

The configured poster is status 200, MIME `image/jpeg`, 49,133 bytes, 640×640. The tracked local file `public/images/hero-spa-bg.png` is byte-identical to that poster (JPEG bytes despite its legacy `.png` name; SHA-256 `efc8b4401df925d869f7d8906ae63f318f6655311fd580c5ce729952f6d26bc9`). Sharp 0.34.5 generated `public/images/hero-spa-poster.webp` from that preserved source: WebP, 640×640, 31,214 bytes, SHA-256 `d296bd23cb46df50fb4ad31c18e4779ebb8d63111164cc38567a7ccb427bbe71`. The WebP is used only as a last-resort browser fallback; the existing configured/default poster URL and branding remain unchanged.

## R6 implementation

`Hero.tsx` now:

1. Always derives a poster source for an active configured video. Missing CMS poster data starts with the existing verified default poster URL.
2. Renders that poster independently of the video wrapper, so the wrapper’s pre-first-frame `opacity: 0` cannot hide the first paint.
3. Handles a failed CMS/default poster by moving to the correctly typed local WebP poster derived from the preserved byte-equivalent source. A failure of the last local source leaves the Hero content and gradient visible and does not create an error loop.
4. Passes the resolved poster source to the `<video>` element as well, while retaining autoplay, muted, playsInline, loop, source ordering, retry, analytics, object-fit, and locale copy behavior.
5. Adds stable `data-testid` hooks used only by the focused browser test.

## Browser verification

Command (local Next dev server on port 3138, isolated worktree, Supabase env symlinked but not committed):

```text
HERO_TEST_BASE_URL=http://localhost:3138 node plans/pagespeed-remediation-20260914/agent-c/hero-fallback.browser.mjs
```

Result: exit 0; all five scenarios passed:

```text
PASS slow video keeps poster visible before first frame
PASS broken CMS poster falls back to local poster
PASS autoplay rejection exposes manual play action
PASS video error keeps poster and exposes retry
PASS hidden document pauses playing video
```

The suite uses Playwright Chromium at 390×844 and controlled route interception. The broken-poster case additionally asserts `Content-Type: image/webp`, `naturalWidth=640`, `naturalHeight=640`, and non-empty decoded canvas pixels. It does not claim production acceptance because this candidate was not deployed. The browser runner required the approved escalated local-server/Chromium execution profile; no external writes occurred.

## Validation

- `npx tsc --noEmit`: exit 0.
- `npx eslint src/components/Hero/Hero.tsx`: exit 0, 7 pre-existing warnings, 0 errors. Warnings include unused legacy imports/branch data and the existing `<img>` lint warning; no new error was introduced.
- `npm run lint`: completed with the repository’s existing warnings, no lint error.
- `git diff --check`: pass.

## R7 poster completion and video encoder gate

The poster WebP subpart is complete locally. It was generated reproducibly with Sharp 0.34.5 from `public/images/hero-spa-bg.png`; no source/CMS URL was changed and the output was not uploaded or published. Output facts: WebP 640×640, 31,214 bytes, SHA-256 `d296bd23cb46df50fb4ad31c18e4779ebb8d63111164cc38567a7ccb427bbe71`. A local Next response returned `Content-Type: image/webp` and `Content-Length: 31214`; the browser test verified the same MIME and decoded dimensions/pixels.

The following checks found no usable local encoder/probe:

```text
command -v ffmpeg       # no output; unavailable
command -v ffprobe      # no output; unavailable
command -v cwebp        # no output; unavailable
command -v magick       # no output; unavailable
command -v convert       # no output; unavailable
```

The Codex workspace dependency paths were inspected: bundled `bin/override`, `bin/fallback`, bundled Node package `.bin`, and project `node_modules` contained no `ffmpeg`, `ffprobe`, `cwebp`, or ImageMagick binary. No system-wide installation was attempted.

After a reviewed FFmpeg build is supplied, run against a preserved local copy of the active source and record the binary version, input probe, output SHA-256, dimensions, duration, codec, bitrate, and visual contact sheet. A reproducible starting specification is:

```text
ffprobe -v error -show_format -show_streams -of json active-hero.mp4
ffmpeg -i active-hero.mp4 -map 0:v:0 -map 0:a? -vf "scale=720:-2:force_original_aspect_ratio=decrease" -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k hero-mobile-720.mp4
ffmpeg -i active-hero.mp4 -map 0:v:0 -map 0:a? -vf "scale=1280:-2:force_original_aspect_ratio=decrease" -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k hero-desktop-1280.mp4
node -e "require('sharp')('public/images/hero-spa-bg.png').webp({quality:82,effort:6}).toFile('public/images/hero-spa-poster.webp')"
```

The commands are a starting profile, not an upload authorization. Verify crop/aspect/branding, first frame, audio behavior, Safari/iOS playback, and matched 12-second mobile bytes before selecting outputs. The plan gate remains a controlled matched-profile reduction of at least 70%; no savings are claimed here.

## Rollback and open risk

The R6 rollback is a one-file revert of `src/components/Hero/Hero.tsx`; the test, poster, and handoff are additive. MP4 rendition work remains open until an encoder is provided and outputs pass visual/playback/byte gates. The source fallback input has a legacy `.png` extension while containing JPEG bytes; it is an existing asset and was retained for its other consumers. The runtime fallback now uses the correctly typed WebP output.
