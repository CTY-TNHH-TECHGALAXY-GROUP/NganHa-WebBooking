# Plan: fix live hero video loading with 3 agents

## Objective and evidence

Reduce time to first moving frame on the homepage without changing its video-first experience, admin content choices, or booking/email flows. Base evidence: VIDEO_LIVE_AUDIT_20260910.md. API TTFB measured 1.58-2.12s; live video 26,974,458 bytes/25.1s/H.264 1080p; trailing moov; Supabase Range 206 and CDN HIT.

This plan authorizes implementation when executed. Production upload, source switching, commit/push follow the existing deployment authorization and project rules; record exactly what was deployed. Do not replace unrelated uncommitted work. Do not assume git push proves deployment readiness.

## Integrator: start and contract (first 15 minutes)

1. Read AGENTS.md, README.md, DEVELOPMENT_NOTES.md and relevant installed Next documentation. Record HEAD, dirty files, deployment branch and live video URL.
2. Inspect homepage rendering and admin hero save/delete paths before selecting a caching implementation. Check actual framework version and supported cache invalidation APIs locally.
3. Freeze ownership below. Agree initial video configuration type and media manifest shape. Manifest identifies original URL, versioned output URLs, codec, dimensions, duration, bytes, poster and approval status. Missing optimized media must retain the original URL.
4. Prioritize source discovery and fast-start. Do not delay these fixes for adaptive streaming or provider migration.

## Agent 1: initial source and configuration latency

Own: homepage server entrypoints, a narrowly scoped shared hero-config loader, public /api/hero-videos route and hero-admin configuration write route only where invalidation is necessary. Do not edit Hero.tsx or media binaries.

1. Inspect both / and /[lang]. Avoid duplicate server/client configuration requests.
2. Supply actual initial hero configuration from server to Hero props, preserving the existing video ordering and query-selected heroVideo behavior through the agreed contract.
3. Use bounded caching supported by the installed Next version; target 60-second maximum staleness with immediate invalidation after successful admin save/delete when feasible. Never cache transient DB failures as permanent configuration or leak service-role secrets.
4. Measure whether server fetching delays HTML. Do not simply move the 2-second delay from client to server; compare warm and cold response times, and use existing streaming/fallback patterns if required.
5. Coordinate an explicit loading/empty/error contract with Agent 3. The homepage must never receive or download a hardcoded default video as a fallback for empty config, DB failure or malformed data. Audit existing API default-video responses as well as client defaults. Preserve compatibility for other consumers where needed without returning a default source to the homepage.
6. Report changed files, cache/invalidation rules, timing evidence and tests to plans/video-loading-20260910/agent-1.md.

## Agent 2: fast-start and optimized media candidates

Own: media preparation script if needed, isolated candidate output directory and plans/video-loading-20260910/media-manifest.json plus agent-2.md. Do not edit components, API routes, stored hero config or overwrite current video.

1. Inspect ffmpeg/ffprobe availability. Download/read the actual public source with a bounded operation; compare source identity with local fallback before using it as a substitute.
2. Create a versioned lossless fast-start remux first. Verify moov precedes mdat, duration/frame dimensions are unchanged, and decoding succeeds. Record size; remux alone is not compression.
3. Prepare H.264 progressive MP4 candidates for 1080p and 720p with fast-start, compatible pixel format, and reasonable bitrate. Start with a 720p candidate around 2-3 Mbps; this is an experiment, not a mandatory quality ceiling.
4. Verify whether audio is ever used before removing it. Do not infer global permission to remove audio from the homepage's muted playback setting.
5. Capture comparable frames from start/middle/end, inspect motion, dark gradients and treatment detail. Report artifact/quality tradeoffs and candidate sizes.
6. Hand candidates and manifest to integrator for visual review. Do not point production at candidates until uploaded URLs pass GET/Range/content-type checks and visual acceptance.
7. If encoding tools or upload authorization/access are unavailable, provide exact blocked operation and continue the remux/manifest work that is possible. No provider migration, HLS system or bucket-policy changes.

## Agent 3: frontend playback and independent acceptance

Own: src/components/Hero/Hero.tsx and focused playback tests/browser harness; plans/video-loading-20260910/agent-3.md. Coordinate initial-props contract with Agent 1 before edits.

1. REQUIRED USER DECISION: show a loading screen first while configuration is unresolved and while the selected video is preparing its first frame. Do not mount a default video, assign its src, preload it, or fetch it through JavaScript. Once configuration resolves, load only the actual selected video. This applies on both healthy and failed requests, not only the happy path.
2. Preserve layout, logo, navigation, ordering, heroVideo query selection, mute, playsInline, autoplay, loop and next-slide behavior.
3. Keep inactive sources unloaded or explicitly bounded. Pausing alone does not cancel their preload. Do not accumulate unlimited preload=auto elements after navigation.
4. Show a lightweight, responsive loading screen consistent with the existing brand, using a logo/loading indicator rather than a placeholder video. Coordinate server streaming/loading boundaries with Agent 1 so the screen can appear while configuration is pending. Reveal the selected video after its first frame is ready (prefer requestVideoFrameCallback when available with a compatible event fallback); do not hide loading on an arbitrary timer or only because metadata arrived. If autoplay is blocked, show a play control. A bounded timeout or config/media failure must show an accessible retry/error state instead of an endless spinner or default video. Preserve predictable navigation, clear timers/listeners on unmount, and prevent error loops.
5. Do not blindly set metadata on the active autoplay hero. Compare initial playback priority and avoid preloading every source/variant.
6. If media variants are approved, select one appropriate source without downloading both; retain original source fallback. Do not redesign components for a speculative manifest.
7. Prepare browser measurement of first-frame time, source requests, transferred bytes, stalls and errors on desktop/mobile. Use mock failures for DB/video errors; never create bookings.

## Integration order

1. Agents run concurrently after contracts are agreed; communicate contract changes explicitly.
2. Integrator reviews Agent 1 and Agent 3 together, runs typecheck/build and renders both homepage routes. Patch integration gaps locally without expanding scope.
3. Integrator reviews Agent 2 media comparison, validates versioned uploaded URLs, then switches the website source through the established admin/config mechanism only after acceptance. Keep previous URL for rollback.
4. Record source/config changes separately from code commit. Never overwrite the old object or delete existing videos during rollout.
5. Verify target deployment is serving the final SHA. Default deployment branch is vercel; inspect current production linkage before publishing or updating master.

## Acceptance matrix

| Case | Required evidence |
| --- | --- |
| Desktop cold/warm / and /vi | First frame, HTML/API timing and waterfall before/after |
| Mobile narrow viewport and constrained network | Responsive loading screen, correct framing, autoplay/play control, measured first frame and stalls |
| Actual Safari/iOS | playsInline and playback verified; emulation alone is not Safari proof |
| Initial source | Loading screen first; zero default-video requests on healthy, empty, slow or failed configuration; only the configured selected source loads |
| Loading transition | Loading ends on first-frame readiness; autoplay denial has a play control; timeout has a retry state; no arbitrary delay masking performance |
| MP4 | H.264 compatibility, moov before mdat, valid duration, HTTP 206 and video/mp4 |
| Multi-slide next/previous/end | Correct slide and no uncontrolled inactive downloads |
| heroVideo query | Requested valid slide selected; invalid input falls back predictably |
| Admin source update | New config visible within stated cache contract |
| API/storage failure | Accessible error/retry state without default video, endless loading, error loop or uncaught exception |
| Regression | Hero remains first screen; no edits to checkout, mailer, RPC or DB schema |

Measure before and after with the same device/profile and at least three runs per selected network profile. Initial target: warm config response under 500ms and first frame at least 30% faster than measured browser baseline. These are targets, not claimed guarantees. Establish the browser baseline first; curl is not first-frame evidence. Report median and individual results. No release claim if measurement cannot be completed.

## Release and rollback

- Run scoped tests, typecheck, production build and diff audit. Preserve unrelated files.
- Publish only verified changes; record final SHA, deployment URL/ID and active media URL.
- Run read-only live playback smoke checks. No production booking or email required.
- If playback worsens, restore the previous media URL or revert only this task's commit through a normal reviewed revert, preserving concurrent user work.
- Final report: confirmed causes addressed, before/after measurements, remaining uncertainties, media size/quality evidence and exact rollback steps.

## User involvement

Agent/integrator handles implementation and local testing. User participation is only needed for unavailable account access, final visual preference when compression changes appearance, and real-device Safari/inbox-independent playback confirmation if that device is not available to agents. Do not repeatedly ask the user to collect evidence the agents can obtain themselves.
