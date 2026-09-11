import { withCapability } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { parseMediaPatch } from '@/lib/admin/mediaPatch';

const updateMedia = withCapability(async (req, _ctx, params) => {
  const body = await req.json().catch(() => null);
  const { id } = await params;

  const parsed = parseMediaPatch(body);
  if (!parsed.ok) return apiResponse.error(parsed.message, parsed.code, 400);

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return apiResponse.error('Thiếu cấu hình SUPABASE_SERVICE_ROLE_KEY', 'CONFIG_ERROR', 500);
  }

  const { data: current, error: readError } = await supabaseAdmin
    .from('Services')
    .select('id, media_url, media_type')
    .eq('id', id)
    .maybeSingle();
  if (readError) return apiResponse.error(readError.message, 'DB_ERROR', 500);
  if (!current) return apiResponse.error('Không tìm thấy dịch vụ.', 'NOT_FOUND', 404);

  if (parsed.value.expectedMediaUrl !== undefined && (current.media_url ?? null) !== parsed.value.expectedMediaUrl) {
    return apiResponse.error('Media đã được thay đổi ở cửa sổ khác. Bản nháp của bạn vẫn được giữ lại.', 'MEDIA_CONFLICT', 409);
  }
  if (parsed.value.expectedMediaType !== undefined && (current.media_type ?? null) !== parsed.value.expectedMediaType) {
    return apiResponse.error('Loại media đã được thay đổi ở cửa sổ khác. Bản nháp của bạn vẫn được giữ lại.', 'MEDIA_CONFLICT', 409);
  }

  let query = supabaseAdmin
    .from('Services')
    .update({ media_url: parsed.value.media_url, media_type: parsed.value.media_type })
    .eq('id', id);
  if (parsed.value.expectedMediaUrl !== undefined) {
    query = parsed.value.expectedMediaUrl === null ? query.is('media_url', null) : query.eq('media_url', parsed.value.expectedMediaUrl);
  }
  if (parsed.value.expectedMediaType !== undefined) {
    query = parsed.value.expectedMediaType === null ? query.is('media_type', null) : query.eq('media_type', parsed.value.expectedMediaType);
  }

  const { data, error } = await query.select('id, media_url, media_type');

  if (error) {
    return apiResponse.error(error.message, 'DB_ERROR', 500);
  }

  if (!data || data.length === 0) {
    return apiResponse.error('Không tìm thấy dịch vụ hoặc không có quyền cập nhật (RLS).', 'NOT_FOUND', 404);
  }

  return apiResponse.success(data[0]);
}, 'services.write', { scope: 'services', mutation: true });

export const PUT = updateMedia;
export const PATCH = updateMedia;
