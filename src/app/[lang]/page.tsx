import { notFound } from 'next/navigation';
import { SUPPORTED_LOCALES } from '@/lib/constants';
import { getHeroVideoConfig } from '@/lib/config/heroVideos';
import LocalizedHomePageClient from './LocalizedHomePageClient';
import AeoAnswerContent from '@/components/Seo/AeoAnswerContent';
import SeoStructuredData from '@/components/Seo/SeoStructuredData';
import { getPageMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/constants';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps) {
  const { lang } = await params;
  if (!SUPPORTED_LOCALES.includes(lang as any)) return {};
  return getPageMetadata({
    routeKey: 'home',
    pathname: `/${lang}`,
    locale: lang as Locale,
    localized: true,
    defaultPathname: '/',
  });
}

export default async function LocalizedHomePage({ params }: PageProps) {
  const { lang } = await params;

  if (!SUPPORTED_LOCALES.includes(lang as any)) {
    notFound();
  }

  const initialHeroConfig = await getHeroVideoConfig();
  return (
    <>
      <LocalizedHomePageClient lang={lang} initialHeroConfig={initialHeroConfig} />
      <AeoAnswerContent routeKey="home" locale={lang as Locale} />
      <SeoStructuredData routeKey="home" locale={lang as Locale} pathname={`/${lang}`} />
    </>
  );
}
