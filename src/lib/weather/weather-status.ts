import { MODERATE_OR_HEAVY_PRECIPITATION_CODES, WET_PRECIPITATION_CODES } from './rain-codes';
import type { SpaWeather, SpaWeatherStatus, WeatherHour } from './types';

export const RAIN_SOON_PROBABILITY_THRESHOLD = 60;
export const SIGNIFICANT_RAIN_MM = 1;
export const MAX_OBSERVATION_AGE_SECONDS = 45 * 60;
const FORECAST_WINDOW_SECONDS = 60 * 60;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const validNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export function calculateWeatherStatus(currentPrecipMm: number, currentCode: number, nextHour: WeatherHour): Pick<SpaWeather, 'status' | 'isRaining' | 'rainSoon'> {
  const isRaining = currentPrecipMm > 0 || WET_PRECIPITATION_CODES.has(currentCode);
  const rainSoon = nextHour.chanceOfRain >= RAIN_SOON_PROBABILITY_THRESHOLD
    || nextHour.precipMm > 0
    || WET_PRECIPITATION_CODES.has(nextHour.conditionCode);
  let status: SpaWeatherStatus = rainSoon ? 'rain_soon' : 'no_rain';

  if (isRaining) {
    status = currentPrecipMm >= SIGNIFICANT_RAIN_MM || MODERATE_OR_HEAVY_PRECIPITATION_CODES.has(currentCode)
      ? 'rain'
      : 'light_rain';
  }

  return { status, isRaining, rainSoon };
}

export function normalizeSpaWeather(raw: unknown, nowEpoch = Math.floor(Date.now() / 1000)): SpaWeather | null {
  if (!isRecord(raw) || !isRecord(raw.current)) return null;
  const current = raw.current;
  if (!isRecord(current.condition)) return null;
  const condition = current.condition;
  if (!validNumber(current.temp_c) || !validNumber(current.precip_mm) || current.precip_mm < 0
    || !Number.isInteger(condition.code) || typeof condition.text !== 'string' || !condition.text.trim()
    || !Number.isInteger(current.last_updated_epoch)) return null;

  const updatedEpoch = current.last_updated_epoch as number;
  if (updatedEpoch > nowEpoch + 5 * 60 || nowEpoch - updatedEpoch > MAX_OBSERVATION_AGE_SECONDS) return null;

  if (!isRecord(raw.forecast) || !Array.isArray(raw.forecast.forecastday)) return null;
  const hours = raw.forecast.forecastday.flatMap((day: unknown) =>
    isRecord(day) && Array.isArray(day.hour) ? day.hour : []);
  const next = hours
    .filter((hour: unknown) => isRecord(hour) && Number.isInteger(hour.time_epoch)
      && (hour.time_epoch as number) >= nowEpoch
      && (hour.time_epoch as number) <= nowEpoch + FORECAST_WINDOW_SECONDS)
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
      (a.time_epoch as number) - (b.time_epoch as number))[0];

  if (!isRecord(next) || !validNumber(next.chance_of_rain) || next.chance_of_rain < 0 || next.chance_of_rain > 100
    || !validNumber(next.precip_mm) || next.precip_mm < 0
    || !isRecord(next.condition) || !Number.isInteger(next.condition.code)) return null;

  return {
    ...calculateWeatherStatus(current.precip_mm, condition.code as number, {
      timeEpoch: next.time_epoch as number,
      chanceOfRain: next.chance_of_rain,
      precipMm: next.precip_mm,
      conditionCode: next.condition.code as number,
    }),
    temperatureC: current.temp_c,
    conditionCode: condition.code as number,
    conditionText: condition.text.trim(),
    updatedAt: new Date(updatedEpoch * 1000).toISOString(),
  };
}
