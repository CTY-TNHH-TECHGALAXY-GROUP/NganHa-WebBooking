import type { ImageAspectRatio, ImageBlock } from '../../types/content/content.ts';

const aspectRatios: Record<ImageAspectRatio, string> = {
  original: '16 / 9',
  '16:9': '16 / 9',
  '4:3': '4 / 3',
  '3:2': '3 / 2',
  '1:1': '1 / 1',
  '3:4': '3 / 4',
};

export function imageComposition(block: ImageBlock, width: number | null, height: number | null) {
  const focalPoint = block.props.focalPoint || { x: 50, y: 50 };
  const zoom = block.props.zoom || 1;
  const aspectRatio = block.props.aspectRatio || '16:9';
  return {
    objectPosition: `${focalPoint.x}% ${focalPoint.y}%`,
    transform: `scale(${zoom})`,
    aspectRatio: aspectRatio === 'original' && width && height ? `${width} / ${height}` : aspectRatios[aspectRatio],
  };
}
