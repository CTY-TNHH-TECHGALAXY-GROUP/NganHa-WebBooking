/*
 * LayoutWrapper — Conditionally renders Header & FloatingWidgets
 * Hides them on /booking route (full-screen booking experience)
 */
'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header/Header';
import FloatingWidgets from '@/components/FloatingWidgets/FloatingWidgets';
import Footer from '@/components/Footer/Footer';
import SplashScreen from '@/components/SplashScreen/SplashScreen';

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isBookingPage = pathname === '/booking' || pathname.startsWith('/admin');

  return (
    <>
      {!isBookingPage && <SplashScreen />}
      {!isBookingPage && <Header />}
      {children}
      {!isBookingPage && <Footer />}
      {!isBookingPage && <FloatingWidgets />}
    </>
  );
};

export default LayoutWrapper;
