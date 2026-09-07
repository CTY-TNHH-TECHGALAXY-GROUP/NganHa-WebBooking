'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error Boundary]:', error);
  }, [error]);

  return (
    <html lang="vi">
      <body className="min-h-screen bg-[#0c0b0a] text-[#f7ebc7] flex flex-col items-center justify-center p-6 m-0 font-sans antialiased select-none">
        <div className="max-w-md w-full text-center flex flex-col items-center">
          {/* Oria Spa Monogram / Emblem */}
          <div className="w-16 h-16 rounded-full border border-[#D4AF37]/40 flex items-center justify-center mb-6 bg-[#D4AF37]/5">
            <span className="font-serif text-2xl text-[#D4AF37]">O</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37] text-xs uppercase tracking-[0.25em] mb-4">
            <span>Oria Spa Notice</span>
          </div>

          <h1 className="font-serif text-2xl md:text-3xl text-[#f7ebc7] font-normal mb-2">
            Đã xảy ra sự cố hệ thống
          </h1>
          <p className="font-serif text-lg text-[#c6a55f] italic tracking-wider mb-6">
            System Interruption
          </p>

          <p className="text-xs text-[#a89f91] leading-relaxed mb-8 max-w-sm">
            Ứng dụng gặp lỗi không mong muốn. Quý khách vui lòng làm mới hoặc thử lại sau giây lát.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:w-auto px-8 py-3 rounded-full bg-gradient-to-r from-[#ecd38f] via-[#D4AF37] to-[#c6a55f] text-[#1e1511] text-xs uppercase tracking-[0.2em] font-semibold shadow-lg hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
            >
              Thử Lại / Try Again
            </button>
            <a
              href="/"
              className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#D4AF37]/40 text-[#f7ebc7] hover:border-[#D4AF37] hover:text-[#D4AF37] text-xs uppercase tracking-[0.15em] transition-all inline-block"
            >
              Về Trang Chủ / Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
