# Content Builder Multi-Agent Task Board

**Project:** NganHa-WebBooking — Dynamic Content Block System  
**Current Branch:** `feat/content-contract-antigravity`  
**Last Updated:** 2026-09-18  

---

## 1. IN REVIEW
- [ ] **CONTENT-001: Phase 0 Architecture Verification & Contract Definition**
  - **Owner:** Antigravity (Handoff prepared) -> Codex (Review & Freeze)
  - **Branch:** `feat/content-contract-antigravity`
  - **Deliverable:** `docs/content-system/CONTENT_CONTRACT_V1.md`, `ARCHITECTURE_DECISIONS.md`, `handoffs/ANTIGRAVITY_PHASE_0.md`
  - **Status:** Antigravity audit and contract drafting complete. Awaiting Codex gatekeeper sign-off to freeze contract.

---

## 2. READY (Pending Phase 0 Sign-Off)
- [ ] **CONTENT-002: Content Renderer Foundation & Block Registry**
  - **Owner:** Codex
  - **Branch:** `feat/content-renderer`
  - **Scope:** TypeScript content types, Zod schemas, `ContentRenderer`, registry, 8 block renderers, SSR/SEO validation, unknown block fallback.
- [ ] **CONTENT-003: Saigon Coffee Pilot (Visual Parity)**
  - **Owner:** Codex
  - **Branch:** `feat/content-renderer`
  - **Scope:** Convert `SaigonCoffeeArticle.tsx` to `ContentDocument` seeded fixture, verify visual parity, SSR, CLS, and responsive layout.
- [ ] **CONTENT-004: Media Core & MarketingMedia Upgrade**
  - **Owner:** Codex
  - **Branch:** `feat/content-media-core`
  - **Scope:** Migration for `MarketingMedia` metadata (`width`, `height`, `mime_type`, `file_size`, `alt_i18n`), server media resolver by `mediaId`, API routes.
- [ ] **CONTENT-005: Media Picker Modal UI**
  - **Owner:** Antigravity
  - **Branch:** `feat/content-media-ui`
  - **Scope:** Reusable `<MediaPickerModal />`, search, type filter, upload integration, selection callback using `MediaAsset` contract.
- [ ] **CONTENT-006: Admin Block Editor MVP**
  - **Owner:** Antigravity
  - **Branch:** `feat/content-editor`
  - **Scope:** Block list, add/insert block between items, delete, duplicate, move up/down, `@dnd-kit` drag-and-drop, multilingual tabs.
- [ ] **CONTENT-007: Image Position Editor (Focal Drag & Frame Controls)**
  - **Owner:** Antigravity
  - **Branch:** `feat/image-position`
  - **Scope:** Fixed frame, pointer/touch image drag, normalized percentage output (`x`, `y` 0-100), safe zoom (1.0-2.0), reset control.
- [ ] **CONTENT-008: Draft / Preview / Publish / Version History**
  - **Owner:** Codex
  - **Branch:** `feat/content-publishing`
  - **Scope:** Decoupled `current_draft_version_id` vs `current_published_version_id`, version snapshot persistence, preview token endpoint, restore.
- [ ] **CONTENT-009: Local Tour Migration (Pilot B)**
  - **Owner:** Codex
  - **Branch:** `feat/content-migration`
  - **Scope:** Eliminate `pIdx === 0` / `pIdx === 1` index-based media coupling in `LocalTourPackagePage.tsx`, verify dynamic image placement.
- [ ] **CONTENT-010: Production Hardening & Regression Verification**
  - **Owner:** Both Agents
  - **Branch:** `feat/content-hardening`
  - **Scope:** Full audit, CWV, security, mobile/tablet/desktop verification, absolute verification that booking flows remain 100% untouched.

---

## 3. COMPLETED
- None yet. (Phase 0 in final review).
