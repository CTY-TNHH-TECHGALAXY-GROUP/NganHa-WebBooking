import { validateConfigUrl } from '@/lib/config/urlSettings';
import { SUPPORTED_LOCALES, type Locale } from '@/lib/constants';
import type { AeoFaq, AeoLocaleFields, SeoLocaleFields } from './types';

const MAX_TITLE = 160;
const MAX_DESCRIPTION = 500;
const MAX_TEXT = 2000;
const MAX_FAQS = 12;

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, maxLength = MAX_TEXT): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength || /[<>\u0000-\u001f\u007f]/.test(trimmed)) return null;
  return trimmed;
}

function optionalText(value: unknown, field: string, maxLength = MAX_TEXT, errors: string[]): string {
  if (value === undefined || value === null || value === '') return '';
  const parsed = text(value, maxLength);
  if (!parsed) errors.push(`${field} không hợp lệ`);
  return parsed || '';
}

function list(value: unknown, field: string, errors: string[], maxItems = 20): string[] {
  if (value !== undefined && value !== null && !Array.isArray(value) && typeof value !== 'string') {
    errors.push(`${field} không hợp lệ`);
    return [];
  }
  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];
  if (values.length > maxItems) errors.push(`${field} có quá nhiều mục`);
  return values.slice(0, maxItems).map((item) => {
    const parsed = text(item, MAX_TEXT);
    if (!parsed && item !== '') errors.push(`${field} chứa mục không hợp lệ`);
    return parsed || '';
  }).filter(Boolean);
}

function validateInternalPath(value: unknown, field: string, errors: string[]): string {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[?#\\\u0000-\u001f\u007f]/.test(value)) {
    errors.push(`${field} phải là đường dẫn nội bộ`);
    return '';
  }
  return value;
}

function validateImageUrl(value: unknown, errors: string[]): string {
  if (value === undefined || value === null || value === '') return '';
  const result = validateConfigUrl(value);
  if (!result.isValid || (!result.value.startsWith('/') && !result.value.startsWith('https://'))) {
    errors.push('ogImage phải là đường dẫn nội bộ hoặc URL HTTPS');
    return '';
  }
  return result.value;
}

export function validateSeoFields(input: unknown): ValidationResult<SeoLocaleFields> {
  const errors: string[] = [];
  const raw = isRecord(input) ? input : {};
  const title = text(raw.title, MAX_TITLE);
  const description = text(raw.description, MAX_DESCRIPTION);
  if (!title) errors.push('title là bắt buộc và không được chứa markup');
  if (!description) errors.push('description là bắt buộc và không được chứa markup');
  const keywords = list(raw.keywords, 'keywords', errors, 30);
  const ogImage = validateImageUrl(raw.ogImage, errors);
  const ogImageAlt = optionalText(raw.ogImageAlt, 'ogImageAlt', 300, errors);
  const canonicalPath = validateInternalPath(raw.canonicalPath, 'canonicalPath', errors);
  const twitterCard = raw.twitterCard === 'summary' ? 'summary' : 'summary_large_image';
  if (raw.twitterCard !== undefined && raw.twitterCard !== 'summary' && raw.twitterCard !== 'summary_large_image') {
    errors.push('twitterCard không hợp lệ');
  }
  if (typeof raw.indexable !== 'boolean') errors.push('indexable phải là boolean');

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      title: title as string,
      description: description as string,
      keywords,
      ogImage,
      ogImageAlt,
      twitterCard,
      canonicalPath,
      indexable: raw.indexable as boolean,
    },
  };
}

function validateFaqs(value: unknown, errors: string[]): AeoFaq[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > MAX_FAQS) {
    errors.push('faqs không hợp lệ');
    return [];
  }
  return value.map((item) => {
    const raw = isRecord(item) ? item : {};
    const question = text(raw.question, 300);
    const answer = text(raw.answer, 1200);
    if (!question || !answer) errors.push('Mỗi FAQ cần question và answer hợp lệ');
    return { question: question || '', answer: answer || '' };
  }).filter((item) => item.question && item.answer);
}

export function validateAeoFields(input: unknown): ValidationResult<AeoLocaleFields> {
  const errors: string[] = [];
  const raw = isRecord(input) ? input : {};
  const value: AeoLocaleFields = {
    serviceName: optionalText(raw.serviceName, 'serviceName', 160, errors),
    answer: optionalText(raw.answer, 'answer', 2400, errors),
    audience: optionalText(raw.audience, 'audience', MAX_TEXT, errors),
    duration: optionalText(raw.duration, 'duration', 300, errors),
    price: optionalText(raw.price, 'price', 300, errors),
    inclusions: list(raw.inclusions, 'inclusions', errors),
    location: optionalText(raw.location, 'location', 500, errors),
    hours: optionalText(raw.hours, 'hours', 300, errors),
    bookingProcess: optionalText(raw.bookingProcess, 'bookingProcess', 1600, errors),
    faqs: validateFaqs(raw.faqs, errors),
    sourceLabel: optionalText(raw.sourceLabel, 'sourceLabel', 300, errors),
    sourceUrl: '',
  };
  if (raw.sourceUrl !== undefined && raw.sourceUrl !== '') {
    const sourceUrl = validateConfigUrl(raw.sourceUrl);
    if (!sourceUrl.isValid || (!sourceUrl.value.startsWith('/') && !sourceUrl.value.startsWith('https://'))) {
      errors.push('sourceUrl phải là đường dẫn nội bộ hoặc URL HTTPS');
    } else {
      value.sourceUrl = sourceUrl.value;
    }
  }
  if (!value.answer && value.faqs.length === 0) errors.push('AEO cần answer hoặc ít nhất một FAQ để hiển thị công khai');
  if (errors.length) return { ok: false, errors };
  return { ok: true, value };
}

export function isSupportedSeoLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function isValidSeoRouteKey(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 120 && /^[a-z0-9][a-z0-9._/-]*$/.test(value);
}
