import { withCapability } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { revalidateHeroVideoConfig } from '@/lib/config/heroVideos';
import { authorizeCapability } from '@/lib/auth/adminCapabilities';

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
    const { error } = await supabase.from('SystemConfigs').upsert({
      key: 'hero_videos', 
      value: data 
    }, { onConflict: 'key' });
    if (error) throw error;
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export const DELETE = withCapability(async (req, access, params) => {
  const publishAuthorization = await authorizeCapability(access, 'content.publish', { scope: 'hero_videos', mutation: true });
  if (!publishAuthorization.allowed) {
    return apiResponse.error(publishAuthorization.error, publishAuthorization.code, publishAuthorization.status);
  }
  const { id } = await params;
  const current = await getHeroVideos();
  
  const updated = current.filter((v: any) => v.id !== id);
  if (updated.length === current.length) {
    return apiResponse.error('Video không tồn tại', 'NOT_FOUND', 404);
  }
  
  if (await saveHeroVideos(updated)) {
    revalidateHeroVideoConfig();
  }
  return apiResponse.success(updated);
}, 'content.write', { scope: 'hero_videos', mutation: true });
