// POST /api/promotions/web-claim/{slug}/reserve — "Lưu voucher".
// Layers: same-origin → BotID → per-IP window here → DB limits (1 hold per device, 3 per IP)
// → promo_web_reserve (row lock, never oversells). Business errors keep the RPC code.
import { NextRequest, NextResponse } from 'next/server';
import { checkBotId } from 'botid/server';
import { apiResponse } from '@/lib/api/apiResponse';
import {
  clientIp,
  isRateLimited,
  isValidDeviceId,
  isValidSlug,
  reserveWebVoucher,
} from '@/lib/voucherWallet.server';

export const dynamic = 'force-dynamic';

// 🔧 CONFIGURATION
const RESERVE_LIMIT_PER_MINUTE = 5;
const MAX_BODY_BYTES = 512;

const isSameOrigin = (request: NextRequest) => {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get('host');
  } catch {
    return false;
  }
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isValidSlug(slug) || !isSameOrigin(request)) return apiResponse.error('Invalid request', 'INVALID_REQUEST', 400);

  // BotID Basic only works on a Vercel deployment; elsewhere (local `next start`) it runs in
  // development mode (= human). A BotID outage fails open: the DB limits still hold.
  try {
    const verification = await checkBotId({
      developmentOptions: { isDevelopment: !process.env.VERCEL },
      advancedOptions: { checkLevel: 'basic' },
    });
    if (verification.isBot) return apiResponse.error('Request blocked', 'BOT_DETECTED', 403);
  } catch (error) {
    console.error('[web-claim] BotID check failed, continuing:', error);
  }

  const ip = clientIp(request);
  if (isRateLimited(`reserve:${ip}`, RESERVE_LIMIT_PER_MINUTE, 60_000)) {
    return apiResponse.error('Too many requests', 'RATE_LIMITED', 429);
  }

  let deviceId: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) throw new Error('body too large');
    deviceId = (JSON.parse(raw) as { deviceId?: unknown }).deviceId;
  } catch {
    return apiResponse.error('Invalid request', 'INVALID_REQUEST', 400);
  }
  if (!isValidDeviceId(deviceId)) return apiResponse.error('Invalid request', 'INVALID_REQUEST', 400);

  try {
    const result = await reserveWebVoucher(slug, deviceId, ip);
    const status = result.success ? 200 : result.error.code === 'RATE_LIMITED' ? 429 : 409;
    return NextResponse.json(result, { status, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[web-claim] reserve failed:', error);
    return apiResponse.error('Reserve failed', 'INTERNAL_ERROR', 500);
  }
}
