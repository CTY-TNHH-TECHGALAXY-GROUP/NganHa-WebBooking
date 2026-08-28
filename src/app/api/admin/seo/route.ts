import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const DEFAULT_SEO = {
  title: "Ngân Hà Barbershop & Spa | Premium Spa in District 1, HCMC",
  description: "Experience premium spa, barbershop, and wellness services at Ngan Ha. Located at 11 Ngo Duc Ke & 6B Thi Sach, District 1, Ho Chi Minh City. Book online now!",
  keywords: "spa district 1, barbershop HCMC, Ngan Ha Spa, massage Saigon, ear cleaning spa, đặt lịch spa, spa Quận 1",
  ogImage: "https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg"
};

async function getSeo() {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from('SystemConfigs').select('value').eq('key', 'seo_config').single();
    if (data && data.value) return data.value;
  } catch (e) {
    console.error('Error reading seo_config from DB', e);
  }
  return DEFAULT_SEO;
}

async function saveSeo(data: any) {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('SystemConfigs').upsert({ 
      key: 'seo_config', 
      value: data,
      description: 'Cấu hình SEO toàn hệ thống'
    }, { onConflict: 'key' });
    return true;
  } catch (e) {
    console.error('Error writing seo_config to DB', e);
    return false;
  }
}

export const GET = withAuth(async () => {
  return apiResponse.success(await getSeo());
});

export const POST = withAuth(async (req) => {
  const body = await req.json();
  const current = await getSeo();
  
  const updated = {
    ...current,
    ...body
  };
  
  await saveSeo(updated);
  return apiResponse.success(updated);
});
