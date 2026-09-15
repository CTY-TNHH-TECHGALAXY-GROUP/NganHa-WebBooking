# Final menu/chat accessibility handoff

Date: 2026-09-15 (Asia/Ho_Chi_Minh)

## Provenance and scope

- Source candidate: `ef425e3` (integrator branch `codex/ps-integration-20260913`).
- Role branch source: `2695184` from `/private/tmp/nganha-pagespeed-final-menu`.
- Owned files: `src/components/Header/Header.logic.ts`, `src/components/Header/Header.tsx`, `src/components/FloatingWidgets/FloatingWidgets.tsx`, `src/components/AIChatBot/AIChatBot.tsx`, `scripts/test-final-menu-focus.mjs`.
- Additional integrator fix: `src/components/Hero/Hero.tsx` loading status is pointer-transparent so slow video loading does not intercept header controls.
- No DB, Storage, production setting, push, or deploy was changed.

## Changes

- Escape closes the Header menu, Floating contact menu, and AI chat.
- Closing restores focus to the corresponding trigger; opening focuses the close control.
- Added `aria-expanded`/`aria-controls` and chat dialog labeling.
- Browser test uses exact viewport dimensions and DPR assertions; no forced clicks.

## Verification

`npm run build` exited 0 on Next.js 15.5.14 with 70 static pages.

`MENU_FOCUS_BASE_URL=http://127.0.0.1:3411 MENU_FOCUS_TESTED_SHA=ef425e3 MENU_FOCUS_EVIDENCE=plans/pagespeed-remediation-20260913/remaining/agent-final-menu/menu-focus-report-20260915.json node scripts/test-final-menu-focus.mjs` exited 0.

Both profiles passed:

- mobile 390×844 DPR2
- desktop 1440×900 DPR1

Header menu and Contact menu close on Escape and restore focus. The report is local production-build evidence; live deployment mapping remains a separate gate.

## Residuals

- Physical-device pinch/zoom and full manual WCAG/font license review remain under D/F ownership.
- Production deployment SHA/alias and live route verification remain open.

## Rollback

Revert `2695184` for the menu/chat implementation and `ef425e3` for the Hero loading interaction fix. Evidence can be removed independently without changing app behavior.
