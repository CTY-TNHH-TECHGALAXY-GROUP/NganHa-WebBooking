'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, BookOpen, FileText, Wrench, Film, Search, Globe, Settings,
  Menu, X, ChevronRight, LogOut, ImagePlus
} from 'lucide-react';

// 🔧 UI CONFIGURATION
const SIDEBAR_WIDTH = '260px';

const NAV_ITEMS = [
  { label: 'Tổng quan', href: '/admin', icon: LayoutDashboard },
  { label: 'Video Trang chủ', href: '/admin/hero-videos', icon: Film },
  { label: 'Sách Lật (Flipbook)', href: '/admin/flipbook-pages', icon: BookOpen },
  { label: 'Bài viết (Blog)', href: '/admin/posts', icon: FileText },
  { label: 'Dịch vụ (Media)', href: '/admin/services', icon: Wrench },
  { label: 'Kho Media', href: '/admin/media-library', icon: ImagePlus },
  { label: 'Nội dung Đa Ngôn Ngữ', href: '/admin/content', icon: Globe },
  { label: 'Cấu hình SEO', href: '/admin/seo', icon: Search },
  { label: 'Cấu hình hệ thống', href: '/admin/system-settings', icon: Settings },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-admin-bg text-admin-text">
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-admin-side border-b border-admin-line-strong flex items-center px-4 gap-3 shadow-[var(--shadow)]">
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)} 
          className="p-2 rounded-lg hover:bg-admin-line transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span className="text-admin-text font-bold text-lg"><span className="text-admin-gold mr-1">✦</span> Quản Trị NganHa</span>
      </div>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-40" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 bottom-0 z-50
        w-[260px] bg-admin-side border-r border-admin-line-strong
        flex flex-col
        transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-admin-line-strong flex items-center gap-2">
          <span className="text-admin-gold text-xl">✦</span>
          <div>
            <h1 className="text-base font-bold text-admin-text tracking-wide">NganHa Admin</h1>
            <p className="text-[11px] text-admin-text-faint mt-0.5">Hệ thống quản trị nội dung</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium
                  transition-all duration-200
                  ${active 
                    ? 'bg-admin-gold-dim text-admin-gold' 
                    : 'text-admin-text-dim hover:bg-admin-line hover:text-admin-text'
                  }
                `}
              >
                <Icon size={18} className={active ? 'text-admin-gold opacity-100' : 'text-admin-text-dim opacity-80'} />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight size={14} className="text-admin-gold opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-admin-line-strong flex flex-col gap-1">
          <Link href="/" className="flex items-center gap-2 text-[13px] text-admin-text-faint hover:text-admin-text-dim hover:bg-admin-line px-3 py-2.5 rounded-[9px] transition-colors">
            ← Về trang chủ
          </Link>
          <button className="w-full flex items-center gap-2 text-[13px] text-admin-text-faint hover:text-[#c85a5a] hover:bg-admin-line px-3 py-2.5 rounded-[9px] transition-colors">
            <LogOut size={16} className="opacity-80" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`
        lg:ml-[260px] 
        min-h-screen
        pt-14 lg:pt-0
      `}>
        <div className="p-4 lg:p-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
