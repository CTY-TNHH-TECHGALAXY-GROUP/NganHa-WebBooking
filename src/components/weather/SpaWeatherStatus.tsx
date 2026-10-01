'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import type { Locale } from '@/lib/constants';
import type { SpaWeatherStatus as WeatherStatus } from '@/lib/weather/types';
import { Z } from '@/lib/zIndex';
import { weatherTexts } from './SpaWeatherStatus.i18n';
import styles from './SpaWeatherStatus.module.css';

const DISMISSED_KEY = 'oria-spa-weather-message-dismissed';
const validStatuses = new Set<WeatherStatus>(['no_rain', 'rain_soon', 'light_rain', 'rain']);

function WeatherIcon({ status }: { status: WeatherStatus }) {
  const showSun = status === 'no_rain' || status === 'rain_soon';
  const isRaining = status === 'light_rain' || status === 'rain';

  return (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {showSun && (
        <>
          <circle cx="15" cy="14" r="6.5" fill="#F4C55D" />
          <path d="M15 3v3M15 22v3M4 14h3M6.8 5.8 9 8" stroke="#F4C55D" strokeWidth="2.2" strokeLinecap="round" />
        </>
      )}
      <path
        d="M13 33c-5 0-8.5-3.5-8.5-8 0-4 2.8-7.3 6.7-8.1C13 11.9 17.5 9 22.7 9c5 0 8.9 3.4 9.8 8.1h1.2c5.1 0 8.8 3.4 8.8 8S38.8 33 33.7 33H13Z"
        fill={isRaining ? '#E4EDF0' : '#F7EBC7'}
        stroke={isRaining ? '#AFC6D0' : '#D8BF85'}
        strokeWidth="1.2"
      />
      {status === 'rain_soon' && <path d="M26 37l-1.5 4" stroke="#8DBBD0" strokeWidth="2.3" strokeLinecap="round" />}
      {status === 'light_rain' && <path d="M17 37l-1.5 4m14-4-1.5 4" stroke="#8DBBD0" strokeWidth="2.3" strokeLinecap="round" />}
      {status === 'rain' && <path d="M14 37l-2 5m13-5-2 5m13-5-2 5" stroke="#79B5D2" strokeWidth="2.7" strokeLinecap="round" />}
    </svg>
  );
}

export default function SpaWeatherStatus({
  isContactMenuOpen,
  isGreetingVisible,
}: {
  isContactMenuOpen: boolean;
  isGreetingVisible: boolean;
}) {
  const { currentLang } = useTranslation();
  const [status, setStatus] = useState<WeatherStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try { setDismissed(sessionStorage.getItem(DISMISSED_KEY) === '1'); } catch { /* Storage may be unavailable. */ }

    const controller = new AbortController();
    fetch('/api/weather/spa', { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (!controller.signal.aborted && data && validStatuses.has(data.status)) {
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

  const closeMessage = () => {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISSED_KEY, '1'); } catch { /* Keep the current view usable. */ }
  };
  const showMessage = () => {
    setDismissed(false);
    try { sessionStorage.removeItem(DISMISSED_KEY); } catch { /* Keep the current view usable. */ }
  };

  return (
    <div
      className={`${styles.widget} ${isGreetingVisible && !dismissed ? styles.raised : ''}`}
      data-weather-status={status}
      style={{ zIndex: Z.FLOATING }}
    >
      <button
        type="button"
        className={styles.iconButton}
        onClick={showMessage}
        aria-label={`${copy.showWeather}: ${label}`}
        aria-expanded={!dismissed && !isContactMenuOpen}
        aria-controls={dismissed || isContactMenuOpen ? undefined : 'spa-weather-message'}
      >
        <WeatherIcon status={status} />
      </button>
      {!dismissed && !isContactMenuOpen && (
        <div id="spa-weather-message" className={styles.message} role="status">
          <span className={styles.copy}>
            {label}
            {status === 'rain' && <span className={styles.travelDelay}>{copy.travelDelay}</span>}
          </span>
          <button type="button" className={styles.dismiss} onClick={closeMessage} aria-label={copy.dismiss}>
            <X size={15} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
