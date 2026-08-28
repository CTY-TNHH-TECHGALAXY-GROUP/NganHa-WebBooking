/*
 * BookingPage — Client component
 * Manages the full booking flow:
 * 1. MENU phase: StandardMenu (chọn dịch vụ, custom for you)
 * 2. CHECKOUT phase: BookingCheckout (thông tin, ngày/giờ, xác nhận)
 */
'use client';

import React, { useState } from 'react';
import { MenuProvider } from '@/components/Menu/MenuContext';
import StandardMenu from '@/components/Menu/Standard';
import BookingCheckout from '@/components/BookingCheckout/BookingCheckout';
import { useRouter } from 'next/navigation';
import { CartItem } from '@/components/Menu/types';

// 🔧 UI CONFIGURATION
const DEFAULT_LANG = 'vn';

type BookingPhase = 'MENU' | 'CHECKOUT';

const BookingPage = () => {
  const router = useRouter();
  const [phase, setPhase] = useState<BookingPhase>('MENU');
  const [lang] = useState(DEFAULT_LANG);

  const handleBack = () => {
    router.push('/');
  };

  const handleProceedToCheckout = () => {
    setPhase('CHECKOUT');
  };

  const handleBackToMenu = () => {
    setPhase('MENU');
  };

  return (
    <MenuProvider>
      {phase === 'MENU' && (
        <StandardMenu
          lang={lang}
          onBack={handleBack}
          onCheckout={handleProceedToCheckout}
        />
      )}

      {phase === 'CHECKOUT' && (
        <BookingCheckout
          lang={lang}
          onBack={handleBackToMenu}
        />
      )}
    </MenuProvider>
  );
};

export default BookingPage;
