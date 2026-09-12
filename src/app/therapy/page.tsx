import ComingSoon from '@/components/ComingSoon/ComingSoon';
import type { Metadata } from 'next';
import { getPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata({ routeKey: 'therapy', pathname: '/therapy', localized: false }, {
    title: 'Coming Soon | Oria Spa',
    description: 'Therapy services at Oria Spa.',
  });
}

export default function TherapyPage() {
  return <ComingSoon />;
}
