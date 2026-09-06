import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const LOCALES = new Set(['vi', 'en', 'cn', 'jp', 'kr']);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const itemId = String(body.itemId || '').trim();
    const guestName = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const email = String(body.email || '').trim();
    const note = String(body.detail || '').trim();
    const locale = LOCALES.has(body.locale) ? body.locale : 'vi';

    if (!itemId || !guestName || !note || (!phone && !email)) {
      return NextResponse.json({ error: 'Invalid claim details' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('WebbookingLostFound')
      .update({
        status: 'contacting',
        claimant_name: guestName,
        claimant_phone: phone || null,
        claimant_email: email || null,
        claim_note: note,
        claim_locale: locale,
        claim_status: 'new',
        claim_created_at: now,
        claim_updated_at: now,
      })
      .eq('id', itemId)
      .eq('status', 'available')
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Item is no longer available' }, { status: 409 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[lost-and-found/claims] Failed:', error);
    return NextResponse.json({ error: 'Unable to send claim' }, { status: 500 });
  }
}
