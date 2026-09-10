import type { Metadata } from 'next';
import FarmStorePage from '@/components/FarmStore/FarmStorePage';
import type { Locale } from '@/lib/constants';
import { getPageMetadata } from '@/lib/seo/metadata';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  return getPageMetadata({ routeKey: 'oriafarm-store', pathname: `/${lang}/oriafarm-store`, locale: lang as Locale, localized: true, defaultPathname: '/oriafarm-store' }, {
    title: 'Oria Farm Store | Green Nutrition from our Own Farm',
    description: '100% natural and free from preservatives — fresh fruits and organic ingredients from our farm for your everyday nutrition.',
  });
}

export default async function LocalizedFarmStorePage({ params }: PageProps) {
  const { lang } = await params;
  return <FarmStorePage initialLang={lang as Locale} />;
}
