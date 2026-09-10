/**
 * siteContentSanitizer.ts
 * Sanitizes system settings and site content for public consumption.
 * Ensures internal admin metadata, tokens, passwords, and sensitive configurations are never leaked.
 */

import { sanitizeHomepageStyling, SanitizedHomepageStyling } from './stylingSanitizer';
import { isValidConfigUrl, sanitizeCtaLinks } from './urlSettings';

// Safe public fields allowlist for system_settings
const ALLOWED_SYSTEM_SETTINGS_KEYS = new Set([
  'address',
  'googleMaps',
  'hours',
  'phone',
  'zalo',
  'facebook',
  'instagram',
  'tiktok',
  'whatsapp',
  'line',
  'wechat',
  'wechatQr',
  'kakaotalk',
  'mediaWatermarkEnabled',
  'ctaLinks',
  'lost_and_found',
  'homepage_content',
  'blog_content',
]);

// Patterns that identify internal admin metadata or secrets
const SENSITIVE_KEY_PATTERN = /(?:secret|token|key|password|credential|auth|admin|session|cookie|private|internal|db_|supabase|service_role)/i;

/**
 * Checks whether a URL is a safe http/https URL.
 */
function isSafeUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return true; // Empty string is benign
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    // Relative URLs or basic paths
    return trimmed.startsWith('/') && !trimmed.startsWith('//');
  }
}

export function sanitizePublicAboutStoryContent(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const cleaned = stripInternalMetadata(value) as Record<string, unknown>;
  const specialtySection = cleaned.specialtySection;

  if (specialtySection && typeof specialtySection === 'object' && !Array.isArray(specialtySection)) {
    const section = { ...(specialtySection as Record<string, unknown>) };
    if (section.ctaLink !== undefined && !isValidConfigUrl(section.ctaLink)) {
      delete section.ctaLink;
    }
    cleaned.specialtySection = section;
  }

  return cleaned;
}

/**
 * Sanitizes a string to prevent XSS / script injection.
 */
function sanitizePublicString(val: unknown): string {
  if (typeof val !== 'string') return '';
  // Strip script tags and event handlers
  return val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
}

/**
 * Sanitizes public system settings, returning only allowlisted fields.
 */
export function sanitizePublicSystemSettings(settings: unknown): Record<string, unknown> {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return {};
  }

  const result: Record<string, unknown> = {};
  const record = settings as Record<string, unknown>;

  for (const [key, val] of Object.entries(record)) {
    if (!ALLOWED_SYSTEM_SETTINGS_KEYS.has(key)) {
      continue;
    }
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      continue;
    }

    if (key === 'googleMaps') {
      if (typeof val === 'string' && isSafeUrl(val)) {
        result[key] = val.trim();
      }
      continue;
    }

    if (key === 'address') {
      if (typeof val === 'string') {
        result[key] = sanitizePublicString(val);
      } else if (val && typeof val === 'object' && !Array.isArray(val)) {
        const addrObj: Record<string, string> = {};
        for (const [localeKey, addrVal] of Object.entries(val as Record<string, unknown>)) {
          if (typeof addrVal === 'string') {
            addrObj[localeKey] = sanitizePublicString(addrVal);
          }
        }
        result[key] = addrObj;
      }
      continue;
    }

    if (key === 'mediaWatermarkEnabled') {
      result[key] = Boolean(val);
      continue;
    }

    if (key === 'ctaLinks') {
      result[key] = sanitizeCtaLinks(val);
      continue;
    }

    if (typeof val === 'string') {
      result[key] = sanitizePublicString(val);
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      result[key] = val;
    } else if (val && typeof val === 'object') {
      result[key] = val;
    }
  }

  return result;
}

/**
 * Strips internal metadata properties from general content objects.
 */
export function stripInternalMetadata<T>(data: T): T {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => stripInternalMetadata(item)) as unknown as T;
  }

  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (k.startsWith('_') || SENSITIVE_KEY_PATTERN.test(k)) {
      continue;
    }
    if (v && typeof v === 'object') {
      cleaned[k] = stripInternalMetadata(v);
    } else {
      cleaned[k] = v;
    }
  }

  return cleaned as T;
}

export interface PublicSiteContentPayload {
  system_settings: Record<string, unknown>;
  about_story_content: Record<string, unknown>;
  brand_history: unknown[];
  homepage_content: Record<string, unknown>;
  footer_content: Record<string, unknown>;
  blog_content: Record<string, unknown>;
  homepage_styling: SanitizedHomepageStyling | null;
  local_tour_content?: Record<string, unknown> | null;
  content: Record<string, unknown>;
}

/**
 * Sanitizes all site content data for the public API response.
 */
export function sanitizePublicSiteContent(raw: {
  systemConfigs: Record<string, unknown>;
  webBookingContent: Record<string, unknown>;
}): PublicSiteContentPayload {
  const configs = raw.systemConfigs || {};
  const content = raw.webBookingContent || {};

  return {
    system_settings: sanitizePublicSystemSettings(configs.system_settings),
    about_story_content: sanitizePublicAboutStoryContent(configs.about_story_content),
    brand_history: Array.isArray(configs.brand_history)
      ? stripInternalMetadata(configs.brand_history)
      : [],
    homepage_content: (stripInternalMetadata(configs.homepage_content) || {}) as Record<string, unknown>,
    footer_content: (stripInternalMetadata(configs.footer_content) || {}) as Record<string, unknown>,
    blog_content: (stripInternalMetadata(configs.blog_content) || {}) as Record<string, unknown>,
    homepage_styling: sanitizeHomepageStyling(configs.homepage_styling),
    local_tour_content: (stripInternalMetadata(configs.local_tour_content || content.local_tour_content) || null) as Record<string, unknown> | null,
    content: stripInternalMetadata(content) as Record<string, unknown>,
  };
}
