import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { withCapability } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { recordContentRevisions } from '@/lib/api/contentRevision';
import { authorizeCapability } from '@/lib/auth/adminCapabilities';
import { systemConfigRevision } from '@/lib/config/systemConfigRevision';

export const GET = withCapability(async (_request, { supabase }) => {
  const { data, error } = await supabase
    .from('SystemConfigs')
    .select('key, value')
    .eq('key', 'brand_history')
    .maybeSingle();

  if (error) return apiResponse.error(error.message, 'DB_ERROR', 500);
  return apiResponse.success({
    brand_history: data?.value || null,
    revision: systemConfigRevision(data?.value || null),
  });
}, 'content.read', { scope: 'history' });

export const POST = withCapability(async (request: NextRequest, access) => {
  const { supabase, user } = access;
  const publishAuthorization = await authorizeCapability(access, 'content.publish', { scope: 'history', mutation: true });
  if (!publishAuthorization.allowed) {
    return apiResponse.error(publishAuthorization.error, publishAuthorization.code, publishAuthorization.status);
  }
  const body = await request.json();
  if (!body || !Object.prototype.hasOwnProperty.call(body, 'brand_history')) {
    return apiResponse.error('brand_history là bắt buộc.', 'VALIDATION_ERROR', 400);
  }
  if (!body.brand_history || typeof body.brand_history !== 'object' || Array.isArray(body.brand_history)) {
    return apiResponse.error('brand_history phải là một document object.', 'VALIDATION_ERROR', 400);
  }
  const expectedRevision = typeof body.expectedRevision === 'string' ? body.expectedRevision : null;
  const { data: current, error: readError } = await supabase
    .from('SystemConfigs')
    .select('key, value')
    .eq('key', 'brand_history')
    .maybeSingle();
  if (readError) return apiResponse.error(readError.message, 'DB_ERROR', 500);

  const actualRevision = systemConfigRevision(current?.value || null);
  if (expectedRevision && actualRevision !== expectedRevision) {
    return apiResponse.error('Lịch sử đã được thay đổi ở cửa sổ khác. Bản nháp của bạn vẫn được giữ lại.', 'CONTENT_CONFLICT', 409);
  }

  const { data, error } = await supabase.rpc('webbooking_compare_and_swap_system_config', {
    p_key: 'brand_history',
    p_expected_exists: Boolean(current),
    p_expected_value: current?.value ?? null,
    p_next_value: body.brand_history,
  });

  if (error) {
    return apiResponse.error(error.message, 'DB_ERROR', 500);
  }
  const updated = Array.isArray(data) ? data[0] : data;
  if (!updated || typeof updated !== 'object' || !Object.prototype.hasOwnProperty.call(updated, 'value')) {
    return apiResponse.error('Lịch sử đã được thay đổi ở cửa sổ khác. Bản nháp của bạn vẫn được giữ lại.', 'CONTENT_CONFLICT', 409);
  }

  await recordContentRevisions(supabase, current ? [{
    content_key: 'SystemConfigs:brand_history',
    payload: current.value,
    changed_by: user.id,
  }] : []);

  revalidatePath('/history');
  revalidatePath('/');
  revalidatePath('/[lang]', 'layout');
  return apiResponse.success({ revision: systemConfigRevision(updated.value) });
}, 'content.write', { scope: 'history', mutation: true });
