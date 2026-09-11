import type { Metadata } from 'next';
import HomeSpaPage from '@/components/HomeSpa/HomeSpaPage';
import type { Locale } from '@/lib/constants';
import { getPageMetadata } from '@/lib/seo/metadata';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  return getPageMetadata({ routeKey: 'oriahome', pathname: `/${lang}/oriahome`, locale: lang as Locale, localized: true, defaultPathname: '/oriahome' }, {
    title: 'Oria Home Spa | Oria Spa',
    description: 'Oria Spa sends a technician directly to where you are - your home, apartment, or hotel room.',
  });
}

export default async function LocalizedHomeSpaPage({ params }: PageProps) {
  const { lang } = await params;
  return <HomeSpaPage initialLang={lang as Locale} />;
}
