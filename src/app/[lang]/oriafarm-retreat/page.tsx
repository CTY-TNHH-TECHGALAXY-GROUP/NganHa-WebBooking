import type { Metadata } from 'next';
import FarmRetreatPage from '@/components/FarmRetreat/FarmRetreatPage';
import type { Locale } from '@/lib/constants';
import { getPageMetadata } from '@/lib/seo/metadata';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  return getPageMetadata({ routeKey: 'oriafarm-retreat', pathname: `/${lang}/oriafarm-retreat`, locale: lang as Locale, localized: true, defaultPathname: '/oriafarm-retreat' }, {
    title: 'Oria Farm Retreat | A Day Away from the City',
    description: 'Oria Farm Retreat is created as a daytime escape surrounded by nature — private bungalow, steam, bath, and full-body massage.',
  });
}

export default async function LocalizedFarmRetreatPage({ params }: PageProps) {
  const { lang } = await params;
  return <FarmRetreatPage initialLang={lang as Locale} />;
}
