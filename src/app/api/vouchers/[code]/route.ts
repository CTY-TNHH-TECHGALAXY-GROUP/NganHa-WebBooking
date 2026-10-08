// GET /api/vouchers/{code} — public status of a web-claim voucher (wallet check, /v/{code}).
// No phone, name or full booking id (promo_web_voucher_status). Rate limited against code guessing (B17).
import { NextRequest, NextResponse } from 'next/server';
import { apiResponse } from '@/lib/api/apiResponse';
import {
  clientIp,
  getWebVoucherStatus,
  isRateLimited,
  isValidVoucherCode,
  normalizeVoucherCode,
} from '@/lib/voucherWallet.server';

export const dynamic = 'force-dynamic';

// 🔧 CONFIGURATION
const STATUS_LIMIT_PER_MINUTE = 30;

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  if (isRateLimited(`voucher:${clientIp(request)}`, STATUS_LIMIT_PER_MINUTE, 60_000)) {
    return apiResponse.error('Too many requests', 'RATE_LIMITED', 429);
  }
  const code = normalizeVoucherCode(decodeURIComponent((await params).code));
  if (!isValidVoucherCode(code)) return apiResponse.error('Voucher not found', 'VOUCHER_NOT_FOUND', 404);
  try {
    const result = await getWebVoucherStatus(code);
    return NextResponse.json(result, { status: result.success ? 200 : 404, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[web-claim] voucher status failed:', error);
    return apiResponse.error('Status unavailable', 'INTERNAL_ERROR', 500);
  }
}
