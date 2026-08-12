'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, LayoutTemplate } from 'lucide-react';

const TABS = [
  { label: 'Nội Dung Trang Chủ', href: '/admin/content/homepage', icon: Globe },
  { label: 'Thông Tin Footer', href: '/admin/content/footer', icon: LayoutTemplate },
];

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-admin-bg p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-admin-text">🌐 Nội dung Đa Ngôn Ngữ</h1>
          <p className="text-admin-text-dim mt-2">Quản lý và dịch nội dung hiển thị trên trang web theo các ngôn ngữ khác nhau.</p>
        </div>

        {/* Sub-navigation (Tabs) */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-full text-[13.5px] font-semibold whitespace-nowrap transition-all duration-200 border
                  ${isActive 
                    ? 'bg-admin-gold text-[#241804] border-admin-gold shadow-sm' 
                    : 'bg-admin-panel border-admin-line text-admin-text-dim hover:text-admin-text hover:border-admin-gold/50'
                  }
                `}
              >
                <Icon size={16} className={isActive ? 'text-[#241804]' : 'opacity-70'} />
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="bg-transparent rounded-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
