import { apiResponse } from '@/lib/api/apiResponse';
import { getHeroVideoConfig } from '@/lib/config/heroVideos';

export const dynamic = 'force-dynamic';

const DEFAULT_VIDEOS = [
  { id: 'foot-massage', url: '/videos/0807(1).mp4', poster: 'https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg', sort_order: 1 },
];

export async function GET() {
  const config = await getHeroVideoConfig();

  // Preserve the legacy API response for consumers other than the homepage.
  return apiResponse.success(config.status === 'ready' ? config.videos : DEFAULT_VIDEOS);
}
