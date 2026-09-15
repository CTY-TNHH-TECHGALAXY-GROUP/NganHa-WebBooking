# Final menu/chat browser handoff

Date: 2026-09-15 (Asia/Ho_Chi_Minh)

- Candidate SHA: `d129b6f0c184d937db8cc9f88342ca3c5e9ca20e`
- Branch: `codex/ps-integration-20260913`
- Server: `http://127.0.0.1:3422` (local production build)
- Test: `scripts/test-final-menu-focus.mjs`
- Scope: header menu, floating contact menu, AI chat Escape handling and focus restoration.

The exact candidate passed both Playwright profiles without forced clicks:

- mobile 390×844, DPR2
- desktop 1440×900, DPR1

For each profile the menu opened with focus on `Close menu`, Escape closed it and restored focus to `Toggle menu`; Contact menu Escape restored focus to `Contact Us`. Homepage navigation returned HTTP 200. This is local evidence only; physical-device and live-deployment gates remain open.

No production DB, Storage, push, or deploy was changed.
