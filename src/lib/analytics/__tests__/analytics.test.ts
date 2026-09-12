import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';
import {
  calculateEngagementDelta,
  flushAnalytics,
  getAnalyticsConsent,
  setAnalyticsConsent,
  trackAnalytics,
} from '../client';
import {
  createVerifiedBookingConversionEvent,
  parseAnalyticsBatch,
  recordVerifiedBookingConversion,
  storeAnalyticsEvents,
} from '../server';
import { getAnalyticsDashboard } from '../dashboard';
import { ANALYTICS_SCHEMA_VERSION, isAnalyticsConsent, validateAnalyticsEvent } from '../contract';

const SESSION_ID = '11111111-1111-4111-8111-111111111111';
const EVENT_ID = '22222222-2222-4222-8222-222222222222';
const EVENT_ID_2 = '33333333-3333-4333-8333-333333333333';
const EVENT_ID_3 = '44444444-4444-4444-8444-444444444444';
const NOW = Date.parse('2026-09-11T00:00:00.000Z');
const QUERY_PAGE_SIZE = 1000;

const validEvent = (overrides: Record<string, unknown> = {}) => ({
  event_id: EVENT_ID,
  schema_version: ANALYTICS_SCHEMA_VERSION,
  event_name: 'page_view',
  session_id: SESSION_ID,
  page_path: '/en/new-user/select-menu?utm_campaign=launch',
  timestamp: new Date(NOW).toISOString(),
  language: 'en',
  device_category: 'desktop',
  ...overrides,
});

const rawDashboardRow = (
  eventId: string,
  sessionId: string,
  eventName: string,
  pagePath: string,
  timestamp: string,
  isTest = false,
) => ({
  event_id: eventId,
  session_id: sessionId,
  event_name: eventName,
  page_path: pagePath,
  occurred_at: timestamp,
  received_at: timestamp,
  language: 'en',
  device_category: 'desktop',
  duration_ms: eventName === 'engagement_delta' ? 15000 : undefined,
  campaign_name: '',
  is_test: isTest,
  is_admin: false,
  is_bot: false,
});

const dashboardStore = (rawRows: unknown[], dailyRows: unknown[] = [], calls: Array<{ table: string; from: number; to: number }> = []) => ({
  from: (table: string) => {
    const state = { from: 0, to: QUERY_PAGE_SIZE - 1, equals: [] as Array<[string, string | boolean]> };
    const source = table === 'WebbookingAnalyticsEvents' ? rawRows : dailyRows;
    const builder: any = {
      select: () => builder,
      gte: () => builder,
      lte: () => builder,
      eq: (column: string, value: string | boolean) => {
        state.equals.push([column, value]);
        return builder;
      },
      order: () => builder,
      range: (from: number, to: number) => {
        state.from = from;
        state.to = to;
        calls.push({ table, from, to });
        return builder;
      },
      then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
        try {
          const filtered = source.filter((row: any) => state.equals.every(([column, value]) => row[column] === value));
          return Promise.resolve({ data: filtered.slice(state.from, state.to + 1), error: null }).then(resolve, reject);
        } catch (error) {
          return Promise.reject(error).then(resolve, reject);
        }
      },
    };
    return builder;
  },
});

test('rejects PII, raw URLs, and malformed event fields', () => {
  const piiField = validateAnalyticsEvent(validEvent({ email: 'customer@example.com' }), { nowMs: NOW });
  assert.equal(piiField.ok, false);

  const piiIdentifier = validateAnalyticsEvent(validEvent({ identifier: 'customer@example.com' }), { nowMs: NOW });
  assert.equal(piiIdentifier.ok, false);

  const phoneIdentifier = validateAnalyticsEvent(validEvent({ identifier: '090-123-4567' }), { nowMs: NOW });
  assert.equal(phoneIdentifier.ok, false);

  const piiPath = validateAnalyticsEvent(validEvent({ page_path: '/checkout/customer%40example.com' }), { nowMs: NOW });
  assert.equal(piiPath.ok, false);

  const rawUrl = validateAnalyticsEvent(validEvent({ page_path: 'https://example.com/checkout' }), { nowMs: NOW });
  assert.equal(rawUrl.ok, false);

  const malformed = validateAnalyticsEvent(validEvent({ duration_ms: 60001 }), { nowMs: NOW });
  assert.equal(malformed.ok, false);
});

test('normalizes approved page paths and rejects duplicate event IDs', () => {
  const result = parseAnalyticsBatch({ events: [validEvent(), validEvent({ event_name: 'cart_open' })] }, { nowMs: NOW });
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].page_path, '/en/new-user/select-menu');
  assert.equal(result.rejected.length, 1);
  assert.match(result.rejected[0].reason, /duplicate/);
});

test('public ingest rejects client conversion events and marks TEST/bot traffic', () => {
  const conversion = parseAnalyticsBatch({ events: [validEvent({ event_name: 'booking_received' })] }, { nowMs: NOW });
  assert.equal(conversion.events.length, 0);
  assert.match(conversion.rejected[0].reason, /server-only|conversion helper/);

  const testTraffic = parseAnalyticsBatch({ events: [validEvent({ campaign: { name: 'TEST-journey' } })] }, { nowMs: NOW, userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)' });
  assert.equal(testTraffic.events[0].is_test, true);
  assert.equal(testTraffic.events[0].is_bot, true);
});

test('engagement excludes hidden and idle time', () => {
  assert.equal(calculateEngagementDelta({ visible: true, elapsedMs: 15000, lastActivityAgoMs: 1000 }), 15000);
  assert.equal(calculateEngagementDelta({ visible: false, elapsedMs: 15000, lastActivityAgoMs: 1000 }), 0);
  assert.equal(calculateEngagementDelta({ visible: true, elapsedMs: 15000, lastActivityAgoMs: 60001 }), 0);
});

test('consent defaults to unknown and denied collection is a no-op', () => {
  assert.equal(getAnalyticsConsent(), 'unknown');
  assert.equal(isAnalyticsConsent('granted'), true);
  assert.equal(isAnalyticsConsent('denied'), true);
  assert.equal(isAnalyticsConsent('unexpected'), false);
  assert.doesNotThrow(() => trackAnalytics('page_view', { page_path: '/'}));
});

test('client collection is gated before consent and after revocation', async () => {
  const makeStorage = () => {
    const values = new Map<string, string>();
    return {
      getItem: (key: string) => values.get(key) || null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };
  };
  const previousWindow = (globalThis as any).window;
  const previousDocument = (globalThis as any).document;
  const previousFetch = (globalThis as any).fetch;
  const sentBodies: unknown[] = [];
  const windowStub = {
    localStorage: makeStorage(),
    sessionStorage: makeStorage(),
    crypto: { randomUUID: () => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
    location: { pathname: '/en' },
    matchMedia: () => ({ matches: false }),
    setInterval: () => 1,
    clearInterval: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => true,
  };
  (globalThis as any).window = windowStub;
  (globalThis as any).document = {
    referrer: '',
    visibilityState: 'visible',
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };
  (globalThis as any).fetch = async (_input: unknown, init?: { body?: BodyInit | null; headers?: HeadersInit }) => {
    assert.equal(new Headers(init?.headers).get('x-analytics-consent'), 'granted');
    sentBodies.push(JSON.parse(String(init?.body || '{}')));
    return new Response('', { status: 200 });
  };

  try {
    trackAnalytics('page_view', { page_path: '/en' });
    await flushAnalytics();
    assert.equal(sentBodies.length, 0);

    setAnalyticsConsent('granted');
    trackAnalytics('page_view', { page_path: '/en' });
    await flushAnalytics();
    assert.equal(sentBodies.length, 1);

    setAnalyticsConsent('denied');
    trackAnalytics('page_view', { page_path: '/en' });
    await flushAnalytics();
    assert.equal(sentBodies.length, 1);
  } finally {
    if (previousWindow === undefined) delete (globalThis as any).window;
    else (globalThis as any).window = previousWindow;
    if (previousDocument === undefined) delete (globalThis as any).document;
    else (globalThis as any).document = previousDocument;
    if (previousFetch === undefined) delete (globalThis as any).fetch;
    else (globalThis as any).fetch = previousFetch;
  }
});

test('actual Supabase SDK upsert requests preserve duplicate and mixed-batch behavior', async () => {
  const requests: Array<{ url: URL; method: string; prefer: string; body: unknown }> = [];
  const rowsByEventId = new Map<string, Record<string, unknown>>();
  const rowsByConversionKey = new Map<string, Record<string, unknown>>();
  const interceptedFetch: typeof fetch = async (input, init) => {
    const requestUrl = new URL(typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url);
    const headers = new Headers(init?.headers);
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    const conflict = requestUrl.searchParams.get('on_conflict');
    const prefer = headers.get('prefer') || '';
    assert.equal(requestUrl.pathname, '/rest/v1/WebbookingAnalyticsEvents');
    assert.equal(init?.method, 'POST');
    assert.match(prefer, /resolution=ignore-duplicates/);
    assert.ok(conflict === 'event_id' || conflict === 'conversion_key');
    requests.push({ url: requestUrl, method: init?.method || '', prefer, body });

    const rows = (Array.isArray(body) ? body : [body]) as Array<Record<string, unknown>>;
    const target = conflict === 'event_id' ? rowsByEventId : rowsByConversionKey;
    for (const row of rows) {
      const key: unknown = row[conflict as 'event_id' | 'conversion_key'];
      assert.equal(typeof key, 'string');
      if (!target.has(key as string)) target.set(key as string, row);
    }
    return new Response('', { status: 201 });
  };
  const store = createClient('https://supabase.test', 'test-service-role-key', {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    global: { fetch: interceptedFetch },
  });

  const firstBatch = parseAnalyticsBatch({
    events: [
      validEvent({ campaign: { name: 'launch' } }),
      validEvent({ event_id: EVENT_ID_2, event_name: 'cart_open' }),
    ],
  }, { nowMs: NOW });
  const mixedRetryBatch = parseAnalyticsBatch({
    events: [
      validEvent({ event_id: EVENT_ID_2, event_name: 'cart_open' }),
      validEvent({ event_id: EVENT_ID_3, event_name: 'cart_open' }),
    ],
  }, { nowMs: NOW });
  await storeAnalyticsEvents(store, firstBatch.events);
  await storeAnalyticsEvents(store, mixedRetryBatch.events);

  assert.equal(requests[0].method, 'POST');
  assert.equal(requests[0].url.searchParams.get('on_conflict'), 'event_id');
  assert.equal(rowsByEventId.size, 3, 'one duplicate plus one new row leaves three unique events');
  assert.equal((requests[0].body as Array<{ campaign_name: string }>)[0].campaign_name, 'launch');

  await recordVerifiedBookingConversion(store, { conversionKey: 'booking:opaque-store-test', nowMs: NOW });
  await recordVerifiedBookingConversion(store, { conversionKey: 'booking:opaque-store-test', nowMs: NOW + 1000 });
  const conversionRequests = requests.filter((request) => request.url.searchParams.get('on_conflict') === 'conversion_key');
  assert.equal(conversionRequests.length, 2);
  assert.equal(rowsByConversionKey.size, 1, 'a conversion retry is ignored by the conversion key');
  assert.match(conversionRequests[0].prefer, /resolution=ignore-duplicates/);
});

test('verified conversion event is server-only and deterministic for retries', () => {
  const first = createVerifiedBookingConversionEvent({ conversionKey: 'booking:opaque-123', sessionId: SESSION_ID, pagePath: '/en/new-user/standard/checkout', nowMs: NOW });
  const retry = createVerifiedBookingConversionEvent({ conversionKey: 'booking:opaque-123', sessionId: SESSION_ID, pagePath: '/en/new-user/standard/checkout', nowMs: NOW + 1000 });
  assert.equal(first.event_name, 'booking_received');
  assert.equal(first.source, 'server');
  assert.equal(first.conversion_key, 'booking:opaque-123');
  assert.equal(first.event_id, retry.event_id);
  assert.throws(() => createVerifiedBookingConversionEvent({ conversionKey: 'raw customer email@example.com' }));
});

test('dashboard counts a session once across pages and days and applies an ordered funnel', async () => {
  const sessionOne = '55555555-5555-4555-8555-555555555555';
  const sessionTwo = '66666666-6666-4666-8666-666666666666';
  const rows = [
    rawDashboardRow('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', sessionOne, 'page_view', '/landing', '2026-09-10T09:00:00.000Z'),
    rawDashboardRow('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', sessionOne, 'service_view', '/service', '2026-09-10T09:01:00.000Z'),
    rawDashboardRow('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', sessionOne, 'cart_add', '/service', '2026-09-10T09:02:00.000Z'),
    rawDashboardRow('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', sessionOne, 'checkout_view', '/checkout', '2026-09-11T09:00:00.000Z'),
    rawDashboardRow('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', sessionOne, 'booking_received', '/checkout', '2026-09-11T09:01:00.000Z'),
    rawDashboardRow('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', sessionTwo, 'page_view', '/other', '2026-09-10T10:00:00.000Z'),
    rawDashboardRow('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', sessionTwo, 'cart_add', '/other', '2026-09-10T10:01:00.000Z'),
    rawDashboardRow('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', sessionTwo, 'service_view', '/service', '2026-09-10T10:02:00.000Z'),
    rawDashboardRow('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4', sessionTwo, 'checkout_view', '/checkout', '2026-09-10T10:03:00.000Z'),
  ];
  const dashboard = await getAnalyticsDashboard(dashboardStore(rows) as any, { dateFrom: '2026-09-10', dateTo: '2026-09-11' });

  assert.equal(dashboard.overview.sessions, 2);
  assert.equal(dashboard.metricQuality.sessions, 'exact');
  assert.equal(dashboard.metricQuality.funnel, 'ordered_sessions');
  assert.equal(dashboard.overview.events, rows.length);
  assert.deepEqual(dashboard.funnel.map((step) => step.count), [2, 2, 1, 1, 1]);
  assert.equal(dashboard.topPages.find((page) => page.pagePath === '/landing')?.sessions, 1);

  const entryFiltered = await getAnalyticsDashboard(dashboardStore(rows) as any, {
    dateFrom: '2026-09-10',
    dateTo: '2026-09-11',
    entryPage: '/landing',
  });
  assert.equal(entryFiltered.overview.sessions, 1);
  assert.equal(entryFiltered.overview.events, 5);
  assert.deepEqual(entryFiltered.funnel.map((step) => step.count), [1, 1, 1, 1, 1]);
});

test('includeTest includes normal and TEST traffic instead of selecting TEST only', async () => {
  const productionSession = '77777777-7777-4777-8777-777777777777';
  const testSession = '88888888-8888-4888-8888-888888888888';
  const rows = [
    rawDashboardRow('cccccccc-cccc-4ccc-8ccc-ccccccccccc1', productionSession, 'page_view', '/', '2026-09-11T09:00:00.000Z'),
    rawDashboardRow('dddddddd-dddd-4ddd-8ddd-ddddddddddd1', testSession, 'page_view', '/test', '2026-09-11T09:01:00.000Z', true),
  ];
  const withoutTest = await getAnalyticsDashboard(dashboardStore(rows) as any, { dateFrom: '2026-09-11', dateTo: '2026-09-11' });
  const withTest = await getAnalyticsDashboard(dashboardStore(rows) as any, { dateFrom: '2026-09-11', dateTo: '2026-09-11', includeTest: true });

  assert.equal(withoutTest.overview.sessions, 1);
  assert.equal(withTest.overview.sessions, 2);
  assert.equal(withTest.overview.events, 2);
});

test('dashboard paginates aggregate/raw rows and reports recent activity truncation', async () => {
  const sessionId = '99999999-9999-4999-8999-999999999999';
  const rows = Array.from({ length: 1001 }, (_, index) => rawDashboardRow(
    `eeeeeeee-eeee-4eee-8eee-${String(index + 1).padStart(12, '0')}`,
    sessionId,
    'page_view',
    '/',
    `2026-09-11T09:${String(Math.floor(index / 60) % 60).padStart(2, '0')}:${String(index % 60).padStart(2, '0')}.000Z`,
  ));
  const calls: Array<{ table: string; from: number; to: number }> = [];
  const dashboard = await getAnalyticsDashboard(dashboardStore(rows, [], calls) as any, { dateFrom: '2026-09-11', dateTo: '2026-09-11' });

  assert.equal(dashboard.overview.events, 1001);
  assert.equal(dashboard.recentActivity.length, 250);
  assert.equal(dashboard.truncation.rawEvents, false);
  assert.equal(dashboard.truncation.recentActivity, true);
  assert.ok(calls.some((call) => call.table === 'WebbookingAnalyticsEvents' && call.from === 1000));

  const dailyRows = Array.from({ length: 1001 }, (_, index) => ({
    bucket_date: '2026-09-11', event_name: 'page_view', page_path: '/', language: 'en', device_category: 'desktop',
    event_count: 1, session_count: 1, engaged_ms: 0, campaign_name: '',
    index,
  }));
  const dailyCalls: Array<{ table: string; from: number; to: number }> = [];
  const aggregateDashboard = await getAnalyticsDashboard(dashboardStore([], dailyRows, dailyCalls) as any, { dateFrom: '2026-09-11', dateTo: '2026-09-11' });
  assert.equal(aggregateDashboard.overview.events, 1001);
  assert.equal(aggregateDashboard.truncation.aggregate, false);
  assert.equal(aggregateDashboard.metricQuality.sessions, 'bucket_total');
  assert.equal(aggregateDashboard.metricQuality.funnel, 'event_counts');
  assert.match(aggregateDashboard.note, /bucket session totals/);
  assert.ok(dailyCalls.some((call) => call.table === 'WebbookingAnalyticsDaily' && call.from === 1000));

  const historicalEntryDashboard = await getAnalyticsDashboard(dashboardStore(rows) as any, {
    dateFrom: '2020-01-01',
    dateTo: '2020-01-02',
    entryPage: '/',
  });
  assert.equal(historicalEntryDashboard.overview.events, 0);
  assert.equal(historicalEntryDashboard.truncation.rawEvents, true);
  assert.match(historicalEntryDashboard.note, /raw events for the full selected period/);
});
