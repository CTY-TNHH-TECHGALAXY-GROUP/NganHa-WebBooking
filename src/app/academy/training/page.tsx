import ComingSoon from '@/components/ComingSoon/ComingSoon';
import type { Metadata } from 'next';
import { getPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata({ routeKey: 'academy/training', pathname: '/academy/training', localized: false }, { title: 'Coming Soon | Oria Spa', description: 'Oria Spa Academy training.' });
}

export default function Page() {
  return <ComingSoon />;
}
