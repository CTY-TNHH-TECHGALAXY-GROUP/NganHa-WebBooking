export const SUPPORTED_LOCALES = ['vi', 'en', 'cn', 'jp', 'kr'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export type LocalizedValue<T> = {
  [K in SupportedLocale]?: T;
};

export type RequiredLocalizedValue<T> = LocalizedValue<T> & { vi: T };
export type LocalizedString = LocalizedValue<string>;

export const LOCALIZED_FALLBACK_ORDER = ['requested-locale', 'en', 'vi'] as const;

export interface FocalPoint {
  x: number;
  y: number;
}

export type ZoomLevel = number;

export interface MediaAsset {
  id: string;
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
  | { type: 'internal'; mediaId: string }
  | {
      type: 'external';
      url: string;
      width?: number;
      height?: number;
      alt?: LocalizedValue<string>;
    };

export type ResolvedMediaReference =
  | { type: 'internal'; mediaId: string; asset: MediaAsset }
  | Extract<MediaReference, { type: 'external' }>;

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

export type BlockWidth = 'narrow' | 'content' | 'wide' | 'full';
export type BlockSpacing = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface BaseBlockSettings {
  width?: BlockWidth;
  spacingTop?: BlockSpacing;
  spacingBottom?: BlockSpacing;
  visibility?: Partial<Record<SupportedLocale, boolean>>;
}

export interface BaseBlock {
  id: string;
  type: string;
  settings?: BaseBlockSettings;
}

export interface HeadingBlockProps {
  text: LocalizedValue<string>;
  level: 2 | 3 | 4;
  align?: 'left' | 'center' | 'right';
  subtitle?: LocalizedValue<string>;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  props: HeadingBlockProps;
}

export interface RichTextBlockProps {
  content: LocalizedValue<RichTextDocument>;
}

export interface RichTextBlock extends BaseBlock {
  type: 'richText';
  props: RichTextBlockProps;
}

export type ImageAspectRatio = 'original' | '16:9' | '4:3' | '3:2' | '1:1' | '3:4';
export type ImageFit = 'cover' | 'contain';
export type ImagePresentation = 'contained' | 'wide' | 'full' | 'framed';

export interface ImageBlockProps {
  mediaId: string;
  aspectRatio?: ImageAspectRatio;
  fit?: ImageFit;
  focalPoint?: FocalPoint;
  zoom?: ZoomLevel;
  presentation?: ImagePresentation;
  alt?: LocalizedValue<string>;
  caption?: LocalizedValue<string>;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  props: ImageBlockProps;
}

export interface ResolvedImageBlockProps extends ImageBlockProps {
  resolvedAsset: MediaAsset;
}

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

export interface ResolvedGalleryItem extends GalleryItem {
  resolvedAsset: MediaAsset;
}

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

export type VideoProvider = 'youtube' | 'vimeo' | 'storage';

export type VideoSource =
  | { type: 'internal'; mediaId: string }
  | { type: 'external'; provider: Exclude<VideoProvider, 'storage'>; url: string };

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

export type CTAVariant = 'gold-solid' | 'gold-outline' | 'dark-luxury';

export interface CTABlockProps {
  title: LocalizedValue<string>;
  subtitle?: LocalizedValue<string>;
  buttonText: LocalizedValue<string>;
  buttonUrl: string;
  variant: CTAVariant;
}

export interface CTABlock extends BaseBlock {
  type: 'cta';
  props: CTABlockProps;
}

export type DividerStyle = 'subtle-line' | 'gold-flourish' | 'diamond-dots';

export interface DividerBlockProps {
  style: DividerStyle;
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
  props: DividerBlockProps;
}

export type ContentBlock =
  | HeadingBlock
  | RichTextBlock
  | ImageBlock
  | GalleryBlock
  | QuoteBlock
  | VideoBlock
  | CTABlock
  | DividerBlock;

export interface ContentDocument {
  schemaVersion: 1;
  blocks: ContentBlock[];
}
