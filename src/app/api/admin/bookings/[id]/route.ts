import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const PUT = withAuth(async (req, ctx, params) => {
  const body = await req.json();
  const { id } = await params;

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return apiResponse.error('Thiếu cấu hình SUPABASE_SERVICE_ROLE_KEY', 'CONFIG_ERROR', 500);
  }

  const { data, error } = await supabaseAdmin
    .from('Bookings')
    .update({ status: body.status })
    .eq('id', id)
    .select();

  if (error) {
    return apiResponse.error(error.message, 'DB_ERROR', 500);
  }

  return apiResponse.success(data[0]);
});
