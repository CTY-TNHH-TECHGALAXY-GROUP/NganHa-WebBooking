import { revalidateTag, unstable_cache } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const HERO_VIDEOS_CACHE_TAG = 'hero-videos-config';
const HERO_VIDEOS_CACHE_KEY = 'hero-videos-config-v1';
const HERO_VIDEOS_CACHE_SECONDS = 60;

export type HeroVideo = {
  id: string;
  url?: string;
  media_url?: string;
  poster?: string;
  poster_url?: string;
  sort_order: number;
};

export type HeroVideoConfig = {
  status: 'ready' | 'empty' | 'error';
  videos: HeroVideo[];
};

const readHeroVideoValue = unstable_cache(
  async (): Promise<unknown> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('SystemConfigs')
      .select('value')
      .eq('key', 'hero_videos')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data?.value ?? null;
  },
  [HERO_VIDEOS_CACHE_KEY],
  {
    revalidate: HERO_VIDEOS_CACHE_SECONDS,
    tags: [HERO_VIDEOS_CACHE_TAG],
  },
);

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const readNonEmptyString = (value: unknown): string | undefined => (
  typeof value === 'string' && value.trim() ? value : undefined
);

const normalizeVideoUrl = (url: string): string => (
  url === '/videos/0807.mp4' ? '/videos/0807(1).mp4' : url
);

const normalizeVideo = (value: unknown, index: number): HeroVideo | null => {
  if (!isRecord(value)) return null;

  const url = readNonEmptyString(value.url);
  const mediaUrl = readNonEmptyString(value.media_url);
  if (!url && !mediaUrl) return null;

  const rawSortOrder = typeof value.sort_order === 'number'
    ? value.sort_order
    : Number(value.sort_order);

  return {
    id: readNonEmptyString(value.id) || (typeof value.id === 'number' ? String(value.id) : `hero-${index}`),
    ...(url ? { url: normalizeVideoUrl(url) } : {}),
    ...(mediaUrl ? { media_url: normalizeVideoUrl(mediaUrl) } : {}),
    ...(readNonEmptyString(value.poster) ? { poster: value.poster as string } : {}),
    ...(readNonEmptyString(value.poster_url) ? { poster_url: value.poster_url as string } : {}),
    sort_order: Number.isFinite(rawSortOrder) ? rawSortOrder : 0,
  };
};

const normalizeHeroVideoConfig = (value: unknown): HeroVideoConfig => {
  if (value === null || value === undefined) {
    return { status: 'empty', videos: [] };
  }

  if (!Array.isArray(value)) {
    return { status: 'error', videos: [] };
  }

  if (value.length === 0) {
    return { status: 'empty', videos: [] };
  }

  const videos = value.map(normalizeVideo);
  if (videos.some((video) => video === null)) {
    return { status: 'error', videos: [] };
  }

  const orderedVideos = videos
    .map((video, index) => ({ video: video as HeroVideo, index }))
    .sort((a, b) => a.video.sort_order - b.video.sort_order || a.index - b.index)
    .map(({ video }) => video);

  return { status: 'ready', videos: orderedVideos };
};

export async function getHeroVideoConfig(): Promise<HeroVideoConfig> {
  try {
    return normalizeHeroVideoConfig(await readHeroVideoValue());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[hero-videos] Failed to read hero configuration:', message);
    return { status: 'error', videos: [] };
  }
}

export function revalidateHeroVideoConfig(): void {
  revalidateTag(HERO_VIDEOS_CACHE_TAG);
}
