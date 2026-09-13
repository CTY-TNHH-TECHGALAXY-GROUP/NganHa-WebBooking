/*
 * Page: /booking
 * Full-screen booking experience — reuses StandardMenu from wrb-noi-bo-dev
 * Flow: Menu (chọn dịch vụ) → Checkout (thông tin + ngày/giờ + xác nhận)
 */

import BookingPage from './BookingPage';
import type { Metadata } from 'next';
import { getPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata({ routeKey: 'booking', pathname: '/booking', localized: false }, {
    title: 'Đặt Lịch | ORIA SPA',
    description: 'Đặt lịch trực tuyến tại ORIA SPA — chọn dịch vụ, thời gian và chi nhánh.',
  });
}

const Page = () => {
  return <BookingPage />;
};

export default Page;
