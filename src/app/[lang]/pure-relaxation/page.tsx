import type { Metadata } from 'next';
import PureRelaxationPage from '@/components/PureRelaxation/PureRelaxationPage';
import type { Locale } from '@/lib/constants';
import { getPageMetadata } from '@/lib/seo/metadata';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  return getPageMetadata({ routeKey: 'pure-relaxation', pathname: `/${lang}/pure-relaxation`, locale: lang as Locale, localized: true, defaultPathname: '/pure-relaxation' }, {
    title: 'Pure Relaxation | Oria Spa',
    description: 'A compact, editorial service menu for Oria Spa relaxation rituals.',
  });
}

const Page = () => <PureRelaxationPage />;

export default Page;
