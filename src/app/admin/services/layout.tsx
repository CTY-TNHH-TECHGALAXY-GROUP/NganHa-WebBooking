'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Sparkles, Flower2 } from 'lucide-react';

const TABS = [
  { label: 'Design your journey', href: '/admin/services', icon: LayoutDashboard },
  { label: 'Pure Relaxation', href: '/admin/services/pure', icon: Sparkles },
  { label: 'Space Experience', href: '/admin/services/space', icon: Sparkles },
  { label: 'Therapy (Sắp ra mắt)', href: '/admin/services/therapy', icon: Flower2 },
];

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sub-Navigation Tabs */}
      <div className="bg-admin-panel border-b border-admin-line sticky top-14 lg:top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-3">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              // Check if active. Because /admin/services is the prefix, we must match exactly for the root tab
              const isActive = tab.href === '/admin/services' 
                ? pathname === '/admin/services' 
                : pathname?.startsWith(tab.href);
                
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-medium whitespace-nowrap
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-admin-gold text-white shadow-md' 
                      : 'text-admin-text-dim hover:bg-admin-line hover:text-admin-text'
                    }
                  `}
                >
                  <Icon size={16} className={isActive ? 'text-white' : 'opacity-80'} />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
