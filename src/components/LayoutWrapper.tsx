/*
 * LayoutWrapper — Conditionally renders Header & FloatingWidgets
 * Hides them on /booking route (full-screen booking experience)
 */
'use client';

import { usePathname } from 'next/navigation';
import type { SpaWeatherStatus } from '@/lib/weather/types';
import Header from '@/components/Header/Header';
import FloatingWidgets from '@/components/FloatingWidgets/FloatingWidgets';
import Footer from '@/components/Footer/Footer';
import SplashScreen from '@/components/SplashScreen/SplashScreen';
import GlobalImagePreview from '@/components/Shared/GlobalImagePreview';

const LayoutWrapper = ({ children, initialWeatherStatus }: { children: React.ReactNode; initialWeatherStatus?: SpaWeatherStatus | null }) => {
  const pathname = usePathname();
  const isHomepage = pathname === '/' || /^\/(vi|en|cn|jp|kr)\/?$/.test(pathname);
  // /v/{code}: standalone e-voucher page (same as the admin /voucher page), no site chrome.
  const isVoucherPage = pathname.startsWith('/v/');
  const isBookingPage = pathname === '/booking' || pathname.startsWith('/admin') || isVoucherPage;
  const hideFloatingWidgets = pathname.includes('/checkout') || pathname === '/booking' || pathname.startsWith('/admin') || isVoucherPage;

  return (
    <>
      {!isBookingPage && !isHomepage && <SplashScreen />}
      {!isBookingPage && <Header />}
      {children}
      {!isBookingPage && <Footer />}
      {!hideFloatingWidgets && <FloatingWidgets initialWeatherStatus={initialWeatherStatus} />}
      <GlobalImagePreview />
    </>
  );
};

export default LayoutWrapper;
