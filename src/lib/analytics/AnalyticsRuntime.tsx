'use client';

import { useCallback, useEffect, useRef } from 'react';
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
  const trackedPathRef = useRef<string | null>(null);

  const trackCurrentPath = useCallback(() => {
    if (getAnalyticsConsent() !== 'granted' || trackedPathRef.current === pathname) return;
    trackedPathRef.current = pathname;
    trackAnalytics('page_view', { page_path: pathname });
  }, [pathname]);

  useEffect(() => {
    const syncRuntime = () => {
      if (getAnalyticsConsent() === 'granted') startAnalyticsRuntime();
      else stopAnalyticsRuntime();
      trackCurrentPath();
    };

    syncRuntime();
    window.addEventListener(analyticsConsentEventName, syncRuntime);
    window.addEventListener('storage', syncRuntime);
    return () => {
      window.removeEventListener(analyticsConsentEventName, syncRuntime);
      window.removeEventListener('storage', syncRuntime);
    };
  }, [pathname, trackCurrentPath]);

  useEffect(() => {
    trackCurrentPath();
  }, [pathname, trackCurrentPath]);

  return null;
}
