export const ANALYTICS_SCHEMA_VERSION = '1.0';
export const ANALYTICS_MAX_BODY_BYTES = 16 * 1024;
export const ANALYTICS_MAX_EVENTS_PER_BATCH = 20;
export const ANALYTICS_SESSION_TIMEOUT_MS = 30 * 60 * 1000;
export const ANALYTICS_IDLE_TIMEOUT_MS = 60 * 1000;
export const ANALYTICS_ENGAGEMENT_FLUSH_MS = 15 * 1000;
export const ANALYTICS_MAX_EVENT_AGE_MS = 24 * 60 * 60 * 1000;
export const ANALYTICS_MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

export const ANALYTICS_EVENT_NAMES = [
  'page_view',
  'service_view',
  'service_option_select',
  'cart_add',
  'cart_remove',
  'cart_open',
  'checkout_view',
  'booking_submit',
  'booking_received',
  'booking_failed',
  'contact_click',
  'language_change',
  'hero_video_started',
  'hero_video_failed',
  'engagement_delta',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];
export type ClientAnalyticsEventName = Exclude<AnalyticsEventName, 'booking_received'>;
export type AnalyticsConsent = 'unknown' | 'granted' | 'denied';
export type AnalyticsLanguage = 'vi' | 'en' | 'cn' | 'jp' | 'kr' | 'unknown';
export type AnalyticsDeviceCategory = 'mobile' | 'tablet' | 'desktop' | 'unknown';
export type AnalyticsTrafficSource =
  | 'direct'
  | 'organic_search'
  | 'ai_referral'
  | 'social'
  | 'referral'
  | 'unknown';

export type AnalyticsCampaign = {
  source?: string;
  medium?: string;
  name?: string;
  term?: string;
  content?: string;
};

export type AnalyticsEvent = {
  event_id: string;
  schema_version: typeof ANALYTICS_SCHEMA_VERSION;
  event_name: AnalyticsEventName;
  session_id: string;
  page_path: string;
  timestamp: string;
  language: AnalyticsLanguage;
  device_category: AnalyticsDeviceCategory;
  identifier?: string;
  duration_ms?: number;
  campaign?: AnalyticsCampaign;
  traffic_source?: AnalyticsTrafficSource;
};

export type ServerAnalyticsEvent = AnalyticsEvent & {
  received_at: string;
  source: 'client' | 'server';
  conversion_key?: string;
  is_test: boolean;
  is_bot: boolean;
  is_admin: boolean;
};

export type AnalyticsValidationResult =
  | { ok: true; event: AnalyticsEvent }
  | { ok: false; reason: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OPAQUE_IDENTIFIER_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,79}$/;
const CAMPAIGN_VALUE_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,49}$/;
const PAGE_PATH_PATTERN = /^\/[a-zA-Z0-9._~!$&'()*+,;=:@%\/-]{0,199}$/;
const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_PATTERN = /(?:^|[^\d])\+?[0-9](?:[0-9 .()_-]{5,}[0-9])(?:$|[^\d])/;
const LANGUAGES = new Set<AnalyticsLanguage>(['vi', 'en', 'cn', 'jp', 'kr', 'unknown']);
const DEVICES = new Set<AnalyticsDeviceCategory>(['mobile', 'tablet', 'desktop', 'unknown']);
const SOURCES = new Set<AnalyticsTrafficSource>([
  'direct',
  'organic_search',
  'ai_referral',
  'social',
  'referral',
  'unknown',
]);
const CLIENT_EVENT_KEYS = new Set([
  'event_id',
  'schema_version',
  'event_name',
  'session_id',
  'page_path',
  'timestamp',
  'language',
  'device_category',
  'identifier',
  'duration_ms',
  'campaign',
  'traffic_source',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const containsPiiLikeText = (value: string) => {
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    // Keep checking the original bounded value when decoding fails.
  }
  return EMAIL_PATTERN.test(value) || EMAIL_PATTERN.test(decoded) || PHONE_PATTERN.test(value) || PHONE_PATTERN.test(decoded);
};

export const isAnalyticsEventName = (value: unknown): value is AnalyticsEventName =>
  typeof value === 'string' && (ANALYTICS_EVENT_NAMES as readonly string[]).includes(value);

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_PATTERN.test(value);

export const isOpaqueIdentifier = (value: unknown): value is string =>
  typeof value === 'string' && OPAQUE_IDENTIFIER_PATTERN.test(value);

export const normalizePagePath = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  if (!value.startsWith('/')) return null;
  const withoutQuery = value.split(/[?#]/, 1)[0] || '/';
  const normalized = withoutQuery;
  if (normalized.startsWith('//')) return null;
  if (containsPiiLikeText(normalized)) return null;
  if (!PAGE_PATH_PATTERN.test(normalized)) return null;
  return normalized || '/';
};

const validateCampaign = (value: unknown): AnalyticsCampaign | undefined => {
  if (value === undefined) return undefined;
  if (!isRecord(value)) return undefined;

  const result: AnalyticsCampaign = {};
  for (const key of ['source', 'medium', 'name', 'term', 'content'] as const) {
    const candidate = value[key];
    if (candidate === undefined) continue;
    if (typeof candidate !== 'string' || !CAMPAIGN_VALUE_PATTERN.test(candidate)) return undefined;
    if (containsPiiLikeText(candidate)) return undefined;
    result[key] = candidate;
  }
  return result;
};

const identifierIsAllowedForEvent = (eventName: AnalyticsEventName, identifier?: string) => {
  if (['service_view', 'service_option_select', 'cart_add', 'cart_remove', 'hero_video_started', 'hero_video_failed'].includes(eventName)) {
    return Boolean(identifier && isOpaqueIdentifier(identifier));
  }
  if (eventName === 'contact_click') {
    return ['hotline', 'whatsapp', 'zalo', 'line', 'wechat', 'kakaotalk', 'location', 'ai_chat'].includes(identifier || '');
  }
  if (eventName === 'booking_failed') {
    return ['validation', 'network', 'server', 'unknown'].includes(identifier || '');
  }
  return identifier === undefined;
};

export const validateAnalyticsEvent = (
  value: unknown,
  options: { nowMs?: number; allowServerConversion?: boolean } = {},
): AnalyticsValidationResult => {
  if (!isRecord(value)) return { ok: false, reason: 'event must be an object' };

  for (const key of Object.keys(value)) {
    if (!CLIENT_EVENT_KEYS.has(key)) return { ok: false, reason: `unknown event field: ${key}` };
  }

  const eventName = value.event_name;
  if (!isAnalyticsEventName(eventName)) return { ok: false, reason: 'event_name is not allowlisted' };
  if (eventName === 'booking_received' && !options.allowServerConversion) {
    return { ok: false, reason: 'booking_received is server-only' };
  }
  if (value.schema_version !== ANALYTICS_SCHEMA_VERSION) return { ok: false, reason: 'unsupported schema_version' };
  if (!isUuid(value.event_id)) return { ok: false, reason: 'event_id must be a UUID' };
  if (!isUuid(value.session_id)) return { ok: false, reason: 'session_id must be a UUID' };

  const pagePath = normalizePagePath(value.page_path);
  if (!pagePath) return { ok: false, reason: 'page_path is invalid' };
  if (typeof value.timestamp !== 'string' || !Number.isFinite(Date.parse(value.timestamp))) {
    return { ok: false, reason: 'timestamp is invalid' };
  }

  const occurredMs = Date.parse(value.timestamp);
  const nowMs = options.nowMs ?? Date.now();
  if (occurredMs < nowMs - ANALYTICS_MAX_EVENT_AGE_MS || occurredMs > nowMs + ANALYTICS_MAX_FUTURE_SKEW_MS) {
    return { ok: false, reason: 'timestamp is outside the accepted time window' };
  }
  if (!LANGUAGES.has(value.language as AnalyticsLanguage)) return { ok: false, reason: 'language is invalid' };
  if (!DEVICES.has(value.device_category as AnalyticsDeviceCategory)) return { ok: false, reason: 'device_category is invalid' };
  if (value.traffic_source !== undefined && !SOURCES.has(value.traffic_source as AnalyticsTrafficSource)) {
    return { ok: false, reason: 'traffic_source is invalid' };
  }

  const campaign = validateCampaign(value.campaign);
  if (value.campaign !== undefined && !campaign) return { ok: false, reason: 'campaign is invalid' };
  const identifier = value.identifier;
  if (identifier !== undefined && !isOpaqueIdentifier(identifier)) {
    return { ok: false, reason: 'identifier is invalid' };
  }
  if (typeof identifier === 'string' && containsPiiLikeText(identifier)) {
    return { ok: false, reason: 'identifier must not contain PII-like text' };
  }
  if (!identifierIsAllowedForEvent(eventName, identifier as string | undefined)) {
    return { ok: false, reason: 'identifier is not allowed for this event' };
  }
  const durationMs = value.duration_ms;
  if (durationMs !== undefined && (typeof durationMs !== 'number' || !Number.isInteger(durationMs) || durationMs < 0 || durationMs > ANALYTICS_IDLE_TIMEOUT_MS)) {
    return { ok: false, reason: 'duration_ms is outside the accepted bounds' };
  }

  return {
    ok: true,
    event: {
      event_id: value.event_id,
      schema_version: ANALYTICS_SCHEMA_VERSION,
      event_name: eventName,
      session_id: value.session_id,
      page_path: pagePath,
      timestamp: new Date(occurredMs).toISOString(),
      language: value.language as AnalyticsLanguage,
      device_category: value.device_category as AnalyticsDeviceCategory,
      ...(typeof identifier === 'string' ? { identifier } : {}),
      ...(typeof durationMs === 'number' ? { duration_ms: durationMs } : {}),
      ...(campaign && Object.keys(campaign).length > 0 ? { campaign } : {}),
      ...(value.traffic_source ? { traffic_source: value.traffic_source as AnalyticsTrafficSource } : {}),
    },
  };
};

export const isTestPagePath = (pagePath: string) =>
  pagePath.startsWith('/admin') || pagePath.includes('/test') || pagePath.includes('/qa');

export const isTestCampaign = (campaign?: AnalyticsCampaign) =>
  Object.values(campaign || {}).some((value) => value.toUpperCase().startsWith('TEST'));

export const isBotUserAgent = (userAgent: string | null | undefined) =>
  /bot|crawler|spider|slurp|headless|preview/i.test(userAgent || '');
