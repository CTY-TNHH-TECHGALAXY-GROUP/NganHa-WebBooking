import type { Metadata } from 'next';
import PureRelaxationPage from '@/components/PureRelaxation/PureRelaxationPage';
import { getPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata({ routeKey: 'pure-relaxation', pathname: '/pure-relaxation', localized: false }, {
    title: 'Pure Relaxation | Oria Spa',
    description: 'A compact, editorial service menu for Oria Spa relaxation rituals.',
  });
}

const Page = () => <PureRelaxationPage />;

export default Page;
