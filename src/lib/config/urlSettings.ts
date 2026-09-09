import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@/lib/constants';

export const CTA_KEYS = ['spaceExplore', 'spaceBook', 'tabletContinue'] as const;
export type CtaKey = (typeof CTA_KEYS)[number];
export type CtaLinks = Partial<Record<CtaKey, string>>;

export const DEFAULT_CTA_LINKS: Record<CtaKey, string> = {
  spaceExplore: '/pure-relaxation',
  spaceBook: 'https://oria-spa.vercel.app/vi/new-user/standard/checkout',
  tabletContinue: '/{lang}',
};

const CONTROL_OR_BACKSLASH = /[\u0000-\u001f\u007f\\]/;
const TEMPLATE_PATTERN = /\{([^{}]+)\}/g;

export interface UrlValidationResult {
  isValid: boolean;
  value: string;
  error?: string;
}

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Validate admin-entered navigation URLs without fetching arbitrary targets. */
export function validateConfigUrl(value: unknown): UrlValidationResult {
  if (typeof value !== 'string') {
    return { isValid: false, value: '', error: 'URL must be a string' };
  }

  const trimmed = value.trim();
  if (!trimmed) return { isValid: true, value: '' };
  if (trimmed.length > 2048) return { isValid: false, value: trimmed, error: 'URL is too long' };
  if (CONTROL_OR_BACKSLASH.test(trimmed)) {
    return { isValid: false, value: trimmed, error: 'URL contains prohibited characters' };
  }

  const templateMatches = [...trimmed.matchAll(TEMPLATE_PATTERN)];
  if (templateMatches.some((match) => match[1] !== 'lang')) {
    return { isValid: false, value: trimmed, error: 'Only the {lang} template is allowed' };
  }

  const withoutTemplate = trimmed.replaceAll('{lang}', 'en');
  if (withoutTemplate.includes('{') || withoutTemplate.includes('}')) {
    return { isValid: false, value: trimmed, error: 'Malformed URL template' };
  }

  if (withoutTemplate.startsWith('//') || !withoutTemplate) {
    return { isValid: false, value: trimmed, error: 'Protocol-relative URLs are not allowed' };
  }

  if (withoutTemplate.startsWith('/')) {
    try {
      new URL(withoutTemplate, 'https://oria.local');
      return { isValid: true, value: trimmed };
    } catch {
      return { isValid: false, value: trimmed, error: 'Malformed relative URL' };
    }
  }

  if (withoutTemplate.startsWith('tel:')) {
    const phonePart = withoutTemplate.slice(4).trim();
    if (/^\+?[0-9\s.-]{4,20}$/.test(phonePart)) {
      return { isValid: true, value: trimmed };
    }
    return { isValid: false, value: trimmed, error: 'Malformed tel: URL' };
  }

  if (withoutTemplate.startsWith('mailto:')) {
    const emailPart = withoutTemplate.slice(7).trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailPart)) {
      return { isValid: true, value: trimmed };
    }
    return { isValid: false, value: trimmed, error: 'Malformed mailto: URL' };
  }

  try {
    const parsed = new URL(withoutTemplate);
    if (parsed.protocol !== 'https:') {
      return { isValid: false, value: trimmed, error: 'Only HTTPS external URLs are allowed' };
    }
    return { isValid: true, value: trimmed };
  } catch {
    return { isValid: false, value: trimmed, error: 'Malformed URL' };
  }
}

export function isValidConfigUrl(value: unknown): value is string {
  return validateConfigUrl(value).isValid;
}

export function resolveConfigUrl(
  value: unknown,
  locale: string = DEFAULT_LOCALE,
  fallback: string,
): string {
  const safeLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  const candidate = validateConfigUrl(value);
  const selected = candidate.isValid && candidate.value ? candidate.value : fallback;
  return selected.replaceAll('{lang}', safeLocale);
}

export function resolveCtaUrl(value: unknown, key: CtaKey, locale?: string): string {
  return resolveConfigUrl(value, locale, DEFAULT_CTA_LINKS[key]);
}

export function sanitizeCtaLinks(value: unknown): CtaLinks {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  const result: CtaLinks = {};
  for (const key of CTA_KEYS) {
    const candidate = (value as Record<string, unknown>)[key];
    const validation = validateConfigUrl(candidate);
    if (validation.isValid && validation.value) result[key] = validation.value;
  }
  return result;
}

export function isValidReceptionEmail(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const email = value.trim();
  return email.length <= 254 && !/[\s\u0000-\u001f\u007f]/.test(email) && /^[^@]+@[^@]+\.[^@]+$/.test(email);
}

export function normalizeReceptionEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim();
  return isValidReceptionEmail(email) ? email : null;
}

export function buildHotlineUrl(phone: unknown, fallback = '+84964090277'): string {
  const raw = typeof phone === 'string' ? phone : '';
  const digits = raw.replace(/\D/g, '');
  return `tel:+${digits || fallback.replace(/\D/g, '')}`;
}
