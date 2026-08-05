import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { getSupabaseAdmin } from '@/lib/supabase-server';

async function getHeroVideos() {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from('SystemConfigs').select('value').eq('key', 'hero_videos').single();
    if (data && data.value) return data.value;
  } catch (e) {
    console.error(e);
  }
  return [];
}

async function saveHeroVideos(data: any) {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('SystemConfigs').upsert({ 
      key: 'hero_videos', 
      value: data 
    }, { onConflict: 'key' });
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export const DELETE = withAuth(async (req, ctx, { params }) => {
  const { id } = await params;
  const current = await getHeroVideos();
  
  const updated = current.filter((v: any) => v.id !== id);
  if (updated.length === current.length) {
    return apiResponse.error('Video không tồn tại', 'NOT_FOUND', 404);
  }
  
  await saveHeroVideos(updated);
  return apiResponse.success(updated);
});
