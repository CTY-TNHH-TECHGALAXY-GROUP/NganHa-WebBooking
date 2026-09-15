# Final menu/chat browser handoff

Date: 2026-09-15 (Asia/Ho_Chi_Minh)

- Candidate SHA: `7958cf4005d6cd8cb60cfc7513a7c6a914e5b696`
- Branch: `codex/ps-integration-20260913`
- Server: `http://127.0.0.1:3424` (local production build)
- Test: `scripts/test-final-menu-focus.mjs`

The exact committed candidate passed both Playwright profiles without forced clicks:

- mobile 390×844, DPR2
- desktop 1440×900, DPR1

Header menu, Contact menu, and the real AI chat path were exercised. Each opened with focus on its close control; Escape closed the surface and restored focus to its visible trigger. A Tab from the chat close control remained inside the dialog focus scope. Homepage navigation returned HTTP 200.

This is local evidence only; physical-device, database, transfer, runtime, font and live-deployment gates remain open. No production DB, Storage, push, or deploy was changed.
