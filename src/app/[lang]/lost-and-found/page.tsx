import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { toWebbookingLostFoundItem, type WebbookingLostFoundItem } from '@/lib/webbookingLostFound';
import LostAndFoundPage from '@/components/LostAndFound/LostAndFoundPage';
import { SUPPORTED_LOCALES, type Locale } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Lost & Found | Oria Spa',
  description: 'A thoughtful place to reconnect guests with belongings left at Oria Spa.',
};

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function LocalizedLostAndFoundPage({ params }: PageProps) {
  const resolvedParams = await params;
  const lang = resolvedParams?.lang;

  if (!lang || !SUPPORTED_LOCALES.includes(lang as Locale)) {
    notFound();
  }

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
    console.error('[LocalizedLostAndFound Page] Server fetch error:', err);
  }

  return <LostAndFoundPage initialItems={initialItems} forcedLang={lang} />;
}
