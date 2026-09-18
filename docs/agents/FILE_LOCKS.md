# File Locks & Scope Isolation Registry

**Project:** NganHa-WebBooking — Dynamic Content Block System  
**Framework:** Codex & Antigravity Dual-Agent Model  
**Last Updated:** 2026-09-18  

---

## 1. Active Locks

### Codex Exclusive Lock
Only Codex may modify, add, or delete files in these paths. Antigravity must never commit to these directories without an approved Change Request (`docs/content-system/requests/CR-XXX.md`).

```text
src/types/content/**
src/lib/content/**
src/components/ContentRenderer/**
src/app/api/content/**
src/app/api/admin/content/**
supabase/migrations/**
```

### Antigravity Exclusive Lock
Only Antigravity may modify, add, or delete files in these paths during UI implementation phases.

```text
src/components/admin/ContentEditor/**
src/components/admin/MediaPicker/**
src/components/admin/ImagePositionEditor/**
src/app/admin/posts/**
```

### Shared / Protected Files (Mutual Sign-off Required)
Both agents must verify before modifying:

```text
package.json
package-lock.json
docs/content-system/**
```

### Phase 0 Freeze Record

`docs/content-system/CONTENT_CONTRACT_V1.md` is frozen at version `1.0.0` on
`review/content-contract-codex`. Future changes require a Change Request at
`docs/content-system/requests/CR-XXX.md`; no agent may silently alter block
schemas, URL rules, locale behavior, media references, or draft/publish
semantics.

Phase 0 review did not authorize Phase 1 implementation. The first renderer,
schema, media, or publishing code change must be made in its assigned feature
branch and must preserve the protected booking scope below.

### Review-confirmed implementation gates

- Content Builder uploads must pass the server-side upload validator before a
  `MarketingMedia` record is created.
- Public content reads must resolve only `current_published_version_id`.
- `WebbookingContentRevisions` remains an audit log, not a replacement for
  immutable content versions.

---

## 2. Absolutely Protected Files (FORBIDDEN SCOPE)
Under no circumstances may ANY content system task touch, edit, or refactor the following mission-critical business and booking paths:

```text
src/lib/bookingCartStorage.ts
src/lib/booking/**
src/components/Cart/**
src/components/Checkout/**
src/components/CustomForYou/**
src/components/BodyMap/**
src/app/api/bookings/**
src/app/api/checkout/**
src/app/api/payments/**
src/app/[lang]/new-user/**/checkout/**
```
*Any commit altering files in this forbidden scope constitutes an immediate blocker and deployment violation.*
