import type { Metadata } from 'next';
import FarmRetreatPage from '@/components/FarmRetreat/FarmRetreatPage';
import { getPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata({ routeKey: 'oriafarm-retreat', pathname: '/oriafarm-retreat', localized: false }, {
    title: 'Oria Farm Retreat | Một ngày rời khỏi thành phố',
    description: 'Oria Farm Retreat được tạo ra như một khoảng nghỉ trong ngày giữa thiên nhiên — bungalow riêng, xông hơi, tắm bồn và xoa bóp toàn thân.',
  });
}

export default function Page() {
  return <FarmRetreatPage />;
}
