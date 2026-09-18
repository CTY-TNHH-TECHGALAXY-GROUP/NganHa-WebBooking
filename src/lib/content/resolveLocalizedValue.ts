import type { LocalizedValue, SupportedLocale } from '../../types/content/content.ts';
import { SUPPORTED_LOCALES } from '../../types/content/content.ts';

export interface LocalizedResolution<T> {
  value: T | undefined;
  locale: SupportedLocale | undefined;
}

export function resolveSupportedLocale(locale: string | undefined): SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale) ? locale as SupportedLocale : 'vi';
}

export function resolveLocalizedValue<T>(
  values: LocalizedValue<T> | undefined,
  requestedLocale: string | undefined,
): LocalizedResolution<T> {
  if (!values) return { value: undefined, locale: undefined };

  const locale = resolveSupportedLocale(requestedLocale);
  for (const candidate of [locale, 'en', 'vi'] as const) {
    const value = values[candidate];
    if (value !== undefined && value !== null && (typeof value !== 'string' || value.trim() !== '')) {
      return { value, locale: candidate };
    }
  }

  return { value: undefined, locale: undefined };
}
