'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase';

export default function BookingBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState<{ name: string; id: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`admin-new-bookings-${Math.random()}`)
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'Bookings' },
        (payload: any) => {
          const booking = payload.new;
          setUnreadCount(prev => prev + 1);

          // Play sound (silent fail if file not found)
          try {
            new Audio('/sounds/new-order.mp3').play().catch(() => {});
          } catch (_) {}

          // Show toast
          setToast({ name: booking.customerName || 'Khách mới', id: booking.id });
          if (toastTimer.current) clearTimeout(toastTimer.current);
          toastTimer.current = setTimeout(() => setToast(null), 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const handleClick = () => {
    setUnreadCount(0);
    router.push('/admin/bookings');
  };

  return (
    <>
      {/* Bell button */}
      <button
        onClick={handleClick}
        className="relative p-2 rounded-xl hover:bg-admin-line transition-colors"
        title={unreadCount > 0 ? `${unreadCount} đơn mới chưa xem` : 'Đơn đặt lịch'}
        aria-label="Booking notifications"
      >
        <Bell
          size={20}
          className={unreadCount > 0 ? 'text-admin-gold animate-pulse' : 'text-admin-text-dim'}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shadow-lg leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 bg-admin-panel border border-admin-gold/40 rounded-2xl px-4 py-3 shadow-2xl">
          <div className="w-9 h-9 bg-admin-gold/10 rounded-full flex items-center justify-center shrink-0 animate-bounce">
            <Bell size={18} className="text-admin-gold" />
          </div>
          <div>
            <div className="text-admin-text font-bold text-sm">🛎️ Đơn đặt lịch mới!</div>
            <div className="text-admin-text-dim text-xs mt-0.5">{toast.name} vừa đặt lịch</div>
          </div>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-admin-text-faint hover:text-admin-text text-xs"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
