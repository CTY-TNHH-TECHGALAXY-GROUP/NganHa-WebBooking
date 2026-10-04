import type { Metadata } from 'next';
import OriaCarePage from '@/components/OriaCare/OriaCarePage';
import type { Locale } from '@/lib/constants';
import { getPageMetadata } from '@/lib/seo/metadata';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  return getPageMetadata({ routeKey: 'oriacare', pathname: `/${lang}/oriacare`, locale: lang as Locale, localized: true, defaultPathname: '/oriacare' }, {
    title: 'Oria Care | Oria Spa',
    description: 'In-home wellness & healthcare — Specialized care for elderly parents and expectant mothers within the Oria ecosystem.',
  });
}

export default async function LocalizedOriaCarePage({ params }: PageProps) {
  const { lang } = await params;
  return <OriaCarePage initialLang={lang as Locale} />;
}
