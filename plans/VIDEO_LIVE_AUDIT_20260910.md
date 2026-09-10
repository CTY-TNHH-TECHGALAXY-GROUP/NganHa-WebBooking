# Live hero video audit

Measured 2026-09-10 around 08:23-08:25 UTC from this execution environment.

## Evidence

- Live host: ngan-ha-web-booking-seven.vercel.app.
- GET /api/hero-videos returns one Supabase public video: media-uploads/homepage/0807(1).mp4.
- API TTFB: 1.5845s and 2.1175s; second response x-vercel-cache MISS, cache-control public,max-age=0,must-revalidate, route hkg1::iad1.
- Video range GET bytes 0-1048575: HTTP 206, content-range bytes 0-1048575/26974458, video/mp4, CF cache HIT at HKG, max-age=3600.
- Video TTFB 0.3947s; 1 MiB received in 0.5699s; measured transfer average 1.84 MB/s. This single sample is not a mobile network benchmark.
- Remote tail range contains moov at byte 26957000, size 17458. Metadata: avc1/H.264, 1920x1080, 25.1 seconds. Approximate total file bitrate 8.60 Mbps (includes all tracks and overhead).
- Local fallback public/videos/0807(1).mp4 has matching total length and the same trailing moov layout; byte-for-byte equality was not tested.

## Findings

1. Hero.tsx initializes an autoplay/preload-auto local fallback, then fetches /api/hero-videos in useEffect and replaces the source with the remote list. The live video id differs from the fallback id, causing the video element to remount. This creates a potential wasted fallback transfer and playback restart. Browser waterfall/first-frame evidence is still needed to quantify bytes wasted and visible delay.
2. The remote source is only discovered after client hydration and a dynamic DB-backed API request. The measured API adds 1.58-2.12 seconds after request initiation; hydration time was not measured. API has no observed edge cache reuse.
3. The MP4 lacks fast-start layout: moov is at the end. A browser needs the tail metadata before decoding; working Range support avoids requiring the entire file but can add round trips.
4. A 26,974,458-byte, 25.1-second hero video has approximately 8.60 Mbps overall bitrate. This is a material bandwidth demand on constrained mobile connections. No alternate mobile source or adaptive stream is selected by Hero.tsx.
5. On slide navigation, loadedIndices accumulates mounted videos, all with preload=auto. This is a future multi-video bandwidth risk, not an explanation for simultaneous remote hero downloads today: the current live API returns only one video.

## Not established as the cause

- Public access and Range work for the tested URL without credentials.
- Supabase cache is HIT in the measured request. Do not label the CDN broken or move providers on this evidence.
- Function region iad1 is observed; Supabase origin region and its separate latency contribution are unknown.
- No fetch-to-blob path exists in the inspected Hero component; video is served directly via src.
- No real-browser first-frame, Safari waterfall, low-bandwidth mobile, or multi-region measurement was completed. ffprobe is unavailable; container metadata was read directly instead.

## Recommended implementation order

1. Provide the actual initial hero configuration before mounting the video, with a defined fallback on failure. Avoid fetching two different sources during startup. Evaluate server-provided config and bounded caching with invalidation after admin updates.
2. Prepare a versioned fast-start MP4; preserve the current file until visual comparison passes. A remux can move moov without quality loss; it does not reduce bitrate.
3. Compare a lower-bitrate 1080p and mobile 720p encode visually, including massage details and dark gradients. Select file size/quality targets from this comparison rather than blindly applying CRF.
4. Load the current slide deliberately and defer inactive videos. Do not apply preload=metadata indiscriminately to the autoplay first hero.
5. Remeasure cold/warm API timing, first frame, transferred bytes, Safari/iOS playback, navigation and return-to-hero on desktop/mobile before deployment.

## Corrections to supplied plan

- Test Range using GET with a bounded Range header; HEAD alone is insufficient to validate partial media delivery.
- Public URL success is the relevant access check; do not add anon storage policies as a speculative performance fix.
- max-age=3600 alone does not establish poor CDN caching; this request was a cache HIT.
- Supabase video traffic goes directly to its CDN; Vercel function region affects configuration retrieval, not every media byte.
- No configuration, policy, source video, or production code was changed in this audit.
