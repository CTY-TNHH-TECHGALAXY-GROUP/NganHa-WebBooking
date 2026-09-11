import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateEngagementDelta,
  getAnalyticsConsent,
  trackAnalytics,
} from '../client';
import {
  createVerifiedBookingConversionEvent,
  parseAnalyticsBatch,
  recordVerifiedBookingConversion,
  storeAnalyticsEvents,
} from '../server';
import { ANALYTICS_SCHEMA_VERSION, validateAnalyticsEvent } from '../contract';

const SESSION_ID = '11111111-1111-4111-8111-111111111111';
const EVENT_ID = '22222222-2222-4222-8222-222222222222';
const NOW = Date.parse('2026-09-11T00:00:00.000Z');

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
  assert.doesNotThrow(() => trackAnalytics('page_view', { page_path: '/'}));
});

test('storage requests use database uniqueness constraints for event and conversion retries', async () => {
  const calls: Array<{ rows: unknown; options: unknown }> = [];
  const store = {
    from: () => ({
      insert: async (rows: unknown, options: unknown) => {
        calls.push({ rows, options });
        return { error: null };
      },
    }),
  };
  const parsed = parseAnalyticsBatch({ events: [validEvent({ campaign: { name: 'launch' } })] }, { nowMs: NOW });
  await storeAnalyticsEvents(store, parsed.events);
  await recordVerifiedBookingConversion(store, { conversionKey: 'booking:opaque-store-test', nowMs: NOW });
  assert.equal(calls[0].options && (calls[0].options as { onConflict: string }).onConflict, 'event_id');
  assert.equal(calls[1].options && (calls[1].options as { onConflict: string }).onConflict, 'conversion_key');
  assert.equal((calls[0].rows as Array<{ campaign_name: string }>)[0].campaign_name, 'launch');
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
