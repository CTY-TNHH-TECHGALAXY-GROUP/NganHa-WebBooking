/*
 * LayoutWrapper — Conditionally renders Header & FloatingWidgets
 * Hides them on /booking route (full-screen booking experience)
 */
'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header/Header';
import FloatingWidgets from '@/components/FloatingWidgets/FloatingWidgets';

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isBookingPage = pathname === '/booking' || pathname.includes('/new-user/') || pathname.startsWith('/admin');

  return (
    <>
      {!isBookingPage && <Header />}
      {children}
      {!isBookingPage && <FloatingWidgets />}
    </>
  );
};

export default LayoutWrapper;
