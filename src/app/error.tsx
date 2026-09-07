'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import SmartLogo from '@/components/SmartLogo';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[App Error Boundary]:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#0c0b0a] text-[#f7ebc7] flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden select-none">
      {/* Subtle radial ambient background glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(212, 175, 55, 0.15), transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-lg w-full flex flex-col items-center text-center">
        {/* Brand Logo */}
        <div className="mb-8 w-44 md:w-52 transition-transform duration-500 hover:scale-105">
          <SmartLogo theme="dark" alt="Oria Spa Logo" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37] text-xs uppercase tracking-[0.25em] font-sans mb-6">
          <span>Hệ Thống / Notice</span>
        </div>

        {/* Heading */}
        <h1 className="font-serif text-2xl md:text-3xl text-[#f7ebc7] tracking-wide font-normal mb-2">
          Đã xảy ra sự cố
        </h1>
        <p className="font-serif text-lg md:text-xl text-[#c6a55f] italic tracking-wider mb-6">
          An Unexpected Interruption
        </p>

        {/* Divider */}
        <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent mb-6" />

        {/* Explanatory Message */}
        <p className="text-xs md:text-sm text-[#a89f91] font-sans leading-relaxed mb-8 max-w-md">
          Hệ thống đang gặp gián đoạn tạm thời trong quá trình tải dữ liệu. Quý khách vui lòng thử lại hoặc trở về trang chủ.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-gradient-to-r from-[#ecd38f] via-[#D4AF37] to-[#c6a55f] text-[#1e1511] font-sans text-xs uppercase tracking-[0.2em] font-semibold shadow-lg hover:brightness-110 active:scale-[0.98] transition-all duration-300 cursor-pointer"
          >
            Thử Lại / Try Again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-full border border-[#D4AF37]/40 text-[#f7ebc7] hover:border-[#D4AF37] hover:text-[#D4AF37] font-sans text-xs uppercase tracking-[0.15em] transition-all duration-300"
          >
            Về Trang Chủ / Return Home
          </Link>
        </div>
      </div>

      {/* Footer copyright note */}
      <div className="absolute bottom-8 text-center text-[10px] text-[#6e665d] uppercase tracking-widest font-sans">
        Oria Spa · Let us understand you
      </div>
    </main>
  );
}
