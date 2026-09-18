import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { ImageBlock as ImageBlockType, ImagePresentation } from '@/types/content';
import { resolveLocalizedValue } from '@/lib/content/resolveLocalizedValue';
import { resolveMediaAsset } from '@/lib/content/media';
import { imageComposition } from '@/lib/content/imageComposition';
import { BlockFrame } from '../blockFrame';
import type { BlockRendererContext } from '../rendererTypes';

export async function ImageBlock({ block, context }: { block: ImageBlockType; context: BlockRendererContext }) {
  const asset = await resolveMediaAsset(context.resolveMedia, block.props.mediaId);
  if (!asset || asset.type !== 'image' || !asset.url) return null;

  const composition = imageComposition(block, asset.width, asset.height);
  const alt = resolveLocalizedValue(block.props.alt, context.locale).value
    || resolveLocalizedValue(asset.alt_i18n, context.locale).value
    || asset.title;
  const frameStyle: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    aspectRatio: composition.aspectRatio === 'auto' ? undefined : composition.aspectRatio,
    background: '#eee',
  };
  const imageStyle: CSSProperties = {
    objectFit: block.props.fit || 'cover',
    objectPosition: composition.objectPosition,
    transform: composition.transform,
  };
  const caption = resolveLocalizedValue(block.props.caption, context.locale).value;
  const presentation = block.props.presentation || 'contained';
  const presentationWidths: Record<ImagePresentation, string> = {
    contained: '56rem',
    wide: '72rem',
    full: '100%',
    framed: '56rem',
  };
  const maxWidth = block.settings?.width ? undefined : presentationWidths[presentation];
  const figureStyle: CSSProperties = presentation === 'framed'
    ? { margin: 0, padding: '0.5rem', border: '1px solid rgba(0, 0, 0, 0.12)', background: '#fff' }
    : { margin: 0 };

  return (
    <BlockFrame block={block} maxWidth={maxWidth}>
      <figure data-image-presentation={presentation} style={figureStyle}>
        <div style={frameStyle}>
          <Image src={asset.url} alt={alt} fill sizes="(max-width: 768px) 100vw, 90vw" style={imageStyle} />
        </div>
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>
    </BlockFrame>
  );
}
