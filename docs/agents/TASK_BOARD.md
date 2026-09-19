# Content Builder Multi-Agent Task Board

**Project:** NganHa-WebBooking — Dynamic Content Block System
**Current Branch:** `feat/content-media-ui`
**Last Updated:** 2026-09-19

---

## 1. DONE
- [x] **CONTENT-001: Phase 0 Architecture Verification & Contract Definition**
  - **Owner:** Antigravity (Handoff prepared) -> Codex (Review & Freeze)
  - **Branch:** `review/content-contract-codex`
  - **Deliverable:** `docs/content-system/CONTENT_CONTRACT_V1.md`, `ARCHITECTURE_DECISIONS.md`, `handoffs/ANTIGRAVITY_PHASE_0.md`
  - **Status:** Approved with corrections. Contract V1.0.0 frozen by Codex. No Phase 1 code started.
- [x] **CONTENT-002: Content Renderer Foundation & Block Registry**
  - **Owner:** Codex
  - **Branch:** `feat/content-renderer`
  - **Deliverable:** Canonical types, Zod validation, parser, locale resolver, media boundary, registry, ContentRenderer, eight core renderers, focused tests, and Phase 1 handoff.
  - **Status:** Completed. Phase 2 intentionally not started.
- [x] **CONTENT-005 (Preparation): Media Picker Modal UI & Content Builder Admin Shell Foundation**
  - **Owner:** Antigravity
  - **Branch:** `feat/content-media-ui`
  - **Deliverable:** `<MediaPickerModal />`, typed mock assets, `<ImagePositionModal />` (focal drag & zoom), 3-panel `<ContentEditor />` admin shell, 8 frozen block toolbar items, ordered block list, card actions, block inspectors, direct route `/admin/posts/builder`, and handoff `ANTIGRAVITY_MEDIA_UI.md`.
  - **Status:** Completed UI preparation. Phase 2 pilot, production persistence, and @dnd-kit integration remain deferred.

---

## 2. READY (Phase 1 complete; Do Not Start Automatically)
- [ ] **CONTENT-003: Saigon Coffee Pilot (Visual Parity)**
  - **Owner:** Codex
  - **Branch:** `feat/content-renderer`
  - **Scope:** Convert `SaigonCoffeeArticle.tsx` to `ContentDocument` seeded fixture, verify visual parity, SSR, CLS, and responsive layout.
- [ ] **CONTENT-004: Media Core & MarketingMedia Upgrade**
  - **Owner:** Codex
  - **Branch:** `feat/content-media-core`
  - **Scope:** Migration for `MarketingMedia` metadata (`width`, `height`, `mime_type`, `file_size`, `alt_i18n`), server media resolver by `mediaId`, API routes.
- [ ] **CONTENT-006: Admin Block Editor MVP (Production DnD & Persistence)**
  - **Owner:** Antigravity
  - **Branch:** `feat/content-editor`
  - **Scope:** Connect Admin UI shell to production API routes, `@dnd-kit` drag-and-drop, full undo/redo.
- [ ] **CONTENT-007: Image Position Editor Production Integration**
  - **Owner:** Antigravity
  - **Branch:** `feat/image-position`
  - **Scope:** Wire ImagePositionModal into production media resolver and draft persistence pipeline.
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

## 3. COORDINATION NOTE

Phase 2 and later production persistence tasks remain eligible but are intentionally not started by
this UI preparation implementation. Any future work must use the frozen contract and the
existing ownership/file-lock rules.
