import type { Metadata } from 'next';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { toWebbookingLostFoundItem, type WebbookingLostFoundItem } from '@/lib/webbookingLostFound';
import LostAndFoundPage from '@/components/LostAndFound/LostAndFoundPage';
import { getPageMetadata } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata({ routeKey: 'lost-and-found', pathname: '/lost-and-found', localized: false }, {
    title: 'Lost & Found | Oria Spa',
    description: 'A thoughtful place to reconnect guests with belongings left at Oria Spa.',
  });
}

export default async function Page() {
  let initialItems: WebbookingLostFoundItem[] = [];
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('WebbookingLostFound')
      .select('id, item_type, title, detail, found_at, found_on, image_url, status, sort_order')
      .in('status', ['available', 'contacting'])
      .order('sort_order', { ascending: true })
      .order('found_on', { ascending: false });

    if (!error && data && data.length > 0) {
      initialItems = data.map(toWebbookingLostFoundItem);
    }
  } catch (err) {
    console.error('[LostAndFound Page] Server fetch error:', err);
  }

  return <LostAndFoundPage initialItems={initialItems} />;
}
