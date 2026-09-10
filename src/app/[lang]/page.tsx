import { notFound } from 'next/navigation';
import { SUPPORTED_LOCALES } from '@/lib/constants';
import { getHeroVideoConfig } from '@/lib/config/heroVideos';
import LocalizedHomePageClient from './LocalizedHomePageClient';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export const dynamic = 'force-dynamic';

export default async function LocalizedHomePage({ params }: PageProps) {
  const { lang } = await params;

  if (!SUPPORTED_LOCALES.includes(lang as any)) {
    notFound();
  }

  const initialHeroConfig = await getHeroVideoConfig();
  return <LocalizedHomePageClient lang={lang} initialHeroConfig={initialHeroConfig} />;
}
