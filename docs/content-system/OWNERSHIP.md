# Content System — Multi-Agent Ownership & Governance Matrix

**Project:** NganHa-WebBooking — Dynamic Content Block System  
**Framework:** Codex & Antigravity Dual-Agent Model  
**Date:** 2026-09-18  

---

## 1. Domain Ownership Split

| Component / Subsystem | Primary Owner | Secondary Reviewer | Primary Directory / Locked Scope |
|---|---|---|---|
| **Content Document Contract & Types** | **Codex** | Antigravity | `src/types/content/**` |
| **Zod Validation Schemas** | **Codex** | Antigravity | `src/lib/content/schemas/**` |
| **Database Migrations & RLS** | **Codex** | Antigravity | `supabase/migrations/**` |
| **Content APIs & DTOs** | **Codex** | Antigravity | `src/app/api/content/**`, `src/app/api/admin/content/**` |
| **ContentRenderer & Block Registry** | **Codex** | Antigravity | `src/components/ContentRenderer/**` |
| **Public Block Renderers** | **Codex** | Antigravity | `src/components/ContentRenderer/blocks/**` |
| **Draft / Publish / Versioning Engine** | **Codex** | Antigravity | `src/lib/content/publishing/**` |
| **Legacy Migration & Dual-Mode Fallback** | **Codex** | Antigravity | `src/lib/content/legacy/**` |
| **Integration Gatekeeping & Merge Review** | **Codex** | Tech Lead | Integration branches |
| **Admin Block Editor Shell & Layout** | **Antigravity** | Codex | `src/components/admin/ContentEditor/**` |
| **Drag & Drop Interactions (@dnd-kit)** | **Antigravity** | Codex | `src/components/admin/ContentEditor/dnd/**` |
| **Block Inserter & Block Controls UI** | **Antigravity** | Codex | `src/components/admin/ContentEditor/controls/**` |
| **Media Picker Modal UI** | **Antigravity** | Codex | `src/components/admin/MediaPicker/**` |
| **Image Position Editor (Focal Drag)** | **Antigravity** | Codex | `src/components/admin/ImagePositionEditor/**` |
| **Rich Text Editor UI (Tiptap / ProseMirror)**| **Antigravity** | Codex | `src/components/admin/RichTextEditor/**` |
| **Responsive Admin UX & Visual QA** | **Antigravity** | Codex | All Admin UI surfaces |

---

## 2. Directory Locks & Access Policies

### Codex Lock (Exclusive Mutation Authority)
```text
src/content/**
src/types/content/**
src/lib/content/**
src/components/ContentRenderer/**
src/app/api/content/**
src/app/api/admin/content/**
supabase/migrations/**
```
*Antigravity must not directly commit changes to these directories without an approved Change Request (`CR-XXX.md`).*

### Antigravity Lock (Exclusive UI/Interaction Authority)
```text
src/components/admin/ContentEditor/**
src/components/admin/MediaPicker/**
src/components/admin/ImagePositionEditor/**
src/app/admin/posts/**
```
*Codex must not alter UI interaction behavior or styling in these components without coordination.*

### Shared Review Required
```text
package.json
package-lock.json
docs/content-system/**
```
*Any addition of external libraries (e.g. `@dnd-kit`, `@tiptap`, `zod`) requires shared sign-off to ensure bundle budget and Next.js 15 / React 19 compatibility.*

---

## 3. Contract Governance & Change Request Protocol

Once `CONTENT_CONTRACT_V1.md` is reviewed and marked `FROZEN` by Codex:
1. **Zero Silent Modifications:** Antigravity must never alter type definitions, block schemas, database column names, or Zod rules silently.
2. **Change Request Workflow:** If an Admin UI requirement reveals a limitation in the contract (e.g. needing an additional variant or property):
   - Antigravity creates a formal Change Request file: `docs/content-system/requests/CR-XXX.md`.
   - Codex reviews the request for backward compatibility, database impact, and SSR implications.
   - If accepted, Codex updates the contract and implements necessary schema/renderer support.
   - Antigravity then integrates the new property into the Admin UI.
