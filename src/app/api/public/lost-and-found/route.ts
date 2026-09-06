import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { toWebbookingLostFoundItem } from '@/lib/webbookingLostFound';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('WebbookingLostFound')
      .select('id, item_type, title, detail, found_at, found_on, image_url, status, sort_order')
      .in('status', ['available', 'contacting'])
      .order('sort_order', { ascending: true })
      .order('found_on', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ items: (data || []).map(toWebbookingLostFoundItem) }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    // The public page uses the existing SystemConfigs fallback until the migration is applied.
    console.warn('[public/lost-and-found] Falling back to legacy config:', error);
    return NextResponse.json({ items: [] });
  }
}
