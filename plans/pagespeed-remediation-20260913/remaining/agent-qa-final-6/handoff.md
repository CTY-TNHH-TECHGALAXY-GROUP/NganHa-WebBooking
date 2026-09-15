# Final QA replay handoff

Date: 2026-09-15 (Asia/Ho_Chi_Minh)

- Candidate SHA: `435b364b1617b26bf33d0abbd2cd846a84d2f029`
- Branch: `codex/ps-integration-20260913`
- Server: `http://127.0.0.1:3425` (local Next production build)
- Route probes: 65 total; 47 sitemap entries; 63 HTTP 200; 2 expected negative-control 404s.

The QA browser replay passed on both mobile 390×844 DPR2 and desktop 1440×900 DPR1. Header menu Escape, cart open/close, Contact menu/AI chat Escape and focus flows all passed without force-clicks. The route/cache/MIME matrix is local evidence only.

Required release gates still open: real PostgreSQL CAS/ACL/concurrency/rollback, matched Hero transfer reduction and Storage readback, runtime TBT attribution/PSI, manual/physical-device accessibility and font review, and production deployment SHA/alias verification. No production DB, Storage, push, merge or deploy was performed.
