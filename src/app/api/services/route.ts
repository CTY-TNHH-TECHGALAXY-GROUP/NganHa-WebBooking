// ═══════════════════════════════════════
// API Route: GET /api/services
// Fetch from Supabase → Transform to Service[] (same format as wrb-noi-bo-dev)
// ═══════════════════════════════════════

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import type { Service } from '@/components/Menu/types';

// export const revalidate = 60; // Cache for 60 seconds to save Egress
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
      
      console.warn('[API /services] Missing Supabase env vars, returning mock service list for local dev.');
      return NextResponse.json([
        {
          id: 'NHS001',
          cat: 'Body Massage',
          names: { en: 'Aroma coconut oil', vi: 'Aroma coconut oil', cn: 'Aroma coconut oil', jp: 'Aroma coconut oil', kr: 'Aroma coconut oil' },
          descriptions: { en: 'Full-body care with coconut oil', vi: 'Full-body care with coconut oil' },
          img: '/images/services/aroma-oil.png',
          priceVND: 580000,
          priceUSD: 24,
          timeValue: 60,
          timeDisplay: '60 mins',
          menuType: 'standard',
          TAGS: ['body', 'oil'],
          ACTIVE: true,
          BEST_SELLER: true
        },
        {
          id: 'NHS002',
          cat: 'Body Massage',
          names: { en: 'Aroma coconut oil 90 mins', vi: 'Aroma coconut oil 90 mins' },
          descriptions: { en: 'Full-body care with coconut oil' },
          priceVND: 790000,
          priceUSD: 33,
          timeValue: 90,
          timeDisplay: '90 mins',
          menuType: 'standard',
          ACTIVE: true
        },
        {
          id: 'NHS003',
          cat: 'Foot Massage',
          names: { en: 'Foot & Leg Massage', vi: 'Massage chân' },
          descriptions: { en: 'Relaxing foot massage' },
          priceVND: 350000,
          priceUSD: 15,
          timeValue: 45,
          timeDisplay: '45 mins',
          menuType: 'standard',
          ACTIVE: true
        },
        {
          id: 'NHS004',
          cat: 'Ear Clean',
          names: { en: 'Ear Cleaning & Head Massage', vi: 'Lấy ráy tai' },
          descriptions: { en: 'Traditional ear cleaning' },
          priceVND: 250000,
          priceUSD: 10,
          timeValue: 30,
          timeDisplay: '30 mins',
          menuType: 'standard',
          ACTIVE: true
        }
      ]);

    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('Services')
      .select('id, category, nameEN, nameVN, nameCN, nameJP, nameKR, description, imageUrl, priceVND, priceUSD, duration, tags, focusConfig, showPreferences, showCustomForYou, showNotes, isActive, isBestSeller, isBestChoice, media_url, media_type')
      .eq('isActive', true)
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
      HINT: item.hint || '',
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
