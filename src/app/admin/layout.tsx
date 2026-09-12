'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  LayoutDashboard, BookOpen, FileText, Wrench, Film, Search, Globe, Settings, ArchiveRestore,
  Menu, X, ChevronRight, LogOut, ImagePlus, Compass, Home, Trees, Store, BarChart3, UserCog, type LucideIcon
} from 'lucide-react';
import { verifyAdminSessionAction } from '@/lib/auth/adminAction';

// 🔧 UI CONFIGURATION
const SIDEBAR_WIDTH = '260px';

type NavigationGate = 'analytics' | 'editorPermissions';
type AdminNavItem = { label: string; href: string; icon: LucideIcon; gate?: NavigationGate };

const NAV_ITEMS: AdminNavItem[] = [
  { label: 'Tổng quan', href: '/admin', icon: LayoutDashboard },
  { label: 'Câu chuyện (Our Story)', href: '/admin/our-story', icon: BookOpen },
  { label: 'Oria Home Spa', href: '/admin/oriahome', icon: Home },
  { label: 'Oria Farm Retreat', href: '/admin/oriafarm-retreat', icon: Trees },
  { label: 'Oria Farm Store', href: '/admin/oriafarm-store', icon: Store },
  { label: 'Local Tour Sài Gòn', href: '/admin/local-tour', icon: Compass },
  { label: 'Lịch sử Thương hiệu', href: '/admin/history', icon: BookOpen },
  { label: 'Lost & Found', href: '/admin/lost-and-found', icon: ArchiveRestore },
  { label: 'Video Trang chủ', href: '/admin/hero-videos', icon: Film },
  { label: 'Sách Lật (Flipbook)', href: '/admin/flipbook-pages', icon: BookOpen },
  { label: 'Bài viết (Blog)', href: '/admin/posts', icon: FileText },
  { label: 'Nội dung Blog', href: '/admin/content/blogs', icon: Globe },
  { label: 'Dịch vụ (Media & content)', href: '/admin/services', icon: Wrench },
  { label: 'Kho Media', href: '/admin/media-library', icon: ImagePlus },
  { label: 'Nội dung Đa Ngôn Ngữ', href: '/admin/content/homepage', icon: Globe },
  { label: 'Cấu hình Giao diện', href: '/admin/homepage-styling', icon: LayoutDashboard },
  { label: 'Cấu hình SEO', href: '/admin/seo', icon: Search },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, gate: 'analytics' },
  { label: 'Quyền Editor', href: '/admin/editor-permissions', icon: UserCog, gate: 'editorPermissions' },
  { label: 'Cấu hình hệ thống', href: '/admin/system-settings', icon: Settings },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
  const [navigationAccess, setNavigationAccess] = useState({ analytics: false, editorPermissions: false });

  const isLoginPage = pathname === '/admin/login' || pathname?.startsWith('/admin/login/');

  const verifyAccess = useCallback(async () => {
    if (isLoginPage) {
      return;
    }

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setAuthStatus('unauthorized');
        router.replace('/admin/login');
        return;
      }

      // Server-side check against WebbookingAdminUsers table
      const res = await verifyAdminSessionAction();

      if (!res.ok) {
        setAuthStatus('unauthorized');
        try {
          await supabase.auth.signOut();
          localStorage.clear();
          sessionStorage.clear();
        } catch {
          // ignore storage clearing errors
        }
        router.replace('/admin/login');
      } else {
        setNavigationAccess(res.navigation || { analytics: false, editorPermissions: false });
        setAuthStatus('authorized');
      }
    } catch (err) {
      console.error('[AdminLayout Auth Check]', err);
      setAuthStatus('unauthorized');
      router.replace('/admin/login');
    }
  }, [isLoginPage, router]);

  useEffect(() => {
    if (isLoginPage) {
      return;
    }

    verifyAccess();

    // Prevent Back button from displaying cached admin shell (bfcache)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        verifyAccess();
      }
    };
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [isLoginPage, verifyAccess]);

  const handleLogout = async () => {
    // Immediately drop authorization state so sidebar unmounts synchronously
    setAuthStatus('unauthorized');

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[Admin Logout Error]:', err);
    }

    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore storage errors
    }

    router.replace('/admin/login');
    router.refresh();
  };

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname?.startsWith(href);
  };

  // The login route must never inherit any authenticated admin chrome.
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Render loading state until authorization is fully confirmed. Never flash the sidebar.
  if (authStatus !== 'authorized') {
    return (
      <div className="min-h-screen bg-admin-bg flex items-center justify-center text-admin-text-dim">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-admin-gold/30 border-t-admin-gold rounded-full animate-spin" />
          <span className="text-sm font-medium tracking-wide">Đang xác thực quyền truy cập...</span>
        </div>
      </div>
    );
  }

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
        <span className="flex-1 text-admin-text font-bold text-lg"><span className="text-admin-gold mr-1">✦</span> Quản Trị NganHa</span>
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
        <div className="p-6 border-b border-admin-line-strong flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-admin-gold text-xl">✦</span>
            <div>
              <h1 className="text-base font-bold text-admin-text tracking-wide">Oria Spa</h1>
              <p className="text-[11px] text-admin-text-faint mt-0.5">Hệ thống quản trị nội dung</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.filter((item) => !item.gate || navigationAccess[item.gate]).map((item) => {
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
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-[13px] text-admin-text-faint hover:text-[#c85a5a] hover:bg-admin-line px-3 py-2.5 rounded-[9px] transition-colors">
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
