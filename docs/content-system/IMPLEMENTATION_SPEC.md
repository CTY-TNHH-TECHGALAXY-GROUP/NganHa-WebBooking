# NganHa-WebBooking — Dynamic Content Block System
## Senior Architecture Plan + Coding Agent Implementation Prompt

**Project:** NganHa-WebBooking  
**Stack:** Next.js 15 App Router / React 19 / Supabase PostgreSQL / Tailwind CSS v4  
**Scope:** Content, Articles, Editorial Pages, Media  
**Status:** Architecture approved for implementation planning  
**Date:** 2026-09-18  

---

# 1. Executive Objective

The current website content architecture is too dependent on hard-coded TSX layout structures.

Typical current pattern:

```text
Paragraph 1
Paragraph 2
Paragraph 3
Gallery
```

If Admin later wants:

```text
Paragraph 1
Image
Paragraph 2
Paragraph 3
Gallery
```

a developer currently needs to modify JSX/TSX and redeploy.

This must be eliminated for editorial/content use cases.

The target is a **Structured Dynamic Content Block System** where Admin can independently:

- Add content blocks
- Insert blocks between existing blocks
- Delete blocks
- Duplicate blocks
- Reorder blocks
- Drag-and-drop blocks
- Move blocks up/down
- Replace media
- Add images
- Add galleries
- Add headings
- Add rich text
- Add quotes
- Add videos
- Add CTAs
- Configure controlled presentation settings
- Drag/reposition an uploaded image inside its visual frame
- Preview content
- Save draft
- Publish
- Restore earlier versions

The system must remain constrained by the existing design system and responsive rules.

This is **NOT** a Canva-like builder, Webflow replacement, or arbitrary page layout engine.

---

# 2. Strict Scope

## Included

The dynamic system applies only to:

- Blog posts
- Editorial articles
- Marketing pages
- Story pages
- Academy/editorial content
- Text
- Headings
- Images
- Galleries
- Video
- Quotes
- Dividers
- CTAs
- Content/media composition
- Media positioning inside frames
- Multilingual editorial content

## Explicitly Excluded

Do NOT expose these to the Content Builder:

- Booking logic
- Cart
- Checkout
- Pricing
- Service duration
- Quantity calculations
- Custom For You logic
- Focus / Avoid
- Body Map logic
- KTV allocation
- Customer authentication
- Payment
- Therapist dispatch
- Operational workflow
- Business database rules

Dynamic content must stay isolated from transactional/business logic.

---

# 3. Confirmed Current Codebase Facts

Based on the architectural audit:

## Stack

- Next.js `^15.5.14`
- React `19`
- App Router
- Supabase PostgreSQL
- Supabase Storage
- Tailwind CSS v4
- Framer Motion
- GSAP

## Current Hard-Coding Problems

Examples include:

- `src/components/Blogs/BlogsPage.tsx`
  - Blog body is split by `\n\n`
  - Only paragraphs can be rendered
- `src/components/LocalTour/LocalTourPackagePage.tsx`
  - Uses logic such as:
    - `pIdx === 0 -> storyPhotos[0]`
    - `pIdx === 1 -> storyPhotos[1]`
- `src/components/HomeSpa/HomeSpaPage.tsx`
  - Similar index-based media interleaving
- `src/components/OurStory/OurStory.tsx`
  - Fixed editorial section structure
- `src/components/Blogs/SaigonCoffeeArticle.tsx`
  - Rich content but hard-coded directly in TSX

## Current Content Storage

Relevant existing structures:

- `public.WebbookingBlogPosts`
- `public.SystemConfigs`
- `public.WebbookingContentRevisions`
- `public.MarketingMedia`

## Existing Media Infrastructure

- Supabase Storage
- Bucket: `media-uploads`
- Marketing media folder convention
- Upload validation already exists
- Existing Admin Media Library exists

## Missing Infrastructure

Currently no:

- Block model
- Universal Content Renderer
- Block Registry
- Drag-and-drop library
- Rich text editor
- Reusable Media Picker
- Proper draft/published version separation
- Content schema version migration system

---

# 4. Final Architecture Decision

Use a:

# Hybrid Relational Metadata + Typed JSONB Content Document

Do NOT model every content block as separate relational rows.

Do NOT store arbitrary HTML as the primary content format.

Do NOT build a generic visual website builder.

Use relational tables for:

- identity
- slug
- metadata
- SEO
- status
- timestamps
- versions
- publication pointers

Use JSONB for the ordered block composition.

Conceptually:

```text
Content Entity
    |
    +-- metadata
    +-- draft version
    +-- published version

Content Version
    |
    +-- schemaVersion
    +-- blocks[]
```

---

# 5. Core Content Model

## Content Document

```ts
export interface ContentDocument {
  schemaVersion: 1;
  blocks: ContentBlock[];
}
```

The order of `blocks[]` is the public rendering order.

Example:

```json
{
  "schemaVersion": 1,
  "blocks": [
    {
      "id": "block-1",
      "type": "richText",
      "props": {
        "content": {
          "vi": [],
          "en": []
        }
      }
    },
    {
      "id": "block-2",
      "type": "image",
      "props": {
        "mediaId": "media-uuid"
      }
    },
    {
      "id": "block-3",
      "type": "richText",
      "props": {
        "content": {
          "vi": [],
          "en": []
        }
      }
    }
  ]
}
```

This directly solves the original problem:

```text
P1
P2
P3
Gallery
```

can become:

```text
P1
Image
P2
P3
Gallery
```

without code changes or deployment.

---

# 6. Phase 1 Block Types

Start with a small controlled block set.

## Required Phase 1 Blocks

1. Heading
2. Rich Text
3. Image
4. Gallery
5. Quote
6. Video
7. CTA
8. Divider

Do not build arbitrary nested layouts in Phase 1.

Do not build a generic Spacer block initially.

Spacing must be controlled through block settings.

---

# 7. Base Block Schema

```ts
export type SupportedLocale =
  | 'vi'
  | 'en'
  | 'cn'
  | 'jp'
  | 'kr';

export interface LocalizedValue<T> {
  vi?: T;
  en?: T;
  cn?: T;
  jp?: T;
  kr?: T;
}

export interface BaseBlock {
  id: string;
  type: string;

  settings?: {
    width?: 'narrow' | 'content' | 'wide' | 'full';

    spacingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';

    spacingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';

    visibility?: Partial<Record<SupportedLocale, boolean>>;
  };
}
```

## Important Restriction

Do NOT expose:

```ts
customClass
```

Do NOT allow Admin to enter arbitrary Tailwind or CSS classes.

Admin chooses semantic design options.

Renderer maps these options to actual CSS.

Example:

```text
wide -> max-w-6xl
content -> max-w-4xl
narrow -> max-w-2xl
```

---

# 8. Heading Block

```ts
export interface HeadingBlock extends BaseBlock {
  type: 'heading';

  props: {
    text: LocalizedValue<string>;

    level: 2 | 3 | 4;

    align?: 'left' | 'center' | 'right';

    subtitle?: LocalizedValue<string>;
  };
}
```

Avoid allowing arbitrary H1 creation inside articles unless explicitly required by SEO/page template rules.

---

# 9. Rich Text Block

Use a controlled Rich Text block rather than plain paragraph strings.

Required supported formatting:

- Bold
- Italic
- Underline
- Hyperlink
- Bullet list
- Numbered list
- Line break

Do NOT allow:

- Arbitrary font family
- Arbitrary font size
- Hex colors
- Raw HTML
- CSS
- JavaScript
- Embedded script tags

Recommended document format:

- Tiptap/ProseMirror JSON
- Lexical JSON
- another structured JSON rich text representation

Do NOT make raw HTML the canonical source of truth.

Concept:

```ts
export interface RichTextBlock extends BaseBlock {
  type: 'richText';

  props: {
    content: LocalizedValue<RichTextDocument>;
  };
}
```

---

# 10. Image Block — Critical Requirement

The Image Block must support:

- Select image from Media Library
- Upload image
- Replace image
- Change frame ratio
- Change fit mode
- Change display width
- Caption
- Localized alt text
- Drag image inside frame
- Move image horizontally
- Move image vertically
- Reset image position
- Optional limited zoom
- Preserve original source file

## Important UX Requirement

Admin must be able to directly drag the image inside the fixed visual frame.

Example:

```text
+--------------------------------------+
|                                      |
|         Drag image to reposition     |
|                                      |
|                PHOTO                 |
|                                      |
+--------------------------------------+
```

The frame stays fixed.

The image moves inside the frame.

This must NOT generate a permanently cropped duplicate image every time the user moves the image.

---

# 11. Image Positioning Architecture

Use focal-position metadata.

Example:

```ts
export interface FocalPoint {
  x: number; // 0 - 100
  y: number; // 0 - 100
}
```

The Image Block stores its own positioning:

```ts
export interface ImageBlock extends BaseBlock {
  type: 'image';

  props: {
    mediaId: string;

    aspectRatio?:
      | 'original'
      | '16:9'
      | '4:3'
      | '3:2'
      | '1:1'
      | '3:4';

    fit?: 'cover' | 'contain';

    focalPoint?: {
      x: number;
      y: number;
    };

    zoom?: number;

    presentation?:
      | 'contained'
      | 'wide'
      | 'full'
      | 'framed';

    alt?: LocalizedValue<string>;

    caption?: LocalizedValue<string>;
  };
}
```

Renderer mapping:

```css
object-fit: cover;
object-position: X% Y%;
```

Example:

```json
{
  "focalPoint": {
    "x": 43,
    "y": 27
  }
}
```

becomes:

```css
object-position: 43% 27%;
```

---

# 12. Image Zoom

Optional but recommended.

Limit zoom to a safe range:

```text
1.0x - 2.0x
```

Do NOT support arbitrary rotation/skew/free transform in Phase 1.

The Content Builder is not an image design application.

---

# 13. Image Position Belongs to the Block Instance

Do NOT store one mandatory global crop/focal position only on `MarketingMedia`.

The same source image may be used differently in different content blocks.

Example:

```text
Article A:
16:9
focus face

Article B:
1:1
focus left

Gallery:
4:3
focus center
```

Therefore:

## Media Asset stores

- Original asset
- Width
- Height
- MIME
- File size
- Base metadata
- Default alt
- Optional default focal point

## Image Block stores

- Frame ratio
- Fit
- Focal point override
- Zoom
- Presentation

This gives every usage instance independent visual positioning.

---

# 14. Future Responsive Focal Position

Phase 1 may use one focal point:

```json
{
  "x": 50,
  "y": 30
}
```

But implementation must not prevent future device-specific positioning.

Future-compatible concept:

```ts
focalPoint?: {
  default: {
    x: number;
    y: number;
  };

  mobile?: {
    x: number;
    y: number;
  };
}
```

Do not build mobile override UI in Phase 1 unless necessary.

But avoid an architecture that makes this migration difficult later.

---

# 15. Gallery Block

```ts
export interface GalleryBlock extends BaseBlock {
  type: 'gallery';

  props: {
    items: Array<{
      id: string;
      mediaId: string;

      alt?: LocalizedValue<string>;

      caption?: LocalizedValue<string>;

      focalPoint?: {
        x: number;
        y: number;
      };
    }>;

    layout:
      | 'grid-2'
      | 'grid-3'
      | 'grid-4'
      | 'masonry'
      | 'carousel';

    aspectRatio?:
      | 'original'
      | '16:9'
      | '4:3'
      | '1:1'
      | '3:4';
  };
}
```

Each gallery item should eventually support its own focal position.

---

# 16. Quote Block

```ts
export interface QuoteBlock extends BaseBlock {
  type: 'quote';

  props: {
    quote: LocalizedValue<string>;

    author?: LocalizedValue<string>;

    role?: LocalizedValue<string>;

    variant?:
      | 'bordered'
      | 'centered-serif'
      | 'ornate-gold';
  };
}
```

---

# 17. Video Block

```ts
export interface VideoBlock extends BaseBlock {
  type: 'video';

  props: {
    provider:
      | 'youtube'
      | 'vimeo'
      | 'storage';

    url: string;

    posterMediaId?: string;

    caption?: LocalizedValue<string>;

    autoplay?: boolean;
  };
}
```

Autoplay must respect browser policies and performance.

---

# 18. CTA Block

```ts
export interface CTABlock extends BaseBlock {
  type: 'cta';

  props: {
    title: LocalizedValue<string>;

    subtitle?: LocalizedValue<string>;

    buttonText: LocalizedValue<string>;

    buttonUrl: string;

    variant:
      | 'gold-solid'
      | 'gold-outline'
      | 'dark-luxury';
  };
}
```

CTA URLs must be validated.

Allowed:

- internal relative URLs
- `https:`
- `http:` if explicitly necessary
- `mailto:`
- `tel:`

Reject JavaScript URLs.

---

# 19. Divider Block

```ts
export interface DividerBlock extends BaseBlock {
  type: 'divider';

  props: {
    style:
      | 'subtle-line'
      | 'gold-flourish'
      | 'diamond-dots';
  };
}
```

---

# 20. Multilingual Strategy

Use one shared block structure across all languages.

Do NOT create five independent block trees in Phase 1.

Correct:

```text
ONE block sequence
|
+-- localized text values
```

Example:

```json
{
  "id": "heading-1",
  "type": "heading",
  "props": {
    "text": {
      "vi": "Body chuyên sâu",
      "en": "Deep Body Treatment",
      "cn": "...",
      "jp": "...",
      "kr": "..."
    }
  }
}
```

When the Admin moves an Image Block from position 5 to position 2:

- VI moves
- EN moves
- CN moves
- JP moves
- KR moves

This keeps layout structure consistent.

## Media Locale Override

The architecture may support future media override per language.

Example:

```ts
mediaId: string;

mediaOverride?: Partial<Record<SupportedLocale, string>>;
```

Useful if an image contains embedded text.

---

# 21. Media Architecture

Continue using:

- `public.MarketingMedia`
- Supabase Storage
- existing upload pipeline

Do NOT rebuild storage from zero.

## Upgrade `MarketingMedia`

Recommended fields:

```text
id
title
type
url
source
tags
width
height
mime_type
file_size
alt_i18n
metadata
created_at
updated_at
```

Optional future fields:

```text
default_focal_x
default_focal_y
blur_data_url
```

Aspect ratio does not necessarily require its own DB column because it can be derived from width/height.

---

# 22. Media ID as Source of Truth

For internally uploaded assets, Image Blocks should reference:

```ts
mediaId
```

Do not duplicate the public URL as the primary canonical reference.

Correct:

```json
{
  "mediaId": "uuid"
}
```

Renderer resolves the latest storage/media information.

For external media, a separate explicit source model may be supported.

Example:

```ts
source:
  | {
      type: 'media';
      mediaId: string;
    }
  | {
      type: 'external';
      url: string;
    };
```

---

# 23. Media Picker

Build a reusable:

```tsx
<MediaPickerModal />
```

It must support:

- Search
- Filter
- Select existing image
- Upload new image
- Image preview
- Return selected media object
- Width/height metadata
- Alt metadata

Flow:

```text
Image Block
    |
    +-- Choose Image
            |
            v
      Media Picker
            |
      Select / Upload
            |
            v
       Image Block
```

Do not require Admin to:

1. open Media Library in another tab
2. copy URL
3. paste URL manually

---

# 24. Admin Block Editor UX

Keep Phase 1 simple.

Prefer a structured Notion-style content editor over a complex three-pane visual page builder.

Example:

```text
CONTENT

[drag] Heading
Body chuyên sâu là gì?

       + Add block

[drag] Rich Text
Body chuyên sâu sử dụng...

       + Add block

[drag] Image
+--------------------------------+
|                                |
|            IMAGE               |
|                                |
+--------------------------------+

       + Add block

[drag] Rich Text
Lớp cân cơ...
```

Each block must support:

```text
Edit
Duplicate
Move Up
Move Down
Delete
```

and drag-and-drop reorder.

---

# 25. Insert Block UX

Admin must be able to insert between any two blocks.

Example:

```text
Paragraph 1

+ Add block here

Paragraph 2
```

Clicking opens:

```text
Heading
Rich Text
Image
Gallery
Quote
Video
CTA
Divider
```

This is a core requirement.

---

# 26. Drag and Drop

Recommended library:

```text
@dnd-kit/core
@dnd-kit/sortable
```

However drag-and-drop must not be the only way to reorder.

Also provide:

- Move Up
- Move Down

This improves:

- accessibility
- mobile usability
- tablet usability
- long-document editing

The array order remains the canonical ordering model.

---

# 27. Image Editor UX

When an Image Block is selected:

```text
IMAGE

+--------------------------------------------------+
|                                                  |
|          Drag image to reposition                |
|                                                  |
|                    IMAGE                         |
|                                                  |
+--------------------------------------------------+

Frame
[ 16:9 ]

Fit
[ Cover ]

Width
[ Wide ]

Zoom
[-] -----------O------- [+]

Position
[ Reset ]
```

Requirements:

- mouse drag
- pointer/touch drag
- image moves inside fixed frame
- live preview
- position persists after save
- reset control
- safe bounds
- no accidental frame movement

---

# 28. Responsive Design Guardrails

Do NOT support free absolute positioning.

No editable:

```text
top
left
right
bottom
x
y
z-index
```

as arbitrary page coordinates.

Admin controls semantic options only.

## Allowed

```text
Width
Alignment
Aspect ratio
Fit
Frame style
Spacing
Gallery layout
Focal point
Zoom
```

Frontend remains responsible for responsive behavior.

Use:

- CSS Grid
- Flexbox
- responsive containers
- aspect-ratio
- `object-fit`
- `object-position`

---

# 29. Do Not Build Nested Layouts in Phase 1

Do not start with:

```text
Section
  Row
    Column
      Column
        Arbitrary Block Tree
```

This creates unnecessary complexity.

Phase 1 must use a flat ordered content block list.

Future layout blocks may be added as controlled presets.

Examples:

```text
Media + Text
Text + Media
Two-column comparison
Cards
FAQ
Before/After
```

These should be predefined components, not arbitrary recursive nesting.

---

# 30. Content Renderer

Build a universal:

```tsx
<ContentRenderer
  document={contentDocument}
  locale={locale}
/>
```

Concept:

```ts
const blockRegistry = {
  heading: HeadingBlockRenderer,
  richText: RichTextBlockRenderer,
  image: ImageBlockRenderer,
  gallery: GalleryBlockRenderer,
  quote: QuoteBlockRenderer,
  video: VideoBlockRenderer,
  cta: CTABlockRenderer,
  divider: DividerBlockRenderer,
};
```

Renderer:

```tsx
document.blocks.map((block) => {
  const Component = blockRegistry[block.type];

  if (!Component) {
    return null;
  }

  return (
    <Component
      key={block.id}
      block={block}
      locale={locale}
    />
  );
});
```

---

# 31. Renderer Requirements

Must be:

- SSR-safe
- SEO-safe
- responsive
- tolerant of malformed/unknown blocks
- consistent with current Oria design system
- optimized for Core Web Vitals

Unknown block types must not crash the entire page.

Behavior:

```text
Unknown block
-> log
-> skip
-> continue rendering remaining article
```

---

# 32. Image Rendering

Use `next/image` where appropriate.

Required:

- known intrinsic width/height
- `sizes`
- aspect-ratio container
- correct `object-fit`
- focal positioning
- no CLS

Example concept:

```tsx
<Image
  src={asset.url}
  alt={resolvedAlt}
  width={asset.width}
  height={asset.height}
  style={{
    objectFit: block.props.fit ?? 'cover',
    objectPosition: `${x}% ${y}%`,
  }}
/>
```

If zoom is enabled, implement it in a controlled wrapper transform without breaking clipping or responsive behavior.

---

# 33. Draft / Publish Architecture

Do NOT use one mutable `content_blocks` field as both live public content and Admin working state.

Separate draft from published versions.

Recommended architecture:

```text
Content Entity
    |
    +-- current_draft_version_id
    |
    +-- current_published_version_id
```

And:

```text
ContentVersion
    |
    +-- id
    +-- entity_id
    +-- version_number
    +-- document JSONB
    +-- created_by
    +-- created_at
    +-- published_at
```

Flow:

```text
Published V12
Admin edits
Draft V13
Admin edits
Draft V14
Publish V14
Public now reads V14
```

Draft changes must not leak to public pages.

---

# 34. Version History

Every publish must create/preserve an immutable content snapshot.

Admin must eventually support:

- View version history
- Compare basic metadata if practical
- Restore earlier version
- Publish restored version

Do not overwrite history in place.

---

# 35. Schema Versioning

Every Content Document must include:

```json
{
  "schemaVersion": 1,
  "blocks": []
}
```

This is mandatory.

Future structural changes must use migrations such as:

```ts
migrateContentDocumentV1ToV2()
```

Old published content must continue rendering.

Do not evolve block schemas in a way that silently breaks historical documents.

---

# 36. Validation Layers

Validation must exist at multiple layers.

```text
Admin Form Validation
        |
        v
API Zod Validation
        |
        v
Database
        |
        v
Renderer Defensive Validation
```

Required checks include:

- valid schema version
- valid block type
- required props
- valid media ID
- safe URL
- allowed CTA protocol
- valid aspect ratio
- focal point range 0-100
- zoom range
- valid locale structure
- valid heading level
- gallery limits if needed

---

# 37. XSS / Security

Do not render arbitrary dynamic HTML through:

```tsx
dangerouslySetInnerHTML
```

unless a specifically sanitized and reviewed rich text pipeline requires it.

Preferred:

- structured rich-text JSON
- renderer-controlled node mapping
- safe URLs
- no custom JavaScript
- no arbitrary class injection
- no arbitrary CSS

---

# 38. Public Rendering Backward Compatibility

Support dual-mode rendering during migration.

Concept:

```ts
if (publishedContentDocumentExists) {
  render ContentRenderer;
} else {
  render legacy content;
}
```

Do not rewrite all pages at once.

---

# 39. Legacy Conversion Strategy

Do NOT mass-convert all legacy content immediately.

Preferred:

```text
Legacy article
      |
      +-- remains legacy until needed
      |
      +-- Admin chooses "Convert to Block Editor"
                |
                v
       one-time conversion
```

For simple blog strings:

```text
split by \n\n
-> convert to RichText blocks
```

Keep original legacy content available until migration is verified.

---

# 40. SystemConfigs Strategy

Do NOT make `SystemConfigs` the permanent architectural home of the new Content Builder.

It may remain as a temporary source during migration.

Long-term use dedicated editorial content entities.

Recommended direction:

```text
WebbookingBlogPosts
```

for blogs.

And a dedicated table such as:

```text
WebbookingContentPages
```

for editable editorial pages.

Example conceptual fields:

```text
id
slug
page_type
title_i18n
seo
current_draft_version_id
current_published_version_id
created_at
updated_at
```

Content versions should live separately.

---

# 41. Recommended Database Direction

Conceptual:

## `WebbookingContentPages`

```text
id UUID PK
slug TEXT UNIQUE
page_type TEXT
title_i18n JSONB
seo JSONB
current_draft_version_id UUID
current_published_version_id UUID
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## `WebbookingContentVersions`

```text
id UUID PK
entity_type TEXT
entity_id UUID
version_number INTEGER
schema_version INTEGER
document JSONB
created_by TEXT/UUID
created_at TIMESTAMPTZ
published_at TIMESTAMPTZ NULL
```

Do not create this exact schema blindly.

First reconcile it with existing Blog Post tables, auth model, revision model, and current API conventions.

---

# 42. Pilot Strategy

Use two different pilots.

## Pilot A — Renderer Proof

Target:

```text
src/components/Blogs/SaigonCoffeeArticle.tsx
```

Goal:

Prove that a rich existing editorial page can be represented with:

- Heading
- Rich Text
- Quote
- Image
- Gallery
- CTA

and render with visual parity.

## Pilot B — Business Pain Proof

Target:

```text
src/components/LocalTour/LocalTourPackagePage.tsx
```

Goal:

Remove hardcoded:

```text
pIdx === 0
pIdx === 1
```

style image insertion.

Prove that Admin can change:

```text
Paragraph
Paragraph
Image
```

to:

```text
Paragraph
Image
Paragraph
```

without developer intervention.

---

# 43. Implementation Roadmap

## Phase 0 — Architecture Contract

Before writing UI, finalize:

- ContentDocument
- Block schemas
- localization model
- media reference model
- image focal point model
- draft/publish model
- version model
- schema versioning
- validation rules

No admin builder yet.

---

## Phase 1 — Renderer Foundation

Implement:

- TypeScript block types
- Zod schemas
- ContentRenderer
- Block Registry
- Heading renderer
- Rich Text renderer
- Image renderer
- Gallery renderer
- Quote renderer
- Video renderer
- CTA renderer
- Divider renderer

Use manually seeded JSON for testing.

Acceptance:

- server rendering works
- mobile works
- tablet works
- desktop works
- no broken SEO
- no layout shift from images
- unknown blocks do not crash page

---

## Phase 2 — Pilot Rendering

Convert Saigon Coffee article into ContentDocument data.

Verify visual parity against existing implementation.

Test:

- SSR
- SEO
- responsive
- CLS
- LCP
- multilingual rendering
- media focal position

---

## Phase 3 — Media Infrastructure Upgrade

Enhance `MarketingMedia`.

Add/reconcile:

- width
- height
- MIME
- file size
- localized alt
- metadata

Build reusable:

```text
MediaPickerModal
```

Add upload/select flow inside Image and Gallery blocks.

---

## Phase 4 — Admin Block Editor MVP

Implement:

- Add block
- Insert between blocks
- Edit block
- Duplicate
- Delete
- Move Up
- Move Down
- Drag-and-drop
- Language tabs
- Media Picker
- Image frame controls
- Image focal positioning drag
- Image reset position
- Optional controlled zoom

This is the core user-value phase.

---

## Phase 5 — Draft / Preview / Publish

Implement:

- Draft versions
- Published versions
- Preview mode
- Publish action
- Revision history
- Restore previous version

Public users must never see unpublished draft changes.

---

## Phase 6 — Legacy Compatibility

Add dual-mode rendering.

Existing legacy pages continue working.

No mass migration required.

Add one-time:

```text
Convert to Block Editor
```

for compatible legacy content.

---

## Phase 7 — Pain-Point Migration

Prioritize:

1. Blogs
2. Local Tour
3. Home Spa
4. Academy/editorial content
5. Our Story where appropriate

Do not migrate transactional booking UI.

---

## Phase 8 — Advanced Content Blocks

Only after Phase 1-7 are stable.

Potential blocks:

- Media + Text
- Text + Media
- FAQ
- Cards
- Before/After
- Carousel
- Embedded Map
- Reusable CTA
- Testimonials
- Timeline

Use controlled presets.

Do not introduce unrestricted nested layout trees.

---

# 44. Acceptance Criteria

## AC-01 Insert Image Between Paragraphs

Given:

```text
P1
P2
P3
Gallery
```

Admin inserts Image between P1 and P2.

Result:

```text
P1
Image
P2
P3
Gallery
```

No source-code change.

No frontend deployment.

---

## AC-02 Reorder Gallery

Admin moves Gallery above P2.

Order persists after save/reload.

No code change.

---

## AC-03 Duplicate Image

Admin duplicates an Image block.

The duplicate receives a new block ID.

Both remain independently editable.

---

## AC-04 Image Presentation

Admin changes:

```text
Contained
-> Wide
```

Responsive layout remains valid across:

- mobile
- tablet
- desktop

---

## AC-05 Multilingual Structure

Admin moves one block.

The same structural order applies across:

- VI
- EN
- CN
- JP
- KR

Localized content remains separate.

---

## AC-06 Version Restore

Admin publishes a bad change.

Admin selects an earlier version.

Restored version can be republished.

No data loss.

---

# 45. Image-Specific Acceptance Criteria

## AC-IMG-01 Drag Inside Frame

1. Admin adds/selects an image.
2. Frame is `16:9`.
3. Image uses `cover`.
4. Admin drags image upward inside frame.
5. `focalPoint.y` changes.
6. Save.
7. Reload.
8. Position is preserved.
9. Public renderer shows identical position.

---

## AC-IMG-02 Horizontal Reposition

Admin drags image left/right.

`focalPoint.x` updates between `0-100`.

No storage duplicate is created.

---

## AC-IMG-03 Frame Change

Admin changes:

```text
16:9 -> 1:1
```

The frame updates immediately.

Admin can reposition image again.

Original media asset is unchanged.

---

## AC-IMG-04 Reset Position

Admin clicks Reset.

Image returns to default:

```text
x: 50
y: 50
zoom: 1
```

or defined asset default focal point.

---

## AC-IMG-05 Zoom Persistence

If zoom is enabled:

1. Admin sets zoom.
2. Save.
3. Reload.
4. Preview.
5. Public render.

All must show the same composition.

---

## AC-IMG-06 Touch Support

On supported Admin tablet/mobile views:

- drag reposition works with pointer/touch
- block drag handle does not conflict with image reposition gesture

Use explicit interaction zones to avoid gesture conflicts.

---

# 46. Coding Agent Instructions

You are now acting as a Senior Full-Stack Engineer implementing a previously approved architecture for `NganHa-WebBooking`.

You MUST follow the architecture defined in this document.

Do not redesign the system independently unless you discover a concrete codebase conflict.

If a codebase conflict exists:

1. document it
2. explain the conflict
3. propose the smallest compatible adjustment
4. do not silently change the architecture

---

# 47. Coding Agent — Mandatory Preliminary Audit

Before changing code, confirm the exact current implementation of:

- `WebbookingBlogPosts`
- `SystemConfigs`
- `WebbookingContentRevisions`
- `MarketingMedia`
- Blog APIs
- Admin post editor
- Media Library
- localization provider
- Supabase client/server utilities
- upload validation
- public blog rendering

Confirm exact current file paths.

Report any differences from the architectural audit.

Do not implement until this verification is complete.

---

# 48. Coding Agent — Implementation Constraints

Do NOT:

- modify booking business logic
- modify checkout
- modify cart
- modify pricing
- modify duration logic
- modify service customization
- modify KTV logic
- modify payment
- convert the website into a generic page builder
- expose raw CSS
- expose arbitrary class names
- expose arbitrary JavaScript
- use absolute coordinate positioning for page composition
- store raw HTML as primary content
- mass migrate all legacy content immediately

---

# 49. Coding Agent — Required Technical Principles

1. Content structure is data-driven.
2. Public rendering is component-registry-driven.
3. Admin structure is constrained.
4. Responsive design remains frontend-controlled.
5. Internal media uses `mediaId`.
6. Image focal point belongs to block instance.
7. Draft and published content are separate.
8. Content documents are schema-versioned.
9. Legacy rendering remains supported during migration.
10. Invalid blocks must never crash the whole public page.

---

# 50. Coding Agent — Phase 0 Deliverable

First produce an implementation design package containing:

## A. Final TypeScript Types

Provide final versions of:

- `ContentDocument`
- `ContentBlock`
- all Phase 1 blocks
- localization types
- media reference type
- focal point type

## B. Final Zod Schemas

Provide validation schema plan for all blocks.

## C. Database Migration Plan

Show:

- tables/columns to add
- versioning strategy
- relationships
- RLS implications
- rollback implications

Do NOT run destructive migration without explicit approval.

## D. File Change Plan

List all:

- new files
- modified files
- deprecated files

with exact paths.

## E. API Plan

Show:

- read draft
- save draft
- publish
- read published
- revisions
- restore
- preview

## F. Test Plan

Cover:

- unit tests
- schema tests
- renderer tests
- admin interaction tests
- responsive tests
- migration tests
- regression tests

Stop after Phase 0 plan and wait for implementation approval if instructed by the project workflow.

---

# 51. Suggested File Architecture

Adapt to actual codebase.

Conceptual structure:

```text
src/
  types/
    content/
      contentDocument.ts
      contentBlocks.ts

  lib/
    content/
      schemas/
      migrations/
      resolveLocalizedValue.ts
      resolveMedia.ts

  components/
    ContentRenderer/
      ContentRenderer.tsx
      registry.ts

      blocks/
        HeadingBlock.tsx
        RichTextBlock.tsx
        ImageBlock.tsx
        GalleryBlock.tsx
        QuoteBlock.tsx
        VideoBlock.tsx
        CTABlock.tsx
        DividerBlock.tsx

  components/
    admin/
      ContentEditor/
        ContentEditor.tsx
        BlockList.tsx
        BlockItem.tsx
        BlockInserter.tsx
        BlockActions.tsx

        editors/
          HeadingEditor.tsx
          RichTextEditor.tsx
          ImageEditor.tsx
          GalleryEditor.tsx
          QuoteEditor.tsx
          VideoEditor.tsx
          CTAEditor.tsx
          DividerEditor.tsx

        media/
          MediaPickerModal.tsx
          ImagePositionEditor.tsx
```

Do not create these exact files blindly if equivalent project structure already exists.

---

# 52. Image Position Editor Technical Notes

Implement Image Position Editor with clear separation between:

- block reorder drag
- image focal drag

Use separate drag interaction areas.

Example:

```text
[ BLOCK DRAG HANDLE ]  Image Block

+--------------------------------------+
|                                      |
|        IMAGE POSITION AREA           |
|         drag image only              |
|                                      |
+--------------------------------------+
```

Do not allow dragging the image to accidentally reorder the entire block.

Pointer interaction must calculate focal coordinates relative to:

- frame size
- scaled image size
- overflow/clipping bounds

Persist normalized percentages, not pixel coordinates.

Correct:

```text
x = 42.5
y = 31
```

Incorrect:

```text
left = -124px
top = -58px
```

Normalized values are required for responsive behavior.

---

# 53. Image Position Rendering Strategy

Default:

```text
focal x = 50
focal y = 50
zoom = 1
```

For `cover` mode:

- frame clips overflow
- media fills frame
- focal point determines visible crop emphasis

For `contain` mode:

- focal point may be visually less relevant
- keep implementation safe and predictable

Do not permit positioning outside sensible bounds.

---

# 54. Performance Requirements

Dynamic content must not materially degrade:

- Core Web Vitals
- SSR
- SEO
- LCP
- CLS
- hydration cost

Image requirements:

- intrinsic dimensions
- responsive `sizes`
- lazy loading unless above fold
- priority only where appropriate
- no unnecessary full-resolution image downloads
- preserve CDN/storage optimization

Do not automatically set all top images to `priority`.

Determine above-the-fold/LCP behavior based on page context.

---

# 55. Preview

Preview should render the actual public components.

Do not create a fake approximation inside Admin.

Preferred:

```text
Admin Draft
   |
Preview
   |
Next.js draft/secure preview
   |
Actual public page shell
   |
ContentRenderer
```

Preview must include:

- actual fonts
- actual block components
- actual responsive behavior
- actual media positioning

---

# 56. Success Definition

The project is successful when normal editorial composition changes no longer require codebase modifications.

Examples that must become Admin-only operations:

```text
"Put an image between paragraph 1 and 2."

"Move this gallery higher."

"Add another image frame here."

"Replace this image."

"Make this image 4:3."

"Move the subject in the image upward."

"Move the photo left inside the frame."

"Change this image from contained to wide."

"Insert a quote here."

"Duplicate this content block."
```

Developer involvement should only be necessary when introducing a genuinely new content capability, such as:

```text
Before/After Block
Interactive Timeline
New Map Block
Custom Comparison Component
```

---

# 57. Final Architecture Summary

```text
                         ADMIN CONTENT
                               |
                               v
                    +---------------------+
                    |    BLOCK EDITOR     |
                    +---------------------+
                    | Heading             |
                    | Rich Text           |
                    | Image               |
                    | Gallery             |
                    | Quote               |
                    | Video               |
                    | CTA                 |
                    | Divider             |
                    +----------+----------+
                               |
                               v
                       ContentDocument
                       schemaVersion: 1
                       blocks: [...]
                               |
                  +------------+------------+
                  |                         |
                  v                         v
               Draft                     Publish
                  |                         |
                  v                         v
          Draft Content Version    Published Version
                  |                         |
                  +------------+------------+
                               |
                               v
                         PostgreSQL JSONB
                               |
                               v
                       ContentRenderer
                               |
                               v
                        Block Registry
         +---------+---------+---------+---------+
         |         |         |         |         |
         v         v         v         v         v
       Text      Image     Gallery    Quote      CTA
                   |
                   v
          Frame / Fit / Focal / Zoom
                   |
                   v
        Responsive Design System
                   |
                   v
        Mobile / Tablet / Desktop
```

---

# 58. Final Architectural Decisions

## Approved

- Hybrid relational metadata + JSONB content document
- Structured block editor
- Universal Content Renderer
- Block Registry
- Shared multilingual structure
- Media Picker
- `mediaId` references
- Image frame controls
- Drag image inside frame
- Focal point using normalized percentage values
- Optional safe zoom
- `@dnd-kit`
- Legacy fallback
- Schema versioning
- Draft/published version separation
- Incremental migration

## Explicitly Rejected

- Canva-style free positioning
- Webflow-like unrestricted page design
- Arbitrary x/y page coordinates
- Raw CSS in Admin
- `customClass` in Admin block settings
- Arbitrary JavaScript
- Raw HTML as canonical content
- Permanent dependence on `SystemConfigs`
- Independent block tree for every locale in Phase 1
- Deep nested column/page-builder system in Phase 1
- Mass migration before pilots are proven

---

# 59. Next Required Action for Coding Agent

Return a **Phase 0 Implementation Design Report** based on the real codebase.

Do not begin full implementation yet.

The report must contain:

1. Verified current codebase state
2. Conflicts with this architecture, if any
3. Final TypeScript interfaces
4. Final Zod schemas
5. Database/versioning design
6. API design
7. Media model changes
8. Image position editor implementation strategy
9. Draft/publish workflow
10. Preview workflow
11. Exact file change map
12. Dependency additions
13. Test plan
14. Migration plan
15. Rollback plan
16. Risks
17. Phase-by-phase implementation sequence
18. Acceptance criteria mapping

All recommendations must be based on the actual repository.

Do not provide generic advice.

Do not implement transactional/business logic changes.


---

# 60. Multi-Agent Execution Model — Codex + Antigravity

This section is the operational playbook now that both agents are available inside VS Code.

## 60.1 Roles

### Codex — Lead Architect / Core Integrator
Owns:
- ContentDocument contract
- TypeScript block types
- Zod validation
- Database migrations
- Content APIs
- ContentRenderer
- Block Registry
- Draft/Publish
- Version history
- Security
- Migration
- Final integration review

### Antigravity — UI / Interaction Specialist
Owns:
- Admin Block Editor
- Drag and drop
- Media Picker UI
- Image frame editor
- Image drag/reposition UX
- Zoom controls
- Rich Text editor UI
- Responsive Admin UX
- Visual QA

Antigravity must not silently change database, schema, Zod, API DTOs, or schemaVersion.

---

# 61. Recommended VS Code / Git Structure

Logical workspace:

```text
INTEGRATION
CODEX
ANTIGRAVITY
```

Git branches:

```text
main/master
  |
  +-- integration/content-system
      |
      +-- feat/content-contract-antigravity
      +-- review/content-contract-codex
      +-- feat/content-renderer
      +-- feat/content-media-core
      +-- feat/content-media-ui
      +-- feat/content-editor
      +-- feat/image-position
      +-- feat/content-publishing
      +-- feat/content-migration
      +-- feat/content-hardening
```

Branches belong to features, not to agents.

---

# 62. Shared Coordination Files

Create:

```text
docs/
├── content-system/
│   ├── IMPLEMENTATION_SPEC.md
│   ├── CONTENT_CONTRACT_V1.md
│   ├── ARCHITECTURE_DECISIONS.md
│   ├── PHASE_STATUS.md
│   ├── OWNERSHIP.md
│   ├── requests/
│   └── handoffs/
│
└── agents/
    ├── TASK_BOARD.md
    ├── FILE_LOCKS.md
    └── status/
        ├── CODEX.md
        └── ANTIGRAVITY.md
```

---

# 63. Ownership Rules

## Codex lock

```text
src/content/**
src/lib/content/**
src/components/ContentRenderer/**
src/app/api/content/**
supabase/migrations/**
```

## Antigravity lock

```text
src/components/admin/ContentEditor/**
src/app/admin/posts/**
```

## Shared review required

```text
package.json
package-lock.json
docs/content-system/**
```

If an agent needs to modify the other agent's locked area, it must create a Change Request first.

---

# 64. Change Request Template

Create:

```text
docs/content-system/requests/CR-XXX.md
```

Template:

```md
# CR-XXX — Title

## Requested By
Codex / Antigravity

## Current Contract
Content Contract V1

## Problem
...

## Proposed Change
...

## Backward Compatibility
...

## DB Migration Required
Yes / No

## Renderer Change Required
Yes / No
```

---

# 65. Handoff Template

```md
# Task Handoff

## Task
...

## Owner
Codex / Antigravity

## Status
Complete / Partial / Blocked

## Branch
...

## Contract Version Used
1.0

## Files Added
...

## Files Modified
...

## Behavior Implemented
...

## Tests
...

## Known Issues
...

## Requires From Other Agent
...

## Contract Change Requested
None / CR-XXX

## Merge Risk
Low / Medium / High
```

---

# 66. Status Template

Example `docs/agents/status/CODEX.md`:

```md
# Codex Status

Status: IN PROGRESS
Branch: feat/content-renderer
Task: CONTENT-002
Progress: 65%

## Working On
- ContentRenderer
- Block registry
- Image renderer

## Changed Files
- ...

## Tests
- TypeScript: PASS
- Renderer tests: PASS

## Blockers
None

## Next
- Gallery renderer
- Quote renderer

## Last Update
...
```

Antigravity uses the same format.

---

# 67. Task Board

```md
# Content Builder Task Board

## READY
- CONTENT-001 Phase 0 Architecture Verification
- CONTENT-002 Content Renderer Foundation
- CONTENT-003 Saigon Coffee Pilot
- CONTENT-004 Media Core
- CONTENT-005 Media Picker UI
- CONTENT-006 Admin Block Editor
- CONTENT-007 Image Position Editor
- CONTENT-008 Draft / Publish / Versioning
- CONTENT-009 Local Tour Migration
- CONTENT-010 Hardening

## IN PROGRESS
None

## REVIEW
None

## DONE
None
```

---

# 68. Phase Progress Model

| Phase | Overall Progress |
|---|---:|
| Phase 0 | 5% |
| Phase 1 | 15% |
| Phase 2 | 25% |
| Phase 3 | 40% |
| Phase 4 | 60% |
| Phase 5 | 70% |
| Phase 6 | 82% |
| Phase 7 | 90% |
| Phase 8 | 100% |

Progress must be based on acceptance criteria passed, not file count or line count.

---

# 69. Phase Dependency Graph

```text
PHASE 0
Contract
   |
   v
PHASE 1
Core Renderer
   |
   +-------------+
   |             |
   v             v
Pilot          Media UI
   |             |
   +------v------+
          |
          v
    Block Editor
          |
          v
   Image Position
          |
     +----+----+
     |         |
     v         v
 Publishing   UI QA
     |         |
     +----v----+
          |
          v
      Migration
          |
          v
      Hardening
```

---

# 70. Exact Start Sequence

Now that both agents are available in VS Code:

1. Create or switch to `integration/content-system` from the current stable main/master branch.
2. Put this file into `docs/content-system/IMPLEMENTATION_SPEC.md`.
3. Create all coordination files listed above.
4. Commit the baseline documentation.
5. Create `feat/content-contract-antigravity`.
6. Run the Antigravity Phase 0 prompt below.
7. Antigravity must stop after Phase 0.
8. Create `review/content-contract-codex` from the latest integration state and include Antigravity Phase 0 output.
9. Run the Codex Phase 0 review prompt.
10. If approved, mark `CONTENT_CONTRACT_V1.md` as `FROZEN`.
11. Merge the approved contract into `integration/content-system`.
12. Start parallel work:
    - Codex: `feat/content-renderer`
    - Antigravity: `feat/content-media-ui`
13. Continue phase-by-phase with completion reports and review gates.

---

# 71. PROMPT — Antigravity Phase 0

```text
ROLE: Phase 0 Codebase Analyst & Implementation Planner

PROJECT:
NganHa-WebBooking

CURRENT PHASE:
Phase 0 — Architecture Verification ONLY.

READ FIRST:
- docs/content-system/IMPLEMENTATION_SPEC.md
- docs/content-system/OWNERSHIP.md
- docs/content-system/PHASE_STATUS.md
- existing architectural audit/report if present

DO NOT IMPLEMENT THE FULL FEATURE YET.

Audit the real codebase and verify:

1. WebbookingBlogPosts
2. SystemConfigs
3. WebbookingContentRevisions
4. MarketingMedia
5. Admin Posts UI
6. Media Library
7. Supabase schema and RLS
8. Upload pipeline
9. Localization system
10. Public blog/article rendering
11. Existing dependencies
12. Existing API conventions
13. Current Next.js server/client boundaries
14. Existing security constraints
15. Existing legacy content paths

Produce:

A. Verified codebase findings
B. Conflicts with approved architecture
C. Final ContentDocument V1 interface
D. Final ContentBlock union
E. Final ImageBlock contract
F. Final MediaAsset contract
G. Final focalPoint / zoom contract
H. Final multilingual strategy
I. Zod validation plan
J. Database/versioning design
K. Draft/publish design
L. API DTO design
M. Exact file change map
N. Dependency additions
O. Migration plan
P. Test plan
Q. Risks
R. Phase-by-phase implementation plan

Update/create:

docs/content-system/CONTENT_CONTRACT_V1.md
docs/content-system/ARCHITECTURE_DECISIONS.md
docs/content-system/PHASE_STATUS.md
docs/agents/status/ANTIGRAVITY.md

Create:

docs/content-system/handoffs/ANTIGRAVITY_PHASE_0.md

IMPORTANT RULES:

- Do not modify booking/business logic.
- Do not run destructive DB migrations.
- Do not mass migrate legacy content.
- Do not create arbitrary page-builder architecture.
- Do not expose customClass or raw CSS.
- Do not implement free-position page coordinates.
- Do not silently change approved architecture.
- If a conflict exists, document it and propose the smallest compatible adjustment.

When complete:
- stop
- return a Phase 0 Completion Report
- do not continue into Phase 1
```

---

# 72. PROMPT — Codex Phase 0 Review

```text
ROLE: Senior Content Architecture Gatekeeper

PROJECT:
NganHa-WebBooking

TASK:
Review the Phase 0 output produced by Antigravity.

READ:
- docs/content-system/IMPLEMENTATION_SPEC.md
- docs/content-system/CONTENT_CONTRACT_V1.md
- docs/content-system/ARCHITECTURE_DECISIONS.md
- docs/content-system/handoffs/ANTIGRAVITY_PHASE_0.md
- docs/content-system/OWNERSHIP.md

THIS IS A REVIEW TASK ONLY.

Check:

1. Does the proposed ContentDocument match the actual codebase?
2. Is the block schema future-safe?
3. Is multilingual structure correct?
4. Is mediaId the canonical internal media reference?
5. Is focalPoint normalized?
6. Is image positioning block-instance specific?
7. Is draft separated from published state?
8. Is schema versioning correct?
9. Are Zod boundaries sufficient?
10. Are security concerns handled?
11. Is SystemConfigs avoided as permanent CMS architecture?
12. Is legacy compatibility preserved?
13. Are transactional booking systems untouched?
14. Are database/API contracts internally consistent?
15. Are server/client boundaries valid for Next.js App Router?
16. Are migration and rollback strategies safe?

For every issue:
- classify as BLOCKER / MAJOR / MINOR
- explain exact reason
- propose minimal correction

If architecture is acceptable:
- mark CONTENT_CONTRACT_V1.md as FROZEN
- update PHASE_STATUS.md
- update docs/agents/status/CODEX.md
- create docs/content-system/handoffs/CODEX_PHASE_0_REVIEW.md

Do not implement Phase 1 yet.
Stop after the review report.
```

---

# 73. PROMPT — Codex Phase 1 Core Renderer

```text
ROLE: Content System Lead Engineer

CURRENT PHASE:
Phase 1 — Core Renderer Foundation

READ FIRST:
- docs/content-system/IMPLEMENTATION_SPEC.md
- docs/content-system/CONTENT_CONTRACT_V1.md
- docs/content-system/ARCHITECTURE_DECISIONS.md
- docs/content-system/OWNERSHIP.md
- docs/content-system/PHASE_STATUS.md

PRECONDITION:
CONTENT_CONTRACT_V1 must be marked FROZEN.

IMPLEMENT ONLY:

1. TypeScript content types
2. ContentDocument schemaVersion support
3. Zod block/document validation
4. ContentRenderer
5. Block Registry
6. Heading renderer
7. Rich Text renderer
8. Image renderer
9. Gallery renderer
10. Quote renderer
11. Video renderer
12. CTA renderer
13. Divider renderer
14. defensive unknown-block handling

DO NOT:
- build Admin Block Editor
- modify booking business logic
- mass migrate content
- implement free page positioning
- expose customClass
- alter frozen contract silently

IMAGE REQUIREMENTS:
- internal media uses mediaId
- focalPoint is normalized 0-100
- renderer maps focal point to object-position
- zoom must be bounded
- intrinsic dimensions must prevent CLS

TEST:
- TypeScript
- Zod
- SSR
- locale fallback
- unknown block
- malformed block
- image focal rendering
- mobile/tablet/desktop

UPDATE:
- docs/agents/status/CODEX.md
- docs/content-system/PHASE_STATUS.md

CREATE:
- docs/content-system/handoffs/CODEX_PHASE_1.md

Stop after Phase 1 Completion Report.
```

---

# 74. PROMPT — Antigravity Media Picker UI

```text
ROLE: Admin Content UI & Interaction Specialist

CURRENT TASK:
Media Picker UI

READ:
- docs/content-system/CONTENT_CONTRACT_V1.md
- docs/content-system/IMPLEMENTATION_SPEC.md
- docs/content-system/OWNERSHIP.md

The contract is frozen.

IMPLEMENT ONLY UI/INTERACTION:
- reusable MediaPickerModal
- media search
- type filters
- thumbnail preview
- select asset
- upload interaction shell
- loading/error/empty states
- responsive Admin layout
- callback using approved MediaAsset contract

DO NOT:
- change DB schema
- change API contracts
- change ContentDocument
- change Zod schemas
- invent a second MediaAsset shape
- touch booking logic

If backend is not ready:
- use typed mocks matching the contract

If contract is insufficient:
- create a Change Request
- do not silently change it

UPDATE:
docs/agents/status/ANTIGRAVITY.md

CREATE:
docs/content-system/handoffs/ANTIGRAVITY_MEDIA_UI.md

Stop after completion report.
```

---

# 75. PROMPT — Antigravity Block Editor

```text
ROLE: Admin Content UI & Interaction Specialist

CURRENT PHASE:
Phase 4 — Admin Block Editor MVP

READ:
- CONTENT_CONTRACT_V1.md
- IMPLEMENTATION_SPEC.md
- OWNERSHIP.md
- PHASE_STATUS.md

IMPLEMENT:

1. Content Editor shell
2. ordered block list
3. Add Block
4. Insert Block between existing blocks
5. Edit Block
6. Duplicate Block
7. Delete Block
8. Move Up
9. Move Down
10. Drag-and-drop reorder
11. language tabs
12. block-specific editors
13. responsive Admin behavior

BLOCK TYPES:
- Heading
- Rich Text
- Image
- Gallery
- Quote
- Video
- CTA
- Divider

DnD:
- use approved dependency
- keep move up/down fallback
- array order remains source of truth

DO NOT:
- alter Content Contract
- alter DB schema
- alter API DTOs
- expose raw CSS
- expose arbitrary page x/y positioning
- build nested recursive page builder
- touch booking business logic

If a contract change is needed:
create CR-XXX.md and stop that dependent part.

UPDATE:
docs/agents/status/ANTIGRAVITY.md

CREATE:
docs/content-system/handoffs/ANTIGRAVITY_PHASE_4.md

Stop after completion report.
```

---

# 76. PROMPT — Antigravity Image Position Editor

```text
ROLE: Image Editing Interaction Specialist

CURRENT PHASE:
Phase 5 — Image Position Editor

IMPLEMENT:

ImagePositionEditor that supports:
- fixed visual frame
- drag image horizontally
- drag image vertically
- mouse/pointer interaction
- touch interaction
- aspect ratio changes
- cover/contain
- reset
- safe zoom 1.0-2.0
- live preview
- normalized focal coordinates
- persistence-friendly onChange output

INPUT MUST FOLLOW FROZEN CONTRACT.

OUTPUT MUST BE:

{
  focalPoint: {
    x: number,
    y: number
  },
  zoom: number
}

DO NOT PERSIST:
leftPx
topPx
raw transform pixels

IMPORTANT:
- block drag handle must be separate from image reposition area
- image drag must not reorder the block
- frame must not move
- original media file must not be destructively cropped
- responsive behavior must remain stable

ACCEPTANCE:
1. drag up/down works
2. drag left/right works
3. save/reload preserves position
4. 16:9 -> 1:1 frame change works
5. reset works
6. zoom persists
7. touch works
8. no duplicate media asset is generated just for repositioning

UPDATE:
docs/agents/status/ANTIGRAVITY.md

CREATE:
docs/content-system/handoffs/ANTIGRAVITY_PHASE_5.md
```

---

# 77. PROMPT — Codex Media Core

```text
ROLE: Content Core / Media Backend Owner

TASK:
Implement the core media contract required by Content Builder.

READ frozen contract.

IMPLEMENT:
- reconcile MarketingMedia schema with approved MediaAsset contract
- width/height
- MIME
- file size
- localized alt metadata
- resolver by mediaId
- admin media read API
- approved upload integration
- validation
- permission/RLS checks
- server-safe media resolution

DO NOT:
- rewrite storage unnecessarily
- duplicate URLs as block source of truth
- break current Media Library
- alter booking logic

Ensure Image/Gallery blocks can resolve mediaId safely.

CREATE:
docs/content-system/handoffs/CODEX_MEDIA_CORE.md
```

---

# 78. PROMPT — Codex Draft / Publish / Versioning

```text
ROLE: Content Publishing Architecture Owner

CURRENT PHASE:
Phase 6 — Draft / Preview / Publish

IMPLEMENT:
- draft version model
- published version model
- current_draft_version_id
- current_published_version_id
- immutable content version snapshots
- preview endpoint/flow
- publish action
- revision list
- restore workflow
- authorization
- validation

PUBLIC RULE:
Public users must only read published version.

ADMIN RULE:
Saving draft must never change live public content.

PREVIEW:
Must use actual public rendering components, not a fake approximation.

DO NOT:
- overwrite published content in-place
- destroy history
- expose draft content publicly
- alter booking logic

CREATE:
docs/content-system/handoffs/CODEX_PHASE_6.md
```

---

# 79. PROMPT — Codex Legacy Migration

```text
ROLE: Legacy Migration Owner

CURRENT PHASE:
Phase 7 — Backward Compatibility & Migration

IMPLEMENT:
- dual-mode renderer
- block document if available
- legacy fallback otherwise
- one-time legacy conversion helper
- no destructive bulk migration
- preserve original content during transition

PRIORITY TARGETS:
1. Blog
2. Local Tour
3. Home Spa
4. Academy/editorial
5. Our Story where appropriate

PILOT:
Local Tour must prove images can move between paragraphs without TSX changes.

DO NOT:
- migrate booking transactional UI
- delete legacy fallback prematurely
- mass-convert without verification

CREATE:
docs/content-system/handoffs/CODEX_PHASE_7.md
```

---

# 80. PROMPT — Phase 8 Hardening (Both Agents)

```text
ROLE: Production Hardening

CURRENT PHASE:
Phase 8 — Final QA / Security / Performance

CHECK:

Responsive:
- 375px
- 390px
- 430px
- 768px
- 1024px
- desktop

Content:
- empty block
- missing locale
- malformed block
- unknown block
- invalid URL

Images:
- CLS
- LCP
- focal position
- zoom
- broken media
- cover/contain
- gallery behavior

Security:
- XSS
- unsafe URLs
- RLS
- preview authorization
- draft leakage
- raw HTML injection

Regression:
- booking flow untouched
- cart untouched
- checkout untouched
- pricing untouched
- KTV untouched
- payment untouched

Performance:
- SSR
- hydration
- image optimization
- no unnecessary priority images

REPORT:
- pass/fail matrix
- blockers
- remaining technical debt
- release readiness
```

---

# 81. Merge Rules

Feature branch must pass:

```text
[ ] TypeScript clean
[ ] lint clean
[ ] relevant tests pass
[ ] contract unchanged or documented
[ ] no booking logic touched
[ ] no raw CSS injection
[ ] no raw pixel focal persistence
[ ] mobile tested
[ ] tablet tested
[ ] desktop tested
[ ] legacy compatibility preserved
[ ] security validation preserved
[ ] handoff exists
```

Merge flow:

```text
feature
  |
  v
review
  |
  v
integration/content-system
  |
  v
milestone QA
  |
  v
main/master
```

No direct feature -> main merge.

---

# 82. Final Operating Principles

> Branch belongs to the feature, not the AI.

> The Content Contract belongs to the system, not the agent.

> Admin controls content composition; developers control rendering and business logic.

> Image position is normalized focal metadata, not raw pixel coordinates.

> Draft must never overwrite published content directly.

> Legacy content remains supported until migration is verified.

