import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('WebBookingContent')
      .select('key, value');

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    // Convert array of {key, value} to an object
    const contentData = data?.reduce((acc: Record<string, any>, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    return NextResponse.json({ success: true, data: contentData });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const payload = await request.json(); // Expected format: Record<string, any> where key is table key, value is jsonb

    // Convert payload to array of {key, value}
    const updates = Object.keys(payload).map(key => ({
      key,
      value: payload[key]
    }));

    if (updates.length === 0) {
      return NextResponse.json({ success: true, message: 'Nothing to update' });
    }

    // Upsert to table
    const { error } = await supabase
      .from('WebBookingContent')
      .upsert(updates, { onConflict: 'key' });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
