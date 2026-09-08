// ═══════════════════════════════════════
// API Route: GET /api/services
// Fetch from Supabase → Transform to Service[] (same format as wrb-noi-bo-dev)
// ═══════════════════════════════════════

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import type { Service } from '@/components/Menu/types';

// export const revalidate = 60; // Cache for 60 seconds to save Egress
export const dynamic = 'force-dynamic';

const readLocalized = (value: unknown, locale: string, aliases: string[] = []) => {
  if (!value || typeof value !== 'object') return '';
  const record = value as Record<string, unknown>;
  for (const key of [locale, locale.toUpperCase(), ...aliases]) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      return typeof record[key] === 'string' ? record[key] : '';
    }
  }
  return '';
};

/** Determine menuType from service ID prefix */
const getMenuTypeFromId = (id: string): 'standard' | 'vip' => {
  if (id.startsWith('NHS')) return 'standard';
  if (id.startsWith('NHP')) return 'vip';
  return 'standard';
};

export const GET = async () => {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[API /services] Missing Supabase env vars; catalog is unavailable.');
      return NextResponse.json([], { status: 503 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('Services')
      .select('id, category, nameEN, nameVN, nameCN, nameJP, nameKR, description, imageUrl, priceVND, priceUSD, duration, tags, focusConfig, showPreferences, showCustomForYou, showNotes, showGender, showStrength, showFocus, isActive, isBestSeller, isBestChoice, media_url, media_type')
      .eq('isActive', true)
      .order('id', { ascending: true });

    if (error) {
      console.error('[API /services] Supabase error:', error.message);
      return NextResponse.json([], { status: 500 });
    }

    // Transform to Service[] format (matching wrb-noi-bo-dev)
    const services: Service[] = (data || []).map((item: any) => {
      let cat = item.category || 'Unknown';
      let cats: string[] | undefined = undefined;

      if (typeof cat === 'string' && cat.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(cat);
          if (Array.isArray(parsed) && parsed.length > 0) {
            cats = parsed.map(c => String(c));
            cat = cats[0]; // fallback to first item
          }
        } catch (e) {
          // ignore parsing error, keep as string
        }
      } else if (Array.isArray(cat)) {
        cats = cat.map(c => String(c));
        cat = cats[0] || 'Unknown';
      }

      return {
        id: item.id,
        cat,
        cats,
      names: {
        en: item.nameEN || '',
        vi: item.nameVN || '',
        cn: item.nameCN,
        jp: item.nameJP,
        kr: item.nameKR,
      },
      descriptions: {
        en: readLocalized(item.description, 'en'),
        vi: readLocalized(item.description, 'vi', ['vn', 'VN']),
        cn: readLocalized(item.description, 'cn'),
        jp: readLocalized(item.description, 'jp'),
        kr: readLocalized(item.description, 'kr'),
      },
      // Missing media stays empty so the UI can show its intentional loading/empty state.
      img: item.imageUrl || '',
      priceVND: Number(item.priceVND) || 0,
      priceUSD: Number(item.priceUSD) || 0,
      timeValue: Number(item.duration) || 0,
      timeDisplay: `${Number(item.duration) || 0} mins`,
      menuType: getMenuTypeFromId(item.id),
      TAGS: item.tags || [],
      FOCUS_POSITION: item.focusConfig,
      HINT: item.hint || '',
      SHOW_CUSTOM_FOR_YOU: item.showCustomForYou !== false,
      SHOW_NOTES: item.showNotes !== false,
      SHOW_PREFERENCES: item.showPreferences !== false,
      SHOW_GENDER: item.showGender !== false,
      SHOW_STRENGTH: item.showStrength !== false,
      SHOW_FOCUS: item.showFocus !== false,
      ACTIVE: item.isActive,
      BEST_SELLER: item.isBestSeller,
      BEST_CHOICE: item.isBestChoice,
      media_url: item.media_url,
      media_type: item.media_type,
    };
  });

    // Return Service[] directly (same as wrb-noi-bo-dev)
    return NextResponse.json(services);
  } catch (err) {
    console.error('[API /services] Unexpected error:', err);
    return NextResponse.json([], { status: 500 });
  }
};
