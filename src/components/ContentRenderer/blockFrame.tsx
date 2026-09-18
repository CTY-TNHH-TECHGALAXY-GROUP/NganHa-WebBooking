import type { CSSProperties, ReactNode } from 'react';
import type { BaseBlock, BlockSpacing, BlockWidth } from '@/types/content';

const widths: Record<BlockWidth, string> = {
  narrow: '42rem',
  content: '56rem',
  wide: '72rem',
  full: '100%',
};

const spacing: Record<BlockSpacing, string> = {
  none: '0',
  sm: '0.75rem',
  md: '1.5rem',
  lg: '3rem',
  xl: '5rem',
};

export function BlockFrame({ block, children, maxWidth }: { block: BaseBlock; children: ReactNode; maxWidth?: string }) {
  const settings = block.settings;
  const style: CSSProperties = {
    width: '100%',
    maxWidth: maxWidth || widths[settings?.width || 'content'],
    marginInline: 'auto',
    paddingTop: spacing[settings?.spacingTop || 'md'],
    paddingBottom: spacing[settings?.spacingBottom || 'md'],
  };

  return <section data-content-block={block.type} data-content-block-id={block.id} style={style}>{children}</section>;
}
