import type {
  ContentBlock,
  GalleryBlock,
  HeadingBlock,
  ImageBlock,
  QuoteBlock,
  RichTextBlock,
  SupportedLocale,
  VideoBlock,
  CTABlock,
  DividerBlock,
} from '../../../types/content/content.ts';

export function generateContentId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function createDefaultBlock(
  type: ContentBlock['type'],
  activeLocale: SupportedLocale,
): ContentBlock {
  const id = generateContentId(`blk-${type.slice(0, 4)}`);
  const visibility: Record<SupportedLocale, boolean> = {
    vi: true,
    en: true,
    cn: true,
    jp: true,
    kr: true,
  };

  switch (type) {
    case 'heading':
      return {
        id,
        type,
        settings: { width: 'content', spacingTop: 'md', spacingBottom: 'sm', visibility },
        props: { level: 2, align: 'left', text: { [activeLocale]: 'Tiêu đề mới' } },
      } satisfies HeadingBlock;
    case 'richText':
      return {
        id,
        type,
        settings: { width: 'content', spacingTop: 'sm', spacingBottom: 'md', visibility },
        props: {
          content: {
            [activeLocale]: {
              type: 'doc',
              content: [{
                type: 'paragraph',
                content: [{ type: 'text', text: 'Nhập nội dung văn bản ở đây...' }],
              }],
            },
          },
        },
      } satisfies RichTextBlock;
    case 'image':
      return {
        id,
        type,
        settings: { width: 'content', spacingTop: 'sm', spacingBottom: 'md', visibility },
        props: {
          mediaId: 'media-oria-massage-02',
          aspectRatio: '16:9',
          fit: 'cover',
          presentation: 'contained',
          focalPoint: { x: 50, y: 50 },
          zoom: 1,
          alt: { [activeLocale]: 'Hình ảnh minh họa Oria' },
        },
      } satisfies ImageBlock;
    case 'gallery':
      return {
        id,
        type,
        settings: { width: 'wide', spacingTop: 'md', spacingBottom: 'md', visibility },
        props: {
          layout: 'grid-3',
          aspectRatio: '4:3',
          items: [
            { id: generateContentId('item'), mediaId: 'media-oria-oil-03' },
            { id: generateContentId('item'), mediaId: 'media-oria-tea-04' },
            { id: generateContentId('item'), mediaId: 'media-coffee-saigon-05' },
          ],
        },
      } satisfies GalleryBlock;
    case 'quote':
      return {
        id,
        type,
        settings: { width: 'content', spacingTop: 'md', spacingBottom: 'md', visibility },
        props: {
          variant: 'bordered',
          quote: { [activeLocale]: 'Sức khỏe là sự hài hòa tuyệt đối giữa tâm và trí.' },
          author: { [activeLocale]: 'Oria Spa' },
        },
      } satisfies QuoteBlock;
    case 'video':
      return {
        id,
        type,
        settings: { width: 'content', spacingTop: 'md', spacingBottom: 'md', visibility },
        props: {
          source: { type: 'internal', mediaId: 'media-oria-video-intro-07' },
          autoplay: false,
        },
      } satisfies VideoBlock;
    case 'cta':
      return {
        id,
        type,
        settings: { width: 'content', spacingTop: 'md', spacingBottom: 'lg', visibility },
        props: {
          variant: 'gold-solid',
          title: { [activeLocale]: 'Khám phá ngay' },
          buttonText: { [activeLocale]: 'Đặt hẹn' },
          buttonUrl: '/booking',
        },
      } satisfies CTABlock;
    case 'divider':
      return {
        id,
        type,
        settings: { width: 'narrow', spacingTop: 'sm', spacingBottom: 'sm', visibility },
        props: { style: 'gold-flourish' },
      } satisfies DividerBlock;
  }
}
