import type { BlockRenderer } from './rendererTypes';
import type {
  CTABlock,
  ContentBlock,
  DividerBlock,
  GalleryBlock,
  HeadingBlock,
  ImageBlock,
  QuoteBlock,
  RichTextBlock,
  VideoBlock,
} from '@/types/content';
import { CTABlock as renderCTA } from './blocks/CTABlock';
import { DividerBlock as renderDivider } from './blocks/DividerBlock';
import { GalleryBlock as renderGallery } from './blocks/GalleryBlock';
import { HeadingBlock as renderHeading } from './blocks/HeadingBlock';
import { ImageBlock as renderImage } from './blocks/ImageBlock';
import { QuoteBlock as renderQuote } from './blocks/QuoteBlock';
import { RichTextBlock as renderRichText } from './blocks/RichTextBlock';
import { VideoBlock as renderVideo } from './blocks/VideoBlock';

export const blockRegistry: Record<ContentBlock['type'], BlockRenderer> = {
  heading: ({ block, context }) => renderHeading({ block: block as HeadingBlock, context }),
  richText: ({ block, context }) => renderRichText({ block: block as RichTextBlock, context }),
  image: ({ block, context }) => renderImage({ block: block as ImageBlock, context }),
  gallery: ({ block, context }) => renderGallery({ block: block as GalleryBlock, context }),
  quote: ({ block, context }) => renderQuote({ block: block as QuoteBlock, context }),
  video: ({ block, context }) => renderVideo({ block: block as VideoBlock, context }),
  cta: ({ block, context }) => renderCTA({ block: block as CTABlock, context }),
  divider: ({ block, context }) => renderDivider({ block: block as DividerBlock, context }),
};
