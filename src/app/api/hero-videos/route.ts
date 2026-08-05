import { NextResponse } from 'next/server';
import { apiResponse } from '@/lib/api/apiResponse';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const DEFAULT_VIDEOS = [
  { id: 'foot-massage', url: '/videos/video1.mp4', poster: 'https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg', sort_order: 1 },
  { id: 'space-v1', url: '/videos/space/v1-2.mp4', poster: 'https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg', sort_order: 2 },
  { id: 'space-v3', url: '/videos/space/v3.mp4', poster: 'https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg', sort_order: 3 },
  { id: 'space-v4', url: '/videos/space/v4-r.mp4', poster: 'https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg', sort_order: 4 },
  { id: 'space-stair', url: '/videos/space/stair-resize.mp4', poster: 'https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg', sort_order: 5 },
  { id: 'space-toilet', url: '/videos/space/toilet-resize.mp4', poster: 'https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg', sort_order: 6 },
  { id: 'space-yumi', url: '/videos/space/yumi.mp4', poster: 'https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg', sort_order: 7 },
];

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from('SystemConfigs').select('value').eq('key', 'hero_videos').single();
    
    if (data && data.value && Array.isArray(data.value) && data.value.length > 0) {
      return apiResponse.success(data.value);
    }
    
    // Nếu chưa có, trả về default
    return apiResponse.success(DEFAULT_VIDEOS);
  } catch (error: any) {
    console.error('Lỗi khi lấy video trang chủ:', error);
    return apiResponse.success(DEFAULT_VIDEOS);
  }
}
