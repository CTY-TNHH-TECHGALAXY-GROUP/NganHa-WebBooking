import type { CTABlock as CTABlockType } from '@/types/content';
import { linkUrl } from '@/lib/content/schemas';
import { resolveLocalizedValue } from '@/lib/content/resolveLocalizedValue';
import { BlockFrame } from '../blockFrame';
import type { BlockRendererContext } from '../rendererTypes';

export function CTABlock({ block, context }: { block: CTABlockType; context: BlockRendererContext }) {
  if (!linkUrl.safeParse(block.props.buttonUrl).success) return null;
  const title = resolveLocalizedValue(block.props.title, context.locale).value;
  const buttonText = resolveLocalizedValue(block.props.buttonText, context.locale).value;
  if (!title || !buttonText) return null;
  const subtitle = resolveLocalizedValue(block.props.subtitle, context.locale).value;
  return (
    <BlockFrame block={block}>
      <aside data-cta-variant={block.props.variant}>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
        <a href={block.props.buttonUrl}>{buttonText}</a>
      </aside>
    </BlockFrame>
  );
}
