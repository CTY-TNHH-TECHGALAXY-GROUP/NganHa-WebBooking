# Agent C — Hero video delivery inventory

Date: 2026-09-13 22:52 ICT  
Worktree: `/private/tmp/nganha-agent-c-20260913`  
Branch: `codex/ps-hero-20260913`  
Base: `e1c0b5f1e9a819dda431d77c95fabbee4b8ad207`

## Active production source

The read-only request to `https://oria-spa.vercel.app/api/hero-videos` returned one active video:

- `id`: `1786820518217`
- `url`: `https://adzfohfdindovfcpaizb.supabase.co/storage/v1/object/public/media-uploads/homepage/0807(1).mp4`
- `poster`: `https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg`
- `sort_order`: `2`

The README domain `ngan-ha-web-booking.vercel.app` returned Vercel `DEPLOYMENT_NOT_FOUND`, so it was not used as production evidence.

## HTTP and browser evidence

The active MP4 HEAD response returned:

- status `200`, MIME `video/mp4`
- `content-length: 26974458` bytes (25.73 MiB)
- `accept-ranges: bytes`
- `cache-control: no-cache` on the direct HEAD request
- `etag: "e5b22ba1a95080c5a901ad165761a3e1-5"`

A headless Chromium 149 trace using `preload="auto"` on a 390×844 viewport observed three 206 responses. The final response covered `bytes 32768-26974457` with `content-length: 26941690`, so the browser received approximately the complete 26.97 MB object in that trace. The browser reported `duration: 25.1s`, `videoWidth: 1920`, and `videoHeight: 1080`. No codec, frame rate, bitrate, or audio stream claim is made because no media inspection binary was available.

The configured poster returned status `200`, MIME `image/jpeg`, and `content-length: 49133` bytes (48.0 KiB), with a long-lived cache policy. It is below the plan's 100–150 KiB poster budget, but it remains JPEG because no safe poster WebP conversion was available in this worktree.

## Encoder gate

No usable encoder or media probe was installed in the isolated environment:

```text
ffmpeg: unavailable
ffprobe: unavailable
mediainfo: unavailable
cwebp: unavailable
magick: unavailable
```

Therefore Agent C did not re-encode or create a fake rendition. The required mobile/desktop H.264 faststart outputs, poster WebP, byte comparison, and visual comparison are `BLOCKED` pending an approved encoder runtime. No DB/storage write was performed.

## Scoped code change

`Hero.tsx` now supplies the verified 49 KiB poster as a fallback whenever a configured Hero video has no poster. This keeps the existing single active source, autoplay, muted/playsInline behavior, retry state, and video ordering unchanged while ensuring a configured poster exists for the missing-poster path. A configured but broken custom poster still requires a later runtime probe or asset replacement.

Validation:

- `npx tsc --noEmit`: pass.
- `git diff --check`: pass.
- No Hero visual or playback regression test was run after the fallback-only change; the active MP4 trace above was collected before the code change.

## Handoff gate

Status: `PARTIAL / BLOCKED — inventory and fallback complete; rendition generation pending encoder`.

Next permitted step is to install or provide a reviewed encoder, generate 480p/720p and desktop renditions with H.264 faststart and compatible pixel format, create a poster WebP, QA the frames, and hand the manifest to Agent B for storage upload. Agent C must not write production DB/storage.
