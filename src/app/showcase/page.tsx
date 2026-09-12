import ShowcaseLanding from '@/components/ShowcaseLanding/ShowcaseLanding';
import type { Metadata } from 'next';
import { getPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata({ routeKey: 'showcase', pathname: '/showcase', localized: false }, {
    title: 'ORIA SPA | Showcase Landing Page',
    description: 'Trải nghiệm dịch vụ spa cao cấp tại Quận 1. Đặt lịch online, KTV chuyên nghiệp 10+ năm kinh nghiệm, hỗ trợ 5 ngôn ngữ.',
  });
}

const ShowcasePage = () => {
  return <ShowcaseLanding />;
};

export default ShowcasePage;
