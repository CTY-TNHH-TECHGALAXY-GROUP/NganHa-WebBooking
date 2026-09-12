import ComingSoon from '@/components/ComingSoon/ComingSoon';
import type { Metadata } from 'next';
import { getPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata({ routeKey: 'privileges', pathname: '/privileges', localized: false }, {
    title: 'Coming Soon | Oria Spa',
    description: 'Oria Spa privileges and member benefits.',
  });
}

export default function Page() {
  return <ComingSoon />;
}
