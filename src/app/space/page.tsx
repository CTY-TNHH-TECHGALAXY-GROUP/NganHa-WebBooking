import React from 'react';
import SpacePage from '@/components/Space/SpacePage';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Oria Spa — Minimal Space Experience',
  description: 'Three spaces. One continuous journey through light, touch and quiet.',
};

export default async function Page() {
  let initialMedia: any = null;
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('WebBookingContent')
      .select('value')
      .eq('key', 'space_media')
      .maybeSingle();
    if (data?.value) {
      initialMedia = data.value;
    }
  } catch (err) {
    console.error('[space/page] Failed to load server space_media:', err);
  }

  return <SpacePage initialMedia={initialMedia} />;
}
