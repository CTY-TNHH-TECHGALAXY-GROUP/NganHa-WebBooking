'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  analyticsConsentEventName,
  getAnalyticsConsent,
  startAnalyticsRuntime,
  stopAnalyticsRuntime,
  trackAnalytics,
} from './client';

export default function AnalyticsRuntime() {
  const pathname = usePathname() || '/';
  const firstPathRef = useRef<string | null>(null);

  useEffect(() => {
    const syncRuntime = () => {
      if (getAnalyticsConsent() === 'granted') startAnalyticsRuntime();
      else stopAnalyticsRuntime();
    };

    syncRuntime();
    window.addEventListener(analyticsConsentEventName, syncRuntime);
    window.addEventListener('storage', syncRuntime);
    return () => {
      window.removeEventListener(analyticsConsentEventName, syncRuntime);
      window.removeEventListener('storage', syncRuntime);
    };
  }, []);

  useEffect(() => {
    if (firstPathRef.current === pathname) return;
    firstPathRef.current = pathname;
    trackAnalytics('page_view', { page_path: pathname });
  }, [pathname]);

  return null;
}
