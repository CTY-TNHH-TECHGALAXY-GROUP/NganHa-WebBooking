// ═══════════════════════════════════════
// API Route: GET /api/services
// Fetch from Supabase → Transform to Service[] (same format as wrb-noi-bo-dev)
// ═══════════════════════════════════════

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import type { Service } from '@/components/Menu/types';

export const dynamic = 'force-dynamic';

/** Determine menuType from service ID prefix */
const getMenuTypeFromId = (id: string): 'standard' | 'vip' => {
  if (id.startsWith('NHS')) return 'standard';
  if (id.startsWith('NHP')) return 'vip';
  return 'standard';
};

export const GET = async () => {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('[API /services] Missing Supabase env vars, returning empty service list for fallback UI.');
      return NextResponse.json([]);
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('Services')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('[API /services] Supabase error:', error.message);
      return NextResponse.json([], { status: 500 });
    }

    // Transform to Service[] format (matching wrb-noi-bo-dev)
    const services: Service[] = (data || []).map((item: any) => ({
      id: item.id,
      cat: item.category || 'Unknown',
      names: {
        en: item.nameEN || '',
        vi: item.nameVN || '',
        cn: item.nameCN,
        jp: item.nameJP,
        kr: item.nameKR,
      },
      descriptions: {
        en: item.description?.en || item.description?.EN || '',
        vi: item.description?.vn || item.description?.VN || '',
        cn: item.description?.cn || item.description?.CN,
        jp: item.description?.jp || item.description?.JP,
        kr: item.description?.kr || item.description?.KR,
      },
      img: item.imageUrl || 'https://placehold.co/300x200?text=No+Image',
      priceVND: Number(item.priceVND) || 0,
      priceUSD: Number(item.priceUSD) || 0,
      timeValue: Number(item.duration) || 0,
      timeDisplay: `${item.duration || 0} mins`,
      menuType: getMenuTypeFromId(item.id),
      TAGS: item.tags || [],
      FOCUS_POSITION: item.focusConfig,
      SHOW_STRENGTH: item.showPreferences !== false,
      HINT: item.HINT,
      SHOW_CUSTOM_FOR_YOU: item.showCustomForYou !== false,
      SHOW_NOTES: item.showNotes !== false,
      SHOW_PREFERENCES: item.showPreferences !== false,
      ACTIVE: item.isActive,
      BEST_SELLER: item.isBestSeller,
      BEST_CHOICE: item.isBestChoice,
      media_url: item.media_url,
      media_type: item.media_type,
    }));

    // Return Service[] directly (same as wrb-noi-bo-dev)
    return NextResponse.json(services);
  } catch (err) {
    console.error('[API /services] Unexpected error:', err);
    return NextResponse.json([], { status: 500 });
  }
};
