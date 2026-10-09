import { normalizeSpaWeather } from './weather-status';
import type { SpaWeather } from './types';

export const WEATHER_CACHE_SECONDS = 10 * 60;
const WEATHER_TIMEOUT_MS = 4_000;

export async function getSpaWeather(): Promise<SpaWeather | null> {
  const key = process.env.WEATHER_API_KEY?.trim();
  const latText = process.env.ORIA_SPA_LAT?.trim();
  const lngText = process.env.ORIA_SPA_LNG?.trim();
  const lat = Number(latText);
  const lng = Number(lngText);

  if (!key || !latText || !lngText || !Number.isFinite(lat) || !Number.isFinite(lng)
    || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    console.error('[Spa Weather] Missing or invalid server configuration');
    return null;
  }

  const url = new URL('https://api.weatherapi.com/v1/forecast.json');
  url.searchParams.set('key', key);
  url.searchParams.set('q', `${lat},${lng}`);
  url.searchParams.set('days', '2');
  url.searchParams.set('aqi', 'no');
  url.searchParams.set('alerts', 'no');

  try {
    const response = await fetch(url, {
      next: { revalidate: WEATHER_CACHE_SECONDS },
      signal: AbortSignal.timeout(WEATHER_TIMEOUT_MS),
    });
    if (!response.ok) {
      console.error(`[Spa Weather] Provider returned HTTP ${response.status}`);
      return null;
    }

    let weather = normalizeSpaWeather(await response.json());
    // Refresh invalid cached data before using weather in the initial HTML.
    if (!weather) {
      const fresh = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(WEATHER_TIMEOUT_MS) });
      if (fresh.ok) weather = normalizeSpaWeather(await fresh.json());
    }
    if (!weather) console.error('[Spa Weather] Provider data is incomplete or stale');
    return weather;
  } catch {
    console.error('[Spa Weather] Provider request failed');
    return null;
  }
}
