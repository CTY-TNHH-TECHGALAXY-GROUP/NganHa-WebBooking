# Agent C — R6/R7 Hero fallback and video delivery handoff

Status: **PARTIAL / BLOCKED**

R6 is implemented and browser-verified locally. R7 rendition generation is blocked by the absence of an approved encoder/probe runtime; no upload, database write, config change, push, merge, or deploy was performed.

## Provenance and scope

- Worktree: `/private/tmp/nganha-agent-c-final-20260914`
- Branch: `codex/ps-final-c-20260914`
- Base SHA: `62b3740149e9e0d75aabe65943215ff20c222851`
- Files changed: `src/components/Hero/Hero.tsx`, `plans/pagespeed-remediation-20260914/agent-c/hero-fallback.browser.mjs`, this handoff.
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

The configured poster is status 200, MIME `image/jpeg`, 49,133 bytes, 640×640. The tracked local file `public/images/hero-spa-bg.png` is byte-identical to that poster (JPEG bytes despite its legacy `.png` name; SHA-256 `efc8b4401df925d869f7d8906ae63f318f6655311fd580c5ce729952f6d26bc9`). It is used only as a last-resort browser fallback; the existing configured/default poster URL and branding remain unchanged.

## R6 implementation

`Hero.tsx` now:

1. Always derives a poster source for an active configured video. Missing CMS poster data starts with the existing verified default poster URL.
2. Renders that poster independently of the video wrapper, so the wrapper’s pre-first-frame `opacity: 0` cannot hide the first paint.
3. Handles a failed CMS/default poster by moving to the local byte-equivalent asset. A failure of the last local source leaves the Hero content and gradient visible and does not create an error loop.
4. Passes the resolved poster source to the `<video>` element as well, while retaining autoplay, muted, playsInline, loop, source ordering, retry, analytics, object-fit, and locale copy behavior.
5. Adds stable `data-testid` hooks used only by the focused browser test.

## Browser verification

Command (local Next dev server on port 3137, isolated worktree, Supabase env symlinked but not committed):

```text
node plans/pagespeed-remediation-20260914/agent-c/hero-fallback.browser.mjs
```

Result: exit 0; all five scenarios passed:

```text
PASS slow video keeps poster visible before first frame
PASS broken CMS poster falls back to local poster
PASS autoplay rejection exposes manual play action
PASS video error keeps poster and exposes retry
PASS hidden document pauses playing video
```

The suite uses Playwright Chromium at 390×844 and controlled route interception. It does not claim production acceptance because this candidate was not deployed. The browser runner required the approved escalated local-server/Chromium execution profile; no external writes occurred.

## Validation

- `npx tsc --noEmit`: exit 0.
- `npx eslint src/components/Hero/Hero.tsx`: exit 0, 7 pre-existing warnings, 0 errors. Warnings include unused legacy imports/branch data and the existing `<img>` lint warning; no new error was introduced.
- `npm run lint`: completed with the repository’s existing warnings, no lint error.
- `git diff --check`: pass.

## R7 encoder gate and reproducible next step

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
ffmpeg -ss 00:00:01 -i active-hero.mp4 -frames:v 1 -vf "scale=640:640:force_original_aspect_ratio=decrease" -c:v libwebp -quality 82 -compression_level 6 hero-poster.webp
```

The commands are a starting profile, not an upload authorization. Verify crop/aspect/branding, first frame, audio behavior, Safari/iOS playback, and matched 12-second mobile bytes before selecting outputs. The plan gate remains a controlled matched-profile reduction of at least 70%; no savings are claimed here.

## Rollback and open risk

The R6 rollback is a one-file revert of `src/components/Hero/Hero.tsx`; the test and handoff are additive. R7 remains open until an encoder is provided and outputs pass visual/playback/byte gates. The local fallback file has a legacy `.png` extension while containing JPEG bytes; it is an existing asset and was not renamed in this scoped patch to avoid breaking its existing consumers. A future asset cleanup should create a correctly typed version only after visual and MIME validation.
