import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { cookies } from 'next/headers';

export const PUT = withAuth(async (req, ctx, params) => {
  const body = await req.json();
  const { id } = await params;

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return apiResponse.error('Thiếu cấu hình SUPABASE_SERVICE_ROLE_KEY', 'CONFIG_ERROR', 500);
  }

  const { data, error } = await supabaseAdmin
    .from('Services')
    .update({ 
      media_url: body.media_url,
      media_type: body.media_type
    })
    .eq('id', id)
    .select();

  if (error) {
    return apiResponse.error(error.message, 'DB_ERROR', 500);
  }

  if (!data || data.length === 0) {
    return apiResponse.error('Không tìm thấy dịch vụ hoặc không có quyền cập nhật (RLS).', 'NOT_FOUND', 404);
  }

  return apiResponse.success(data[0]);
});
