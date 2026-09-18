import type { DividerBlock as DividerBlockType } from '@/types/content';
import { BlockFrame } from '../blockFrame';
import type { BlockRendererContext } from '../rendererTypes';

export function DividerBlock({ block }: { block: DividerBlockType; context: BlockRendererContext }) {
  return <BlockFrame block={block}><hr data-divider-style={block.props.style} /></BlockFrame>;
}
