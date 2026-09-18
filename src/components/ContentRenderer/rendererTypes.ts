import type { ReactNode } from 'react';
import type { ContentBlock, SupportedLocale } from '@/types/content';
import type { MediaResolver } from '@/lib/content/media';

export interface BlockRendererContext {
  locale: SupportedLocale;
  resolveMedia?: MediaResolver;
}

export type BlockRenderer = (props: {
  block: ContentBlock;
  context: BlockRendererContext;
}) => ReactNode | Promise<ReactNode>;
