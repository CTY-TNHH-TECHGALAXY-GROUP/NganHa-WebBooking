import type { QuoteBlock as QuoteBlockType } from '@/types/content';
import { resolveLocalizedValue } from '@/lib/content/resolveLocalizedValue';
import { BlockFrame } from '../blockFrame';
import type { BlockRendererContext } from '../rendererTypes';

export function QuoteBlock({ block, context }: { block: QuoteBlockType; context: BlockRendererContext }) {
  const quote = resolveLocalizedValue(block.props.quote, context.locale).value;
  if (!quote) return null;
  const author = resolveLocalizedValue(block.props.author, context.locale).value;
  const role = resolveLocalizedValue(block.props.role, context.locale).value;
  return (
    <BlockFrame block={block}>
      <blockquote data-quote-variant={block.props.variant || 'bordered'}>
        <p>{quote}</p>
        {author ? <footer>{author}{role ? ` — ${role}` : ''}</footer> : null}
      </blockquote>
    </BlockFrame>
  );
}
