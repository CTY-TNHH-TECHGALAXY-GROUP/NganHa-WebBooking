// GET /api/promotions/web-claim — web-claim e-voucher campaigns to show as a card.
// Isolated from /api/services and checkout: any failure returns [] and the card stays hidden.
import { apiResponse } from '@/lib/api/apiResponse';
import { listWebClaimCampaigns } from '@/lib/voucherWallet.server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = apiResponse.success(await listWebClaimCampaigns());
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('[web-claim] list failed:', error);
    return apiResponse.success([]);
  }
}
