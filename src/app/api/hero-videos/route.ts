import { NextResponse } from 'next/server';
import { apiResponse } from '@/lib/api/apiResponse';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const DEFAULT_VIDEOS = [
  { id: 'foot-massage', url: '/videos/0807.mp4', poster: 'https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg', sort_order: 1 },
];

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('SystemConfigs')
      .select('value')
      .eq('key', 'hero_videos')
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found

    if (!data || !data.value || data.value.length === 0) {
      return apiResponse.success(DEFAULT_VIDEOS);
    }

    return apiResponse.success(data.value);
  } catch (error: any) {
    console.error('Error fetching hero videos:', error);
    // Fallback to default if DB fails
    return apiResponse.success(DEFAULT_VIDEOS);
  }
}
