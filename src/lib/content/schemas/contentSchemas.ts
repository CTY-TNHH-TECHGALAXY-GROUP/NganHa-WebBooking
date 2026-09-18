import { z } from 'zod';
import { SUPPORTED_LOCALES } from '../../../types/content/content.ts';

const localeKeys = SUPPORTED_LOCALES;
const localized = <T extends z.ZodType>(value: T) => z.object({
  vi: value.optional(),
  en: value.optional(),
  cn: value.optional(),
  jp: value.optional(),
  kr: value.optional(),
}).strict();

const safeId = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);

const safeUrl = (options: { protocols: string[]; allowRelative: boolean }) => z.string().min(1).max(2048).refine((value) => {
  if (value.trim() !== value || /[\u0000-\u001f\u007f]/.test(value) || value.startsWith('//')) return false;
  if (options.allowRelative && value.startsWith('/')) return true;
  try {
    return options.protocols.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}, 'Unsafe URL protocol');

const mediaUrl = safeUrl({ protocols: ['http:', 'https:'], allowRelative: true });
const linkUrl = safeUrl({ protocols: ['https:', 'mailto:', 'tel:'], allowRelative: true });

const focalPointSchema = z.object({
  x: z.number().finite().min(0).max(100),
  y: z.number().finite().min(0).max(100),
}).strict();

const zoomSchema = z.number().finite().min(1).max(2).refine(
  (value) => Math.abs(value * 20 - Math.round(value * 20)) < 1e-8,
  'Zoom must use 0.05 increments',
);

const baseSettingsSchema = z.object({
  width: z.enum(['narrow', 'content', 'wide', 'full']).optional(),
  spacingTop: z.enum(['none', 'sm', 'md', 'lg', 'xl']).optional(),
  spacingBottom: z.enum(['none', 'sm', 'md', 'lg', 'xl']).optional(),
  visibility: z.object({
    vi: z.boolean().optional(),
    en: z.boolean().optional(),
    cn: z.boolean().optional(),
    jp: z.boolean().optional(),
    kr: z.boolean().optional(),
  }).strict().optional(),
}).strict();

const richTextMarkSchema = z.object({
  type: z.enum(['bold', 'italic', 'underline', 'link']),
  attrs: z.object({
    href: linkUrl.optional(),
    target: z.enum(['_blank', '_self']).optional(),
    rel: z.string().max(200).optional(),
  }).strict().optional(),
}).strict().superRefine((mark, ctx) => {
  if (mark.type === 'link' && !mark.attrs?.href) {
    ctx.addIssue({ code: 'custom', message: 'Link marks require a safe href' });
  }
});

const richTextNodeSchema: z.ZodType = z.lazy(() => z.object({
  type: z.enum(['paragraph', 'bulletList', 'orderedList', 'listItem', 'hardBreak', 'text']),
  text: z.string().max(10000).optional(),
  marks: richTextMarkSchema.array().max(8).optional(),
  content: richTextNodeSchema.array().max(200).optional(),
}).strict());

export const richTextDocumentSchema = z.object({
  type: z.literal('doc'),
  content: richTextNodeSchema.array().max(200),
}).strict().superRefine((document, ctx) => {
  const visit = (node: unknown, depth: number) => {
    if (depth > 20) {
      ctx.addIssue({ code: 'custom', message: 'Rich text nesting is too deep' });
      return;
    }
    if (!node || typeof node !== 'object') return;
    const childNodes = (node as { content?: unknown }).content;
    if (Array.isArray(childNodes)) childNodes.forEach((child) => visit(child, depth + 1));
  };
  document.content.forEach((node) => visit(node, 0));
});

const localizedString = localized(z.string().max(10000));
const localizedRichText = localized(richTextDocumentSchema);

const baseBlock = {
  id: safeId,
  settings: baseSettingsSchema.optional(),
};

export const headingBlockSchema = z.object({
  ...baseBlock,
  type: z.literal('heading'),
  props: z.object({
    text: localizedString,
    level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
    align: z.enum(['left', 'center', 'right']).optional(),
    subtitle: localizedString.optional(),
  }).strict(),
}).strict();

export const richTextBlockSchema = z.object({
  ...baseBlock,
  type: z.literal('richText'),
  props: z.object({ content: localizedRichText }).strict(),
}).strict();

const imageProps = z.object({
  mediaId: safeId,
  aspectRatio: z.enum(['original', '16:9', '4:3', '3:2', '1:1', '3:4']).optional(),
  fit: z.enum(['cover', 'contain']).optional(),
  focalPoint: focalPointSchema.optional(),
  zoom: zoomSchema.optional(),
  presentation: z.enum(['contained', 'wide', 'full', 'framed']).optional(),
  alt: localizedString.optional(),
  caption: localizedString.optional(),
}).strict();

export const imageBlockSchema = z.object({
  ...baseBlock,
  type: z.literal('image'),
  props: imageProps,
}).strict();

const galleryItemSchema = z.object({
  id: safeId,
  mediaId: safeId,
  alt: localizedString.optional(),
  caption: localizedString.optional(),
  focalPoint: focalPointSchema.optional(),
}).strict();

export const galleryBlockSchema = z.object({
  ...baseBlock,
  type: z.literal('gallery'),
  props: z.object({
    items: galleryItemSchema.array().max(100),
    layout: z.enum(['grid-2', 'grid-3', 'grid-4', 'masonry', 'carousel']),
    aspectRatio: z.enum(['original', '16:9', '4:3', '3:2', '1:1', '3:4']).optional(),
  }).strict(),
}).strict();

export const quoteBlockSchema = z.object({
  ...baseBlock,
  type: z.literal('quote'),
  props: z.object({
    quote: localizedString,
    author: localizedString.optional(),
    role: localizedString.optional(),
    variant: z.enum(['bordered', 'centered-serif', 'ornate-gold']).optional(),
  }).strict(),
}).strict();

const externalVideoUrl = safeUrl({ protocols: ['https:'], allowRelative: false }).refine((value) => {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === 'youtu.be' || hostname === 'youtube.com' || hostname.endsWith('.youtube.com')
      || hostname === 'vimeo.com' || hostname.endsWith('.vimeo.com');
  } catch {
    return false;
  }
}, 'External video host is not supported');

export const videoBlockSchema = z.object({
  ...baseBlock,
  type: z.literal('video'),
  props: z.object({
    source: z.discriminatedUnion('type', [
      z.object({ type: z.literal('internal'), mediaId: safeId }).strict(),
      z.object({
        type: z.literal('external'),
        provider: z.enum(['youtube', 'vimeo']),
        url: externalVideoUrl,
      }).strict(),
    ]),
    posterMediaId: safeId.optional(),
    caption: localizedString.optional(),
    autoplay: z.boolean().optional(),
  }).strict(),
}).strict();

export const ctaBlockSchema = z.object({
  ...baseBlock,
  type: z.literal('cta'),
  props: z.object({
    title: localizedString,
    subtitle: localizedString.optional(),
    buttonText: localizedString,
    buttonUrl: linkUrl,
    variant: z.enum(['gold-solid', 'gold-outline', 'dark-luxury']),
  }).strict(),
}).strict();

export const dividerBlockSchema = z.object({
  ...baseBlock,
  type: z.literal('divider'),
  props: z.object({
    style: z.enum(['subtle-line', 'gold-flourish', 'diamond-dots']),
  }).strict(),
}).strict();

export const contentBlockSchema = z.discriminatedUnion('type', [
  headingBlockSchema,
  richTextBlockSchema,
  imageBlockSchema,
  galleryBlockSchema,
  quoteBlockSchema,
  videoBlockSchema,
  ctaBlockSchema,
  dividerBlockSchema,
]);

export const contentDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  blocks: contentBlockSchema.array().max(500),
}).strict();

export const supportedLocaleSchema = z.enum(localeKeys);
export const mediaReferenceSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('internal'), mediaId: safeId }).strict(),
  z.object({
    type: z.literal('external'),
    url: mediaUrl,
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    alt: localizedString.optional(),
  }).strict(),
]);

export { focalPointSchema, zoomSchema, mediaUrl, linkUrl, safeId };
