# Content Contract V1 — Specification & Type System

**Contract Version:** 1.0.0
**Status:** FROZEN (APPROVED WITH CORRECTIONS)
**Frozen By:** Codex Phase 0 Architecture Review
**Target Branch:** `review/content-contract-codex`
**Date:** 2026-09-18  

> This is the frozen Phase 0 contract. It describes the persisted contract and
> the server-prepared render boundary; it does not mean the Phase 1 renderer,
> editor, migrations, or media upgrade have been implemented.

---

## 1. Overview & Architectural Principles

The Content Contract V1 establishes the formal, type-safe data schema for the Dynamic Content Block System of `NganHa-WebBooking`.

### Core Axioms
1. **Single Data-Driven Tree:** One ordered array of content blocks (`blocks[]`) represents the document structure across all supported locales.
2. **Internal Content Localization:** Language variants (`vi`, `en`, `cn`, `jp`, `kr`) are stored inside block properties (`LocalizedValue<T>`), guaranteeing that structural reordering in the Admin editor remains synchronized across all languages without diverging page structures.
3. **Media ID as Source of Truth:** Internal image and video blocks reference assets by `mediaId` (pointing to `MarketingMedia.id`). Public URLs are resolved dynamically or cached safely, preventing stale URL breakage.
4. **Block-Instance Specific Framing:** Crop aspect ratios, object-fit, focal point coordinates, and zoom are properties of the *block instance*, not mutable attributes of the source asset.
5. **Normalized Focal Coordinates:** Image positioning is persisted as normalized percentage coordinates (`x: 0-100`, `y: 0-100`), guaranteeing responsive stability across any viewport size. Raw pixel coordinates (`left: -120px`, `top: -45px`) are strictly forbidden.
6. **No Arbitrary HTML / CSS Injection:** Admin inputs are constrained to semantic typography and design tokens. Raw HTML, CSS class injection (`customClass`), and arbitrary JavaScript are rejected at both API and validation boundaries.
7. **Strict Schema Versioning:** Every document declares `schemaVersion: 1`. Future breaking enhancements must provide automated forward migration functions.

### Codex review outcome

The contract is frozen after independent source, migration, API, RLS, upload,
localization, legacy-rendering, and Next.js boundary review. The corrections
are limited to contract safety and repository compatibility:

- localized fallback order is explicit: requested locale, then `en`, then `vi`;
- persisted documents contain media IDs and composition only; resolved assets
  are server-prepared render data and are never written back to JSONB;
- internal video uses `mediaId`; external YouTube/Vimeo uses an explicit URL
  source;
- rich-text links and external media URLs use the same safe-protocol rules as
  other content URLs;
- unknown blocks and unsupported future schema versions are skipped or routed
  to legacy fallback, never unsafely cast into a renderable document;
- draft/publish API and RLS requirements are explicit, including the existing
  `WebbookingContentRevisions` audit-only role and the current mutable blog row
  as a legacy fallback during migration.

---

## 2. Localization Core Types

Matches existing application constants in `src/lib/constants.ts`:
- Supported locales: `'vi' | 'en' | 'cn' | 'jp' | 'kr'`
- Default locale: `'vi'`

```typescript
export const SUPPORTED_LOCALES = ['vi', 'en', 'cn', 'jp', 'kr'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export type LocalizedValue<T> = {
  [K in SupportedLocale]?: T;
};

/** Required editorial baseline; optional locales remain sparse by design. */
export type RequiredLocalizedValue<T> = LocalizedValue<T> & { vi: T };

/** Backward-compatible name for localized strings; use RequiredLocalizedValue
 * where a block requires a baseline value. */
export type LocalizedString = LocalizedValue<string>;

/**
 * Runtime fallback used by public and preview renderers. Structural blocks are
 * never duplicated per locale; only values fall back.
 */
export const LOCALIZED_FALLBACK_ORDER = ['requested-locale', 'en', 'vi'] as const;
```

---

## 3. Media Types & Focal Point Contract

### 3.1 Focal Point & Zoom
```typescript
export interface FocalPoint {
  /** Horizontal center percentage: 0 (left edge) to 100 (right edge). Default: 50 */
  x: number;
  /** Vertical center percentage: 0 (top edge) to 100 (bottom edge). Default: 50 */
  y: number;
}

/**
 * Zoom constraints:
 * Minimum: 1.0 (natural fit/cover, no scaling)
 * Maximum: 2.0 (2x magnification)
 * Step: 0.05
 * Default: 1.0
 */
export type ZoomLevel = number;
```

### 3.2 Media Asset (Database / Entity Representation)
Reflects enhanced `MarketingMedia` table in Supabase:

```typescript
export interface MediaAsset {
  id: string; // UUID PK
  title: string;
  type: 'image' | 'video';
  url: string;
  source: 'supabase' | 'external' | 'gdrive';
  width: number | null;
  height: number | null;
  mime_type: string | null;
  file_size: number | null;
  alt_i18n?: LocalizedValue<string>;
  default_focal_point?: FocalPoint | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type MediaReference =
  | {
      type: 'internal';
      mediaId: string;
    }
  | {
      type: 'external';
      url: string;
      width?: number;
      height?: number;
      alt?: LocalizedValue<string>;
    };

/**
 * Resolver output only. `asset` is never persisted inside ContentDocument or
 * ContentVersion.document and must not be accepted by the persistence schema.
 */
export type ResolvedMediaReference =
  | { type: 'internal'; mediaId: string; asset: MediaAsset }
  | Extract<MediaReference, { type: 'external' }>;
```

---

## 4. Rich Text Document Model

To eliminate raw HTML and XSS vulnerabilities, Rich Text is modeled as a structured JSON AST (compatible with ProseMirror / Tiptap node formats) rather than unconstrained markup.

```typescript
export interface RichTextMark {
  type: 'bold' | 'italic' | 'underline' | 'link';
  attrs?: {
    href?: string;
    target?: '_blank' | '_self';
    rel?: string;
  };
}

export interface RichTextNode {
  type: 'paragraph' | 'bulletList' | 'orderedList' | 'listItem' | 'hardBreak' | 'text';
  text?: string;
  marks?: RichTextMark[];
  content?: RichTextNode[];
}

export interface RichTextDocument {
  type: 'doc';
  content: RichTextNode[];
}
```

---

## 5. Content Block Specifications (Phase 1)

### 5.1 Base Block Settings
```typescript
export type BlockWidth = 'narrow' | 'content' | 'wide' | 'full';
export type BlockSpacing = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface BaseBlockSettings {
  width?: BlockWidth;
  spacingTop?: BlockSpacing;
  spacingBottom?: BlockSpacing;
  visibility?: Partial<Record<SupportedLocale, boolean>>;
}

export interface BaseBlock {
  id: string; // Unique block instance ID (UUID v4 or nanoid)
  type: string;
  settings?: BaseBlockSettings;
}
```

### 5.2 Heading Block
```typescript
export interface HeadingBlockProps {
  text: LocalizedValue<string>;
  level: 2 | 3 | 4; // H1 is reserved for page header / hero
  align?: 'left' | 'center' | 'right';
  subtitle?: LocalizedValue<string>;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  props: HeadingBlockProps;
}
```

### 5.3 Rich Text Block
```typescript
export interface RichTextBlockProps {
  content: LocalizedValue<RichTextDocument>;
}

export interface RichTextBlock extends BaseBlock {
  type: 'richText';
  props: RichTextBlockProps;
}
```

### 5.4 Image Block
```typescript
export type ImageAspectRatio = 'original' | '16:9' | '4:3' | '3:2' | '1:1' | '3:4';
export type ImageFit = 'cover' | 'contain';
export type ImagePresentation = 'contained' | 'wide' | 'full' | 'framed';

export interface ImageBlockProps {
  mediaId: string; // References MarketingMedia.id
  aspectRatio?: ImageAspectRatio; // Default: '16:9'
  fit?: ImageFit; // Default: 'cover'
  focalPoint?: FocalPoint; // Default: { x: 50, y: 50 }
  zoom?: ZoomLevel; // Default: 1.0 (bounds: 1.0 - 2.0)
  presentation?: ImagePresentation; // Default: 'contained'
  alt?: LocalizedValue<string>;
  caption?: LocalizedValue<string>;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  props: ImageBlockProps;
}

/** Server-prepared props used by the renderer; not part of persisted V1. */
export interface ResolvedImageBlockProps extends ImageBlockProps {
  resolvedAsset: MediaAsset;
}
```

### 5.5 Gallery Block
```typescript
export interface GalleryItem {
  id: string;
  mediaId: string;
  alt?: LocalizedValue<string>;
  caption?: LocalizedValue<string>;
  focalPoint?: FocalPoint;
}

export type GalleryLayout = 'grid-2' | 'grid-3' | 'grid-4' | 'masonry' | 'carousel';

export interface GalleryBlockProps {
  items: GalleryItem[];
  layout: GalleryLayout;
  aspectRatio?: ImageAspectRatio;
}

export interface GalleryBlock extends BaseBlock {
  type: 'gallery';
  props: GalleryBlockProps;
}

/** Resolver output only; never persisted in the content document. */
export interface ResolvedGalleryItem extends GalleryItem {
  resolvedAsset: MediaAsset;
}
```

### 5.6 Quote Block
```typescript
export type QuoteVariant = 'bordered' | 'centered-serif' | 'ornate-gold';

export interface QuoteBlockProps {
  quote: LocalizedValue<string>;
  author?: LocalizedValue<string>;
  role?: LocalizedValue<string>;
  variant?: QuoteVariant;
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  props: QuoteBlockProps;
}
```

### 5.7 Video Block
```typescript
export type VideoProvider = 'youtube' | 'vimeo' | 'storage';

export type VideoSource =
  | {
      type: 'internal';
      mediaId: string;
    }
  | {
      type: 'external';
      provider: Exclude<VideoProvider, 'storage'>;
      url: string;
    };

export interface VideoBlockProps {
  source: VideoSource;
  posterMediaId?: string;
  caption?: LocalizedValue<string>;
  autoplay?: boolean;
}

export interface VideoBlock extends BaseBlock {
  type: 'video';
  props: VideoBlockProps;
}
```

### 5.8 CTA Block
```typescript
export type CTAVariant = 'gold-solid' | 'gold-outline' | 'dark-luxury';

export interface CTABlockProps {
  title: LocalizedValue<string>;
  subtitle?: LocalizedValue<string>;
  buttonText: LocalizedValue<string>;
  buttonUrl: string; // Validated relative URL or https/mailto/tel
  variant: CTAVariant;
}

export interface CTABlock extends BaseBlock {
  type: 'cta';
  props: CTABlockProps;
}
```

### 5.9 Divider Block
```typescript
export type DividerStyle = 'subtle-line' | 'gold-flourish' | 'diamond-dots';

export interface DividerBlockProps {
  style: DividerStyle;
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
  props: DividerBlockProps;
}
```

### 5.10 Content Block Union
```typescript
export type ContentBlock =
  | HeadingBlock
  | RichTextBlock
  | ImageBlock
  | GalleryBlock
  | QuoteBlock
  | VideoBlock
  | CTABlock
  | DividerBlock;
```

---

## 6. Content Document Interface

```typescript
export interface ContentDocument {
  schemaVersion: 1;
  blocks: ContentBlock[];
}
```

---

## 7. Versioning & Publication Entity Model

To isolate draft authoring from the live public site, content entities decouple current published versions from current draft versions.

```typescript
export interface ContentVersion {
  id: string; // UUID PK
  entity_type: 'blog_post' | 'content_page';
  entity_id: string; // UUID referencing parent entity
  version_number: number;
  schema_version: number;
  document: ContentDocument;
  created_by: string | null;
  created_at: string;
  published_at: string | null;
}

export interface ContentEntityRef {
  id: string;
  slug: string;
  current_draft_version_id: string | null;
  current_published_version_id: string | null;
  updated_at: string;
}
```

---

## 8. API Data Transfer Objects (DTOs)

### 8.1 Read Draft / Admin State
- `GET /api/admin/content/:entityType/:id`
```typescript
export interface ContentDraftResponse {
  entityId: string;
  slug: string;
  schemaVersion: number;
  draftVersionId: string | null;
  publishedVersionId: string | null;
  document: ContentDocument | null;
  lastSavedAt: string;
}
```

### 8.2 Save Draft
- `PUT /api/admin/content/:entityType/:id/draft`
```typescript
export interface SaveDraftRequest {
  document: ContentDocument;
  expectedDraftVersionId?: string | null;
  title_i18n?: LocalizedValue<string>;
  seo_metadata?: Record<string, unknown>;
}

export interface SaveDraftResponse {
  success: boolean;
  versionId: string;
  versionNumber: number;
  savedAt: string;
}
```

### 8.3 Publish Version
- `POST /api/admin/content/:entityType/:id/publish`
```typescript
export interface PublishVersionRequest {
  versionId?: string; // Optional: if omitted, publishes current draft version
  expectedPublishedVersionId?: string | null;
}

export interface PublishVersionResponse {
  success: boolean;
  publishedVersionId: string;
  versionNumber: number;
  publishedAt: string;
}
```

### 8.4 Version History & Restore
- `GET /api/admin/content/:entityType/:id/versions`
```typescript
export interface VersionSummary {
  id: string;
  versionNumber: number;
  schemaVersion: number;
  created_at: string;
  published_at: string | null;
  created_by: string | null;
  isPublished: boolean;
  isCurrentDraft: boolean;
}
```

- `POST /api/admin/content/:entityType/:id/restore`
```typescript
export interface RestoreVersionRequest {
  sourceVersionId: string;
}
```

### 8.5 Public published read

Public loaders/routes may expose only the version resolved through
`current_published_version_id`:

```typescript
export interface PublishedContentResponse {
  entityId: string;
  slug: string;
  schemaVersion: number;
  document: ContentDocument;
  publishedVersionId: string;
  publishedAt: string;
}
```

The public contract does not accept a version ID, draft flag, preview token, or
arbitrary `entity_id`. Preview is a separate authenticated/expiring flow and
must use the same renderer with a server-authorized draft DTO.

### 8.6 DTO and persistence boundaries

- `ContentVersion.document` contains only the persisted V1 shape.
- `resolvedAsset`, signed URLs, diagnostics, and other resolver data are
  server-only render DTO fields.
- Publish must verify that the requested version belongs to the entity, is a
  valid current draft (or an explicitly restored draft), passes the same Zod
  document validation, and satisfies the optimistic-concurrency precondition.
- The API must never accept a client-supplied `publishedVersionId` as a direct
  public read selector.

## 9. Repository-specific database and RLS boundary

The current repository has two distinct legacy layers:

- `WebbookingBlogPosts` is a mutable blog entity with localized metadata and a
  string-oriented `content` JSONB field.
- `WebbookingContentRevisions` is an append-only audit log keyed by
  `content_key`; it is not a version table and must not be repurposed as one.
- `SystemConfigs`/`WebBookingContent` remain transitional sources for existing
  editable pages and must not become the permanent Content Builder CMS.

The frozen V1 direction is:

1. Keep `WebbookingBlogPosts` as the blog entity and keep its legacy columns
   available for dual-mode fallback during migration.
2. Add a dedicated `WebbookingContentVersions` snapshot table and pointer
   columns on the relevant entity records, or introduce a shared content-entity
   registry if a relational foreign key is required across blog/page types.
3. Use `WebbookingContentPages` for new structured editorial pages such as
   Local Tour, Home Spa, Academy, and Our Story where appropriate.
4. Treat `entity_type + entity_id` as a polymorphic boundary only if the
   migration adds explicit integrity protection (central registry, trigger, or
   equivalent). A bare polymorphic pair without integrity or authorization is
   not an approved implementation.
5. Public reads select only the published pointer. Draft saves update only the
   draft pointer and insert an immutable snapshot. Publishing atomically moves
   the published pointer to the chosen validated draft.

RLS/ACL requirements:

- Admin mutations and preview use server route handlers protected by the
  existing `content.read`, `content.write`, and `content.publish` capability
  checks. The service-role client is server-only and must never reach a client
  component.
- Browser roles receive no direct draft/version write access. If public table
  reads are ever enabled, the policy must allow only the published pointer; a
  service-role public route is acceptable only when the route itself enforces
  the published-pointer predicate.
- `WebbookingContentRevisions` remains an audit trail for legacy/config writes;
  it does not satisfy immutable snapshot, restore, or draft isolation
  requirements.
- Preview tokens must be scoped to an entity/version, short-lived, and
  non-indexable. No draft JSON may be returned by the normal public endpoint.

## 10. Legacy dual-mode and renderer boundary

The initial public integration must preserve:

```text
published ContentDocument -> server ContentRenderer
otherwise                -> existing legacy renderer
```

The current `/blogs` page is a client component that fetches post summaries in
`useEffect`; it is not an SSR article renderer. Phase 1 must therefore keep the
public `ContentRenderer` server-safe and introduce any client behavior (modal,
carousel, video controls) as narrow client islands. It must not move the
existing booking or global content state into public rendering.

The current `SaigonCoffeeArticle`, Local Tour, Home Spa, and Our Story
components remain legacy renderers until an approved migration/pilot replaces
them. The content contract does not require a mass migration.

## 11. Media/upload gate before Content Builder use

`MarketingMedia` currently has only identity, URL, type, source, and timestamp
columns. Dimensions, MIME, file size, localized alt, metadata, and updated time
are additive Phase 3 work; the resolver must tolerate missing legacy metadata.

The existing Media Library has a client-side direct storage upload path that
registers the URL through JSON, while the server multipart route calls
`validateUpload`. Content Builder must use the server-validated multipart path
or an equivalent server-side validation flow. It must not treat the current
client upload path as proof of magic-byte validation.

The source file remains pristine; only block-instance framing (`aspectRatio`,
`fit`, `focalPoint`, `zoom`, `presentation`) is persisted.

---

## 12. Zod Validation Boundaries (Architecture Specification)

When implemented in Phase 1 (`src/lib/content/schemas/`), validation will enforce:

1. **Locale Keys:** Only keys matching `SUPPORTED_LOCALES` (`vi`, `en`, `cn`, `jp`, `kr`).
2. **Focal Point Range:** `x` and `y` must be integers or floating numbers bounded between `0` and `100`.
3. **Zoom Level:** Number between `1.0` and `2.0`.
4. **URL Protocols:**
   - Image/Video: Must start with `http://`, `https://`, or be relative `/`.
   - CTA: Reject `javascript:`, `data:`, `vbscript:`. Allow `/`, `https://`, `mailto:`, `tel:`.
   - Rich-text links and external media: reject `javascript:`, `data:`, `vbscript:`, `file:`, and protocol-relative URLs; allow only relative `/`, `https://`, and the explicitly supported `mailto:`/`tel:` forms.
5. **Aspect Ratio:** Enforce enum `['original', '16:9', '4:3', '3:2', '1:1', '3:4']`.
6. **Zoom Step:** Persisted zoom must be within `1.0..2.0` and represent a `0.05` step; UI controls must use the same bounds.
7. **Rich Text AST:** Only the declared node/mark types and attributes are accepted. Unknown nodes, unknown marks, excessive depth, and malformed child arrays are rejected or omitted by the safe parser.
8. **Block Type Guards:** Unknown block types in raw JSON are reported and skipped by the safe parser rather than throwing an unhandled exception. The canonical `ContentBlock` union contains only supported V1 blocks.
9. **Hydration Boundary:** `resolvedAsset` and any resolver cache fields are rejected by persistence Zod schemas and may appear only in a server-prepared render DTO.

---

## 13. Forward Schema Migration Strategy

```typescript
export type MigrationFn = (doc: unknown) => ContentDocument;

export const SCHEMA_MIGRATIONS: Record<number, MigrationFn> = {
  // 1 -> 2 placeholder for future contract enhancements
};

export interface ContentDocumentReadResult {
  document: ContentDocument;
  skippedBlockIds: string[];
  unsupportedSchemaVersion?: number;
}

// Implemented in Phase 1 as a safe Zod boundary; raw JSON is never cast.
declare function safeParseContentDocument(rawDoc: unknown): ContentDocumentReadResult;

export function migrateToLatestSchema(rawDoc: unknown): ContentDocument {
  if (!rawDoc || typeof rawDoc !== 'object' || Array.isArray(rawDoc)) {
    return { schemaVersion: 1, blocks: [] };
  }
  let currentVersion = typeof (rawDoc as { schemaVersion?: unknown }).schemaVersion === 'number'
    ? (rawDoc as { schemaVersion: number }).schemaVersion
    : 1;
  if (!Number.isInteger(currentVersion) || currentVersion < 1 || currentVersion > 1) {
    return { schemaVersion: 1, blocks: [] };
  }
  let doc: unknown = rawDoc;
  while (SCHEMA_MIGRATIONS[currentVersion]) {
    doc = SCHEMA_MIGRATIONS[currentVersion](doc);
    const nextVersion = (doc as { schemaVersion?: unknown }).schemaVersion;
    if (typeof nextVersion !== 'number' || !Number.isInteger(nextVersion) || nextVersion <= currentVersion) {
      return { schemaVersion: 1, blocks: [] };
    }
    currentVersion = nextVersion;
  }
  return safeParseContentDocument(doc).document;
}
```
