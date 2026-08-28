import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const DEFAULT_VIDEOS = [
  { id: '1', url: '/videos/video1.mp4', poster: 'https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg', sort_order: 1 },
  { id: '0720', url: '/videos/0720.mp4', poster: 'https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg', sort_order: 2 },
];

async function getHeroVideos() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('SystemConfigs')
      .select('value')
      .eq('key', 'hero_videos')
      .single();
    
    if (data && data.value) {
      return data.value;
    }
    
    // Nếu chưa có trong DB, tạo mặc định
    await saveHeroVideos(DEFAULT_VIDEOS);
    return DEFAULT_VIDEOS;
  } catch (e) {
    console.error('Error reading hero_videos from DB', e);
    return DEFAULT_VIDEOS;
  }
}

async function saveHeroVideos(data: any) {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('SystemConfigs')
      .upsert({ 
        key: 'hero_videos', 
        value: data,
        description: 'Cấu hình danh sách video trang chủ'
      }, { onConflict: 'key' });
      
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Error writing hero_videos to DB', e);
    return false;
  }
}

export const GET = withAuth(async () => {
  return apiResponse.success(await getHeroVideos());
});

export const POST = withAuth(async (req) => {
  const body = await req.json();
  const { url, poster } = body;

  const current = await getHeroVideos();
  
  const newItem = {
    id: Date.now().toString(),
    url,
    poster: poster || 'https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg',
    sort_order: current.length + 1
  };
  
  current.push(newItem);
  await saveHeroVideos(current);

  return apiResponse.success(newItem);
});
