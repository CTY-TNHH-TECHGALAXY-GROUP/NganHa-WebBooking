import { NextRequest } from 'next/server';
import { apiResponse } from '@/lib/api/apiResponse';
import {
  ANALYTICS_MAX_BODY_BYTES,
  parseAnalyticsBatch,
  isSameOrigin,
  storeAnalyticsEvents,
} from '@/lib/analytics/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const rateBuckets = new Map<string, { startedAt: number; count: number }>();
const RATE_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;

const getRateKey = (request: NextRequest) => {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'unknown-network';
};

const isRateLimited = (key: string, now: number) => {
  const bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.startedAt >= RATE_WINDOW_MS) {
    rateBuckets.set(key, { startedAt: now, count: 1 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > MAX_REQUESTS_PER_WINDOW;
};

export async function POST(request: NextRequest) {
  if (request.headers.get('x-analytics-consent') !== 'granted') {
    return apiResponse.error('Analytics consent is required', 'CONSENT_REQUIRED', 403);
  }

  const now = Date.now();
  const networkKey = getRateKey(request);
  if (isRateLimited(networkKey, now)) {
    return apiResponse.error('Analytics rate limit exceeded', 'RATE_LIMITED', 429);
  }

  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() || request.headers.get('host');
  if (!isSameOrigin(origin, host)) {
    return apiResponse.error('Analytics origin rejected', 'ORIGIN_REJECTED', 403);
  }

  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > ANALYTICS_MAX_BODY_BYTES) {
    return apiResponse.error('Analytics payload too large', 'PAYLOAD_TOO_LARGE', 413);
  }

  let rawBody = '';
  try {
    rawBody = await request.text();
  } catch {
    return apiResponse.error('Malformed analytics request', 'MALFORMED_BODY', 400);
  }
  if (new TextEncoder().encode(rawBody).byteLength > ANALYTICS_MAX_BODY_BYTES) {
    return apiResponse.error('Analytics payload too large', 'PAYLOAD_TOO_LARGE', 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return apiResponse.error('Malformed analytics JSON', 'MALFORMED_BODY', 400);
  }

  const result = parseAnalyticsBatch(body, {
    nowMs: now,
    userAgent: request.headers.get('user-agent'),
    isTestRequest: request.headers.get('x-analytics-test') === '1',
  });
  if (!result.events.length && result.rejected.length) {
    return apiResponse.error('No valid analytics events', 'INVALID_EVENTS', 400,);
  }
  if (result.events.some((event) => isRateLimited(`${networkKey}:${event.session_id}`, now))) {
    return apiResponse.error('Analytics session rate limit exceeded', 'RATE_LIMITED', 429);
  }

  try {
    const supabase = getSupabaseAdmin();
    await storeAnalyticsEvents(supabase, result.events);
  } catch (error) {
    // Telemetry is intentionally best effort. A storage outage must not affect customer flows.
    console.error('[analytics] storage unavailable:', error instanceof Error ? error.message : error);
    return apiResponse.success({ accepted: 0, rejected: result.rejected.length, durable: false });
  }

  return apiResponse.success({
    accepted: result.events.length,
    rejected: result.rejected.length,
    durable: true,
  });
}
