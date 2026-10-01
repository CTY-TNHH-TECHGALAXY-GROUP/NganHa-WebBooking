'use client';

import { useEffect, useState } from 'react';
import { Cloud, CloudDrizzle, CloudRain, X } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import type { Locale } from '@/lib/constants';
import type { SpaWeatherStatus as WeatherStatus } from '@/lib/weather/types';
import { Z } from '@/lib/zIndex';
import { weatherTexts } from './SpaWeatherStatus.i18n';
import styles from './SpaWeatherStatus.module.css';

const DISMISSED_KEY = 'oria-spa-weather-message-dismissed';
const validStatuses = new Set<WeatherStatus>(['no_rain', 'rain_soon', 'light_rain', 'rain']);

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
  const Icon = status === 'rain' ? CloudRain : status === 'light_rain' ? CloudDrizzle : Cloud;

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
        <Icon size={29} strokeWidth={1.7} aria-hidden="true" />
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
