import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { GalleryBlock as GalleryBlockType, ImageAspectRatio } from '@/types/content';
import { resolveLocalizedValue } from '@/lib/content/resolveLocalizedValue';
import { resolveMediaAsset } from '@/lib/content/media';
import { BlockFrame } from '../blockFrame';
import type { BlockRendererContext } from '../rendererTypes';

const ratios: Record<ImageAspectRatio, string> = {
  original: '4 / 3',
  '16:9': '16 / 9',
  '4:3': '4 / 3',
  '3:2': '3 / 2',
  '1:1': '1 / 1',
  '3:4': '3 / 4',
};

export async function GalleryBlock({ block, context }: { block: GalleryBlockType; context: BlockRendererContext }) {
  const items = await Promise.all(block.props.items.map(async (item) => ({
    item,
    asset: await resolveMediaAsset(context.resolveMedia, item.mediaId),
  })));
  const validItems = items.filter(({ asset }) => asset?.type === 'image' && asset.url);
  if (validItems.length === 0) return null;

  const columns = block.props.layout === 'grid-2' ? 2 : block.props.layout === 'grid-4' ? 4 : block.props.layout === 'grid-3' ? 3 : 3;
  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: '1rem',
    overflowX: block.props.layout === 'carousel' ? 'auto' : undefined,
  };
  const ratio = ratios[block.props.aspectRatio || '4:3'];

  return (
    <BlockFrame block={block}>
      <div style={gridStyle} data-gallery-layout={block.props.layout}>
        {validItems.map(({ item, asset }) => {
          const focalPoint = item.focalPoint || { x: 50, y: 50 };
          const alt = resolveLocalizedValue(item.alt, context.locale).value
            || resolveLocalizedValue(asset?.alt_i18n, context.locale).value
            || asset?.title || '';
          return (
            <figure key={item.id} style={{ margin: 0 }}>
              <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: ratio, background: '#eee' }}>
                <Image
                  src={asset!.url}
                  alt={alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  style={{ objectFit: 'cover', objectPosition: `${focalPoint.x}% ${focalPoint.y}%` }}
                />
              </div>
              {resolveLocalizedValue(item.caption, context.locale).value ? (
                <figcaption>{resolveLocalizedValue(item.caption, context.locale).value}</figcaption>
              ) : null}
            </figure>
          );
        })}
      </div>
    </BlockFrame>
  );
}
