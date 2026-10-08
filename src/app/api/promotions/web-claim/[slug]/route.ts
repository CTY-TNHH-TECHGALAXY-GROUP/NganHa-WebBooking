// GET /api/promotions/web-claim/{slug} — current public stock of one campaign
// (load, tab focus and the 60 s fallback poll). data = null → hide the card.
import { NextRequest } from 'next/server';
import { apiResponse } from '@/lib/api/apiResponse';
import { clientIp, getWebClaimStock, isRateLimited, isValidSlug } from '@/lib/voucherWallet.server';

export const dynamic = 'force-dynamic';

// 🔧 CONFIGURATION
const STOCK_LIMIT_PER_MINUTE = 30;

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isValidSlug(slug)) return apiResponse.error('Invalid campaign', 'INVALID_REQUEST', 400);
  if (isRateLimited(`stock:${clientIp(request)}`, STOCK_LIMIT_PER_MINUTE, 60_000)) {
    return apiResponse.error('Too many requests', 'RATE_LIMITED', 429);
  }
  try {
    const res = apiResponse.success(await getWebClaimStock(slug));
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('[web-claim] stock failed:', error);
    return apiResponse.error('Stock unavailable', 'INTERNAL_ERROR', 500);
  }
}
