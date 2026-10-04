import type { Metadata } from 'next';
import OriaCarePage from '@/components/OriaCare/OriaCarePage';
import { getPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata({ routeKey: 'oriacare', pathname: '/oriacare', localized: false }, {
    title: 'Oria Care | Oria Spa',
    description: 'Dịch vụ chăm sóc sức khỏe gia đình tại nhà — Dành cho cha mẹ lớn tuổi & Mẹ bầu thuộc hệ sinh thái Oria.',
  });
}

export default function Page() {
  return <OriaCarePage />;
}
