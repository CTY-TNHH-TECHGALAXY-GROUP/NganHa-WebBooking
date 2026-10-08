# Content Contract V1 — Specification & Type System

**Contract Version:** 1.0.0-draft  
**Status:** PROPOSED BY ANTIGRAVITY (Awaiting Codex Phase 0 Review & Freeze)  
**Target Branch:** `feat/content-contract-antigravity`  
**Date:** 2026-09-18  

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

/** Strict localized string requiring at least Vietnamese as primary baseline */
export interface LocalizedString extends LocalizedValue<string> {
  vi?: string;
  en?: string;
  cn?: string;
  jp?: string;
  kr?: string;
}
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
      asset?: MediaAsset; // Populated by server resolver
    }
  | {
      type: 'external';
      url: string;
      width?: number;
      height?: number;
      alt?: LocalizedValue<string>;
    };
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
  resolvedAsset?: MediaAsset; // Hydrated on server
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  props: ImageBlockProps;
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
  resolvedAsset?: MediaAsset;
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

export interface VideoBlockProps {
  provider: VideoProvider;
  url: string;
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
  document: ContentDocument;
  lastSavedAt: string;
}
```

### 8.2 Save Draft
- `PUT /api/admin/content/:entityType/:id/draft`
```typescript
export interface SaveDraftRequest {
  document: ContentDocument;
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

---

## 9. Zod Validation Boundaries (Architecture Specification)

When implemented in Phase 1 (`src/lib/content/schemas/`), validation will enforce:

1. **Locale Keys:** Only keys matching `SUPPORTED_LOCALES` (`vi`, `en`, `cn`, `jp`, `kr`).
2. **Focal Point Range:** `x` and `y` must be integers or floating numbers bounded between `0` and `100`.
3. **Zoom Level:** Number between `1.0` and `2.0`.
4. **URL Protocols:**
   - Image/Video: Must start with `http://`, `https://`, or be relative `/`.
   - CTA: Reject `javascript:`, `data:`, `vbscript:`. Allow `/`, `https://`, `mailto:`, `tel:`.
5. **Aspect Ratio:** Enforce enum `['original', '16:9', '4:3', '3:2', '1:1', '3:4']`.
6. **Block Type Guards:** Unknown block types in JSON are validated gracefully by the fallback parser rather than throwing unhandled exceptions.

---

## 10. Forward Schema Migration Strategy

```typescript
export type MigrationFn = (doc: any) => ContentDocument;

export const SCHEMA_MIGRATIONS: Record<number, MigrationFn> = {
  // 1 -> 2 placeholder for future contract enhancements
};

export function migrateToLatestSchema(rawDoc: any): ContentDocument {
  if (!rawDoc || typeof rawDoc !== 'object') {
    return { schemaVersion: 1, blocks: [] };
  }
  let currentVersion = rawDoc.schemaVersion ?? 1;
  let doc = rawDoc;
  while (SCHEMA_MIGRATIONS[currentVersion]) {
    doc = SCHEMA_MIGRATIONS[currentVersion](doc);
    currentVersion = doc.schemaVersion;
  }
  return doc as ContentDocument;
}
```
