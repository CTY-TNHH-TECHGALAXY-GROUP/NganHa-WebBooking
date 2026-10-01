'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/components/TranslationProvider';
import type { Locale } from '@/lib/constants';
import type { SpaWeatherStatus as WeatherStatus } from '@/lib/weather/types';
import { weatherTexts } from './SpaWeatherStatus.i18n';

const icons: Record<WeatherStatus, string> = {
  no_rain: '☀️',
  rain_soon: '🌦️',
  light_rain: '🌧️',
  rain: '🌧️',
};

export default function SpaWeatherStatus() {
  const { currentLang } = useTranslation();
  const [status, setStatus] = useState<WeatherStatus | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/weather/spa', { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (!controller.signal.aborted && data && typeof data.status === 'string' && Object.hasOwn(icons, data.status)) {
          setStatus(data.status as WeatherStatus);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  if (!status) return null;

  const copy = weatherTexts[currentLang as Locale] || weatherTexts.en;
  const label = {
    no_rain: copy.noRain,
    rain_soon: copy.rainSoon,
    light_rain: copy.lightRain,
    rain: copy.rain,
  }[status];

  return (
    <div role="status" className="inline-flex max-w-full items-start gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/[0.06] px-3 py-2 text-[13px] leading-5 text-[#f7ebc7]/80">
      <span aria-hidden="true">{icons[status]}</span>
      <span>
        {label}
        {status === 'rain' && <span className="block text-[#f7ebc7]/60">{copy.travelDelay}</span>}
      </span>
    </div>
  );
}
