// ═══════════════════════════════════════
// POST /api/bookings/reprice
// Server-authoritative cart repricing & validation endpoint
// ═══════════════════════════════════════
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const PRIVATE_ROOM_ADDON_ID = 'NHS0900';
const PRIVATE_ROOM_DEFAULT_PRICE_VND = 105000;
const PRIVATE_ROOM_DEFAULT_PRICE_USD = 5;

export interface RepriceItemInput {
  id: string;
  cartId?: string;
  quantity?: number;
  qty?: number;
  priceVND?: number;
  priceUSD?: number;
  options?: any;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items: RepriceItemInput[] = Array.isArray(body?.items) ? body.items : [];

    if (!items.length) {
      return NextResponse.json({
        valid: true,
        items: [],
        totalAmountVND: 0,
        totalAmountUSD: 0,
        hasPriceChanged: false,
        unavailableItems: [],
      });
    }

    const supabase = getSupabaseAdmin();

    // 1. Collect all service IDs
    const serviceIds = Array.from(
      new Set(items.map((i) => i.id).filter(Boolean))
    );

    // Also fetch private room add-on price from DB if available
    const allIdsToFetch = Array.from(new Set([...serviceIds, PRIVATE_ROOM_ADDON_ID]));

    const { data: dbServices, error: dbErr } = await supabase
      .from('Services')
      .select('id, nameVN, nameEN, priceVND, priceUSD, duration, isActive')
      .in('id', allIdsToFetch);

    if (dbErr) {
      console.error('[API /bookings/reprice] Supabase error:', dbErr.message);
      return NextResponse.json(
        { error: 'Failed to fetch services for repricing' },
        { status: 500 }
      );
    }

    const dbServiceMap = new Map<string, any>();
    (dbServices || []).forEach((s) => {
      dbServiceMap.set(s.id, s);
    });

    const privateRoomSvc = dbServiceMap.get(PRIVATE_ROOM_ADDON_ID);
    const privateRoomPriceVND =
      privateRoomSvc?.priceVND && Number(privateRoomSvc.priceVND) > 0
        ? Number(privateRoomSvc.priceVND)
        : PRIVATE_ROOM_DEFAULT_PRICE_VND;
    const privateRoomPriceUSD =
      privateRoomSvc?.priceUSD && Number(privateRoomSvc.priceUSD) > 0
        ? Number(privateRoomSvc.priceUSD)
        : PRIVATE_ROOM_DEFAULT_PRICE_USD;

    let hasPriceChanged = false;
    const unavailableItems: { id: string; cartId?: string; reason: string }[] = [];
    const repricedItems: any[] = [];

    let totalAmountVND = 0;
    let totalAmountUSD = 0;

    for (const item of items) {
      const dbSvc = dbServiceMap.get(item.id);
      const quantity = Math.max(1, Math.min(20, Math.floor(Number(item.quantity || item.qty || 1))));

      if (!dbSvc) {
        unavailableItems.push({
          id: item.id,
          cartId: item.cartId,
          reason: 'SERVICE_NOT_FOUND',
        });
        hasPriceChanged = true;
        continue;
      }

      if (dbSvc.isActive === false) {
        unavailableItems.push({
          id: item.id,
          cartId: item.cartId,
          reason: 'SERVICE_INACTIVE',
        });
        hasPriceChanged = true;
        continue;
      }

      const basePriceVND = Number(dbSvc.priceVND) || 0;
      const basePriceUSD = Number(dbSvc.priceUSD) || 0;

      const hasPrivateRoom = Boolean(item.options?.addons?.privateRoom);
      const canonicalPriceVND = basePriceVND + (hasPrivateRoom ? privateRoomPriceVND : 0);
      const canonicalPriceUSD = basePriceUSD + (hasPrivateRoom ? privateRoomPriceUSD : 0);

      // Check if client price differed
      if (
        item.priceVND !== undefined &&
        Number(item.priceVND) !== canonicalPriceVND
      ) {
        hasPriceChanged = true;
      }

      totalAmountVND += canonicalPriceVND * quantity;
      totalAmountUSD += canonicalPriceUSD * quantity;

      repricedItems.push({
        id: item.id,
        cartId: item.cartId,
        quantity,
        basePriceVND,
        basePriceUSD,
        priceVND: canonicalPriceVND,
        priceUSD: canonicalPriceUSD,
        duration: Number(dbSvc.duration) || 0,
        names: {
          vi: dbSvc.nameVN || '',
          en: dbSvc.nameEN || '',
        },
        hasPrivateRoom,
        options: item.options || {},
      });
    }

    const isValid = unavailableItems.length === 0;

    return NextResponse.json({
      valid: isValid,
      hasPriceChanged,
      unavailableItems,
      totalAmountVND,
      totalAmountUSD,
      items: repricedItems,
    });
  } catch (error: any) {
    console.error('[API /bookings/reprice] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
