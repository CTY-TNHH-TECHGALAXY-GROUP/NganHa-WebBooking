import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { recordContentRevisions } from '@/lib/api/contentRevision';
import { createHash } from 'node:crypto';

const revisionToken = (value: unknown) => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');

export const GET = withAuth(async (_request, { supabase }) => {
  const { data, error } = await supabase
    .from('SystemConfigs')
    .select('key, value')
    .eq('key', 'brand_history')
    .maybeSingle();

  if (error) return apiResponse.error(error.message, 'DB_ERROR', 500);
  return apiResponse.success({
    brand_history: data?.value || null,
    revision: revisionToken(data?.value || null),
  });
});

export const POST = withAuth(async (request: NextRequest, { supabase, user }) => {
  const body = await request.json();
  if (!body || !Object.prototype.hasOwnProperty.call(body, 'brand_history')) {
    return apiResponse.error('brand_history là bắt buộc.', 'VALIDATION_ERROR', 400);
  }
  const expectedRevision = typeof body.expectedRevision === 'string' ? body.expectedRevision : null;
  const { data: current, error: readError } = await supabase
    .from('SystemConfigs')
    .select('key, value')
    .eq('key', 'brand_history')
    .maybeSingle();
  if (readError) return apiResponse.error(readError.message, 'DB_ERROR', 500);

  const actualRevision = revisionToken(current?.value || null);
  if (expectedRevision && actualRevision !== expectedRevision) {
    return apiResponse.error('Lịch sử đã được thay đổi ở cửa sổ khác. Bản nháp của bạn vẫn được giữ lại.', 'CONTENT_CONFLICT', 409);
  }

  await recordContentRevisions(supabase, current ? [{
    content_key: 'SystemConfigs:brand_history',
    payload: current.value,
    changed_by: user.id,
  }] : []);

  const { data, error } = current
    ? await supabase
      .from('SystemConfigs')
      .update({ value: body.brand_history })
      .eq('key', 'brand_history')
      .select('value')
      .maybeSingle()
    : await supabase
      .from('SystemConfigs')
      .insert({ key: 'brand_history', value: body.brand_history })
      .select('value')
      .maybeSingle();

  if (error) {
    if (expectedRevision && error.code === '23505') {
      return apiResponse.error('Lịch sử đã được thay đổi ở cửa sổ khác. Bản nháp của bạn vẫn được giữ lại.', 'CONTENT_CONFLICT', 409);
    }
    return apiResponse.error(error.message, 'DB_ERROR', 500);
  }
  if (!data) return apiResponse.error('Lịch sử đã được thay đổi ở cửa sổ khác. Bản nháp của bạn vẫn được giữ lại.', 'CONTENT_CONFLICT', 409);

  revalidatePath('/history');
  revalidatePath('/');
  revalidatePath('/[lang]', 'layout');
  return apiResponse.success({ revision: revisionToken(data.value) });
});
