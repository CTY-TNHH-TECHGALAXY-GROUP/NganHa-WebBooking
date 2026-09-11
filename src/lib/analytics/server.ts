import { createHash } from 'node:crypto';
import {
  ANALYTICS_MAX_BODY_BYTES,
  ANALYTICS_MAX_EVENTS_PER_BATCH,
  ANALYTICS_SCHEMA_VERSION,
  isBotUserAgent,
  isOpaqueIdentifier,
  isTestCampaign,
  isTestPagePath,
  isUuid,
  normalizePagePath,
  validateAnalyticsEvent,
  type AnalyticsEvent,
  type ServerAnalyticsEvent,
} from './contract';

export const ANALYTICS_EVENTS_TABLE = 'WebbookingAnalyticsEvents';
export const ANALYTICS_DAILY_TABLE = 'WebbookingAnalyticsDaily';
export const ANALYTICS_CAPABILITY = 'analytics.read';
export { ANALYTICS_MAX_BODY_BYTES } from './contract';

export type AnalyticsStore = {
  from: (table: string) => unknown;
  rpc?: (functionName: string) => unknown;
};

export type IngestRequestContext = {
  nowMs?: number;
  userAgent?: string | null;
  isTestRequest?: boolean;
  isAdminRequest?: boolean;
};

export type AnalyticsBatchResult = {
  events: ServerAnalyticsEvent[];
  rejected: Array<{ index: number; reason: string }>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const isSameOrigin = (origin: string | null, host: string | null) => {
  if (!origin) return true;
  if (!host) return false;
  try {
    const parsed = new URL(origin);
    return parsed.host === host && (parsed.protocol === 'http:' || parsed.protocol === 'https:');
  } catch {
    return false;
  }
};

export const parseAnalyticsBatch = (
  value: unknown,
  context: IngestRequestContext = {},
): AnalyticsBatchResult => {
  if (!isRecord(value) || !Array.isArray(value.events)) {
    return { events: [], rejected: [{ index: -1, reason: 'body.events must be an array' }] };
  }
  if (value.events.length === 0) {
    return { events: [], rejected: [{ index: -1, reason: 'body.events must not be empty' }] };
  }
  if (value.events.length > ANALYTICS_MAX_EVENTS_PER_BATCH) {
    return { events: [], rejected: [{ index: -1, reason: 'too many events in batch' }] };
  }

  const nowMs = context.nowMs ?? Date.now();
  const events: ServerAnalyticsEvent[] = [];
  const rejected: Array<{ index: number; reason: string }> = [];
  const seenEventIds = new Set<string>();

  value.events.forEach((candidate, index) => {
    const validation = validateAnalyticsEvent(candidate, { nowMs });
    if ('reason' in validation) {
      rejected.push({ index, reason: validation.reason });
      return;
    }

    const event = validation.event;
    if (event.event_name === 'booking_received') {
      rejected.push({ index, reason: 'booking_received must use the server conversion helper' });
      return;
    }
    if (seenEventIds.has(event.event_id)) {
      rejected.push({ index, reason: 'duplicate event_id in batch' });
      return;
    }
    seenEventIds.add(event.event_id);

    const pageIsAdmin = isTestPagePath(event.page_path) || context.isAdminRequest === true;
    const isBot = isBotUserAgent(context.userAgent);
    events.push({
      ...event,
      received_at: new Date(nowMs).toISOString(),
      source: 'client',
      is_test: context.isTestRequest === true || isTestCampaign(event.campaign) || isTestPagePath(event.page_path),
      is_bot: isBot,
      is_admin: pageIsAdmin,
    });
  });

  return { events, rejected };
};

export const createVerifiedBookingConversionEvent = (input: {
  conversionKey: string;
  sessionId?: string;
  pagePath?: string;
  language?: AnalyticsEvent['language'];
  deviceCategory?: AnalyticsEvent['device_category'];
  nowMs?: number;
}): ServerAnalyticsEvent => {
  if (!isOpaqueIdentifier(input.conversionKey) || input.conversionKey.length > 128) {
    throw new Error('conversionKey must be an opaque server-owned identifier');
  }
  if (input.sessionId !== undefined && !isUuid(input.sessionId)) {
    throw new Error('sessionId must be an anonymous UUID');
  }

  const nowMs = input.nowMs ?? Date.now();
  const pagePath = normalizePagePath(input.pagePath || '/unknown') || '/unknown';
  const eventId = createHash('sha256')
    .update(`webbooking:verified-booking:${input.conversionKey}`)
    .digest('hex');

  return {
    event_id: eventId,
    schema_version: ANALYTICS_SCHEMA_VERSION,
    event_name: 'booking_received',
    session_id: input.sessionId || '00000000-0000-4000-8000-000000000000',
    page_path: pagePath,
    timestamp: new Date(nowMs).toISOString(),
    received_at: new Date(nowMs).toISOString(),
    language: input.language || 'unknown',
    device_category: input.deviceCategory || 'unknown',
    identifier: 'verified_booking',
    source: 'server',
    conversion_key: input.conversionKey,
    is_test: false,
    is_bot: false,
    is_admin: false,
  };
};

export const storeAnalyticsEvents = async (
  store: AnalyticsStore,
  events: ServerAnalyticsEvent[],
) => {
  if (!events.length) return { stored: 0 };
  const body = JSON.stringify({ events });
  if (new TextEncoder().encode(body).byteLength > ANALYTICS_MAX_BODY_BYTES) {
    throw new Error('analytics payload exceeds the body cap');
  }

  const rows = events.map((event) => {
    const { timestamp, campaign, ...eventFields } = event;
    return {
      ...eventFields,
      occurred_at: timestamp,
      campaign: campaign || {},
      campaign_name: campaign?.name || '',
    };
  });
  const insertBuilder = store.from(ANALYTICS_EVENTS_TABLE) as {
    insert: (values: unknown, options: { onConflict: string; ignoreDuplicates: boolean }) => PromiseLike<{ error?: unknown | null }>;
  };
  const result = await insertBuilder.insert(rows, { onConflict: 'event_id', ignoreDuplicates: true });
  const error = isRecord(result) ? result.error : null;
  if (isRecord(error)) throw new Error(typeof error.message === 'string' ? error.message : 'analytics storage failed');
  return { stored: events.length };
};

/**
 * Integration point for the booking owner: call this only after the verified
 * booking transaction/commit succeeds. Never call it from the client success
 * screen, before commit, or as part of the current /api/bookings route here.
 */
export const recordVerifiedBookingConversion = async (
  store: AnalyticsStore,
  input: Parameters<typeof createVerifiedBookingConversionEvent>[0],
) => {
  const event = createVerifiedBookingConversionEvent(input);
  const { timestamp, campaign, ...eventFields } = event;
  const insertBuilder = store.from(ANALYTICS_EVENTS_TABLE) as {
    insert: (values: unknown, options: { onConflict: string; ignoreDuplicates: boolean }) => PromiseLike<{ error?: unknown | null }>;
  };
  const result = await insertBuilder.insert({
      ...eventFields,
      occurred_at: timestamp,
      campaign: campaign || {},
      campaign_name: campaign?.name || '',
    }, { onConflict: 'conversion_key', ignoreDuplicates: true });
  const error = isRecord(result) ? result.error : null;
  if (isRecord(error)) throw new Error(typeof error.message === 'string' ? error.message : 'verified booking analytics storage failed');
  return { event_id: event.event_id, conversion_key: event.conversion_key };
};

export const runAnalyticsMaintenance = async (store: AnalyticsStore) => {
  if (!store.rpc) throw new Error('analytics store does not expose rpc');
  const result = await Promise.resolve(store.rpc('webbooking_analytics_maintain'));
  const error = isRecord(result) ? result.error : null;
  if (isRecord(error)) throw new Error(typeof error.message === 'string' ? error.message : 'analytics maintenance failed');
  return { ok: true };
};
