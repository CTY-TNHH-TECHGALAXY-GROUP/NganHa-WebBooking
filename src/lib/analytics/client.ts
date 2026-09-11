'use client';

import {
  ANALYTICS_ENGAGEMENT_FLUSH_MS,
  ANALYTICS_EVENT_NAMES,
  ANALYTICS_IDLE_TIMEOUT_MS,
  ANALYTICS_MAX_BODY_BYTES,
  ANALYTICS_MAX_EVENTS_PER_BATCH,
  ANALYTICS_SCHEMA_VERSION,
  ANALYTICS_SESSION_TIMEOUT_MS,
  type AnalyticsCampaign,
  type AnalyticsConsent,
  type AnalyticsDeviceCategory,
  type AnalyticsLanguage,
  type AnalyticsTrafficSource,
  type ClientAnalyticsEventName,
  type AnalyticsEvent,
  isUuid,
  validateAnalyticsEvent,
  normalizePagePath,
} from './contract';

export const ANALYTICS_CONSENT_KEY = 'nganha.analytics.consent';
const SESSION_KEY = 'nganha.analytics.session';
const CONSENT_EVENT = 'nganha:analytics-consent-changed';

type ClientEventFields = {
  language?: AnalyticsLanguage | string;
  device_category?: AnalyticsDeviceCategory;
  identifier?: string;
  duration_ms?: number;
  campaign?: AnalyticsCampaign;
  traffic_source?: AnalyticsTrafficSource;
  page_path?: string;
};

type QueuedEvent = AnalyticsEvent;

let queue: QueuedEvent[] = [];
let flushInFlight = false;
let flushAgain = false;
let flushAgainBeacon = false;
let runtimeStop: (() => void) | null = null;
let memorySessionId: string | null = null;
let memorySessionLastSeen = 0;

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

const randomUuid = () => {
  if (isBrowser() && typeof window.crypto?.randomUUID === 'function') return window.crypto.randomUUID();
  return '00000000-0000-4000-8000-000000000000'.replace(/[0]/g, () => Math.floor(Math.random() * 16).toString(16));
};

const safeStorage = (kind: 'local' | 'session'): Storage | null => {
  if (!isBrowser()) return null;
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
};

export const getAnalyticsConsent = (): AnalyticsConsent => {
  const value = safeStorage('local')?.getItem(ANALYTICS_CONSENT_KEY);
  return value === 'granted' || value === 'denied' ? value : 'unknown';
};

export const setAnalyticsConsent = (consent: AnalyticsConsent) => {
  const storage = safeStorage('local');
  try {
    if (consent === 'unknown') storage?.removeItem(ANALYTICS_CONSENT_KEY);
    else storage?.setItem(ANALYTICS_CONSENT_KEY, consent);
  } catch {
    // Consent remains unknown when browser storage is unavailable.
  }

  if (consent !== 'granted') {
    queue = [];
    stopAnalyticsRuntime();
  } else {
    startAnalyticsRuntime();
  }
  if (isBrowser()) window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }));
};

const getSessionId = () => {
  const now = Date.now();
  const getMemorySession = () => {
    if (!memorySessionId || now - memorySessionLastSeen >= ANALYTICS_SESSION_TIMEOUT_MS) memorySessionId = randomUuid();
    memorySessionLastSeen = now;
    return memorySessionId;
  };
  const storage = safeStorage('session');
  if (!storage) return getMemorySession();

  try {
    const stored = storage.getItem(SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as { id?: string; last_seen?: number };
      if (isUuid(parsed.id) && typeof parsed.last_seen === 'number' && now - parsed.last_seen < ANALYTICS_SESSION_TIMEOUT_MS) {
        storage.setItem(SESSION_KEY, JSON.stringify({ id: parsed.id, last_seen: now }));
        return parsed.id;
      }
    }

    const id = randomUuid();
    storage.setItem(SESSION_KEY, JSON.stringify({ id, last_seen: now }));
    return id;
  } catch {
    return getMemorySession();
  }
};

const getDeviceCategory = (): AnalyticsDeviceCategory => {
  if (!isBrowser()) return 'unknown';
  if (window.matchMedia?.('(max-width: 767px)').matches) return 'mobile';
  if (window.matchMedia?.('(max-width: 1023px)').matches) return 'tablet';
  return 'desktop';
};

const getTrafficSource = (): AnalyticsTrafficSource => {
  if (!isBrowser()) return 'unknown';
  const referrer = document.referrer;
  if (!referrer) return 'direct';
  try {
    const hostname = new URL(referrer).hostname.toLowerCase();
    if (/(google|bing|yahoo|duckduckgo)\./.test(hostname)) return 'organic_search';
    if (/(chatgpt|perplexity|claude|gemini|copilot)\./.test(hostname)) return 'ai_referral';
    if (/(facebook|instagram|tiktok|linkedin|youtube|x)\./.test(hostname)) return 'social';
    return 'referral';
  } catch {
    return 'unknown';
  }
};

const getCampaign = (): AnalyticsCampaign | undefined => {
  if (!isBrowser()) return undefined;
  const params = new URLSearchParams(window.location.search);
  const campaign: AnalyticsCampaign = {};
  const mapping = [
    ['utm_source', 'source'],
    ['utm_medium', 'medium'],
    ['utm_campaign', 'name'],
    ['utm_term', 'term'],
    ['utm_content', 'content'],
  ] as const;
  for (const [queryKey, key] of mapping) {
    const value = params.get(queryKey);
    if (value && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,49}$/.test(value)) campaign[key] = value;
  }
  return Object.keys(campaign).length ? campaign : undefined;
};

const normalizedLanguage = (value?: string): AnalyticsLanguage =>
  ['vi', 'en', 'cn', 'jp', 'kr'].includes(value || '') ? value as AnalyticsLanguage : 'unknown';

const shouldTrackPath = (path: string) => !path.startsWith('/admin');

export const calculateEngagementDelta = (input: {
  visible: boolean;
  elapsedMs: number;
  lastActivityAgoMs: number;
}) => {
  if (!input.visible || input.lastActivityAgoMs > ANALYTICS_IDLE_TIMEOUT_MS) return 0;
  return Math.min(Math.max(0, input.elapsedMs), ANALYTICS_ENGAGEMENT_FLUSH_MS);
};

export const trackAnalytics = (eventName: ClientAnalyticsEventName, fields: ClientEventFields = {}) => {
  if (!isBrowser() || getAnalyticsConsent() !== 'granted') return;
  if (!(ANALYTICS_EVENT_NAMES as readonly string[]).includes(eventName)) return;

  const pagePath = normalizePagePath(fields.page_path || window.location.pathname);
  if (!pagePath || !shouldTrackPath(pagePath)) return;

  const candidate = {
    event_id: randomUuid(),
    schema_version: ANALYTICS_SCHEMA_VERSION,
    event_name: eventName,
    session_id: getSessionId(),
    page_path: pagePath,
    timestamp: new Date().toISOString(),
    language: normalizedLanguage(fields.language),
    device_category: fields.device_category || getDeviceCategory(),
    ...(fields.identifier === undefined ? {} : { identifier: fields.identifier }),
    ...(fields.duration_ms === undefined ? {} : { duration_ms: fields.duration_ms }),
    ...(fields.campaign === undefined ? { campaign: getCampaign() } : { campaign: fields.campaign }),
    ...(fields.traffic_source === undefined ? { traffic_source: getTrafficSource() } : { traffic_source: fields.traffic_source }),
  };

  const validation = validateAnalyticsEvent(candidate);
  if (!validation.ok) return;

  queue.push(validation.event);
  if (queue.length >= ANALYTICS_MAX_EVENTS_PER_BATCH) void flushAnalytics();
};

const sendBatch = async (events: QueuedEvent[], beacon: boolean) => {
  if (!events.length || !isBrowser()) return true;
  const body = JSON.stringify({ events });
  if (new TextEncoder().encode(body).byteLength > ANALYTICS_MAX_BODY_BYTES) return false;

  if (beacon && typeof navigator.sendBeacon === 'function') {
    const sent = navigator.sendBeacon('/api/analytics', new Blob([body], { type: 'application/json' }));
    if (sent) return true;
  }

  try {
    const response = await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: beacon,
      credentials: 'same-origin',
    });
    return response.ok;
  } catch {
    return false;
  }
};

export const flushAnalytics = async (options: { beacon?: boolean } = {}) => {
  if (!queue.length || flushInFlight) {
    if (flushInFlight) {
      flushAgain = true;
      flushAgainBeacon ||= options.beacon === true;
    }
    return;
  }

  flushInFlight = true;
  const events = queue.splice(0, ANALYTICS_MAX_EVENTS_PER_BATCH);
  const sent = await sendBatch(events, options.beacon === true);
  if (!sent && !options.beacon) queue = [...events, ...queue].slice(-ANALYTICS_MAX_EVENTS_PER_BATCH);
  flushInFlight = false;
  if (flushAgain) {
    const nextOptions = { beacon: flushAgainBeacon };
    flushAgain = false;
    flushAgainBeacon = false;
    void flushAnalytics(nextOptions);
  }
};

export const startAnalyticsRuntime = () => {
  if (!isBrowser() || runtimeStop || getAnalyticsConsent() !== 'granted') return;

  let lastMeaningfulActivity = Date.now();
  let lastSample = Date.now();
  let engagementDelta = 0;

  const markMeaningfulActivity = () => {
    lastMeaningfulActivity = Date.now();
  };

  const sampleEngagement = (flush = true) => {
    const now = Date.now();
    const elapsed = Math.max(0, now - lastSample);
    engagementDelta += calculateEngagementDelta({
      visible: document.visibilityState === 'visible',
      elapsedMs: elapsed,
      lastActivityAgoMs: now - lastMeaningfulActivity,
    });
    lastSample = now;
    if (engagementDelta > 0) {
      trackAnalytics('engagement_delta', { duration_ms: Math.min(engagementDelta, ANALYTICS_IDLE_TIMEOUT_MS) });
      engagementDelta = 0;
    }
    if (flush) void flushAnalytics();
  };

  const flushOnPagehide = () => {
    sampleEngagement(false);
    void flushAnalytics({ beacon: true });
  };

  const handleVisibilityChange = () => sampleEngagement();

  const intervalId = window.setInterval(sampleEngagement, ANALYTICS_ENGAGEMENT_FLUSH_MS);
  window.addEventListener('pointerdown', markMeaningfulActivity, { passive: true });
  window.addEventListener('keydown', markMeaningfulActivity, { passive: true });
  window.addEventListener('touchstart', markMeaningfulActivity, { passive: true });
  window.addEventListener('scroll', markMeaningfulActivity, { passive: true });
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', flushOnPagehide);
  runtimeStop = () => {
    window.clearInterval(intervalId);
    window.removeEventListener('pointerdown', markMeaningfulActivity);
    window.removeEventListener('keydown', markMeaningfulActivity);
    window.removeEventListener('touchstart', markMeaningfulActivity);
    window.removeEventListener('scroll', markMeaningfulActivity);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pagehide', flushOnPagehide);
    runtimeStop = null;
  };
};

export const stopAnalyticsRuntime = () => {
  runtimeStop?.();
};

export const analyticsConsentEventName = CONSENT_EVENT;
