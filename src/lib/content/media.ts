import type { MediaAsset } from '@/types/content';

export type MediaResolver = (mediaId: string) => MediaAsset | null | Promise<MediaAsset | null>;

export async function resolveMediaAsset(
  resolver: MediaResolver | undefined,
  mediaId: string,
): Promise<MediaAsset | null> {
  if (!resolver) return null;
  try {
    return await resolver(mediaId);
  } catch (error) {
    console.error('[content] media resolution failed', { mediaId, error });
    return null;
  }
}
