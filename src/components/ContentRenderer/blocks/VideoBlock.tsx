import type { ReactNode } from 'react';
import type { VideoBlock as VideoBlockType } from '@/types/content';
import { resolveLocalizedValue } from '@/lib/content/resolveLocalizedValue';
import { resolveMediaAsset } from '@/lib/content/media';
import { BlockFrame } from '../blockFrame';
import type { BlockRendererContext } from '../rendererTypes';

function externalVideoEmbed(provider: 'youtube' | 'vimeo', value: string) {
  try {
    const url = new URL(value);
    if (provider === 'youtube') {
      const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
    }
    const id = url.pathname.split('/').filter(Boolean).pop();
    return id ? `https://player.vimeo.com/video/${encodeURIComponent(id)}` : null;
  } catch {
    return null;
  }
}

export async function VideoBlock({ block, context }: { block: VideoBlockType; context: BlockRendererContext }) {
  let body: ReactNode = null;
  let poster: string | undefined;

  if (block.props.source.type === 'internal') {
    const asset = await resolveMediaAsset(context.resolveMedia, block.props.source.mediaId);
    if (!asset || asset.type !== 'video') return null;
    if (block.props.posterMediaId) {
      const posterAsset = await resolveMediaAsset(context.resolveMedia, block.props.posterMediaId);
      poster = posterAsset?.url;
    }
    body = <video controls playsInline preload="metadata" poster={poster} autoPlay={block.props.autoplay} style={{ width: '100%', height: 'auto' }} src={asset.url} />;
  } else {
    const src = externalVideoEmbed(block.props.source.provider, block.props.source.url);
    if (!src) return null;
    body = <iframe title="Embedded video" src={src} loading="lazy" allow="fullscreen; picture-in-picture" allowFullScreen style={{ width: '100%', aspectRatio: '16 / 9', border: 0 }} />;
  }

  const caption = resolveLocalizedValue(block.props.caption, context.locale).value;
  return <BlockFrame block={block}><figure style={{ margin: 0 }}>{body}{caption ? <figcaption>{caption}</figcaption> : null}</figure></BlockFrame>;
}
