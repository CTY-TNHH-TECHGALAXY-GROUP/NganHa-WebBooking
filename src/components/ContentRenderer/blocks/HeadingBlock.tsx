import type { CSSProperties } from 'react';
import type { HeadingBlock as HeadingBlockType } from '@/types/content';
import { resolveLocalizedValue } from '@/lib/content/resolveLocalizedValue';
import { BlockFrame } from '../blockFrame';
import type { BlockRendererContext } from '../rendererTypes';

export function HeadingBlock({ block, context }: { block: HeadingBlockType; context: BlockRendererContext }) {
  const text = resolveLocalizedValue(block.props.text, context.locale).value;
  if (!text) return null;
  const subtitle = resolveLocalizedValue(block.props.subtitle, context.locale).value;
  const style: CSSProperties = { textAlign: block.props.align || 'left' };
  const Heading = `h${block.props.level}` as 'h2' | 'h3' | 'h4';

  return (
    <BlockFrame block={block}>
      <div style={style}>
        <Heading>{text}</Heading>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
    </BlockFrame>
  );
}
