import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const GET = withAuth(async (req, ctx) => {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'new'; // 'new' for current bookings, 'history' for past bookings
  const searchPhone = searchParams.get('phone');
  
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return apiResponse.error('Thiếu cấu hình SUPABASE_SERVICE_ROLE_KEY', 'CONFIG_ERROR', 500);
  }

  try {
    let query = supabaseAdmin.from('Bookings').select('*');

    if (searchPhone) {
      query = query.ilike('customerPhone', `%${searchPhone}%`);
    } else {
      if (type === 'new') {
        query = query.in('status', ['PENDING', 'CONFIRMED']);
      } else if (type === 'history') {
        query = query.in('status', ['COMPLETED', 'CANCELLED']);
      }
    }

    // Sort by most recent
    query = query.order('created_at', { ascending: false }).limit(50);

    const { data, error } = await query;

    if (error) {
      return apiResponse.error(error.message, 'DB_ERROR', 500);
    }

    return apiResponse.success(data || []);
  } catch (err: any) {
    return apiResponse.error(err.message, 'UNKNOWN_ERROR', 500);
  }
});
