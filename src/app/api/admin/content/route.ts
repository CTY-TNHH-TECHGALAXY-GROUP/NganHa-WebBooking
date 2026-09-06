import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { recordContentRevisions } from '@/lib/api/contentRevision';

export const GET = withAuth(async (_request, { supabase }) => {
  try {
    const { data, error } = await supabase
      .from('WebBookingContent')
      .select('key, value');

    if (error) {
      return apiResponse.error(error.message, 'DB_ERROR', 500);
    }

    // Convert array of {key, value} to an object
    const contentData = data?.reduce((acc: Record<string, any>, item: { key: string; value: unknown }) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    return apiResponse.success(contentData);
  } catch (error: any) {
    return apiResponse.error(error.message, 'INTERNAL_ERROR', 500);
  }
});

export const POST = withAuth(async (request: NextRequest, { supabase, user }) => {
  try {
    const payload = await request.json(); // Expected format: Record<string, any> where key is table key, value is jsonb

    // Convert payload to array of {key, value}
    const updates = Object.keys(payload).map(key => ({
      key,
      value: payload[key]
    }));

    if (updates.length === 0) {
      return apiResponse.success({ message: 'Nothing to update' });
    }

    const { data: currentContent } = await supabase
      .from('WebBookingContent')
      .select('key, value')
      .in('key', updates.map(update => update.key));

    await recordContentRevisions(supabase, (currentContent || []).map((item: { key: string; value: Record<string, unknown> | unknown[] }) => ({
      content_key: `WebBookingContent:${item.key}`,
      payload: item.value,
      changed_by: user.id,
    })));

    // Upsert to table
    const { error } = await supabase
      .from('WebBookingContent')
      .upsert(updates, { onConflict: 'key' });

    if (error) {
      return apiResponse.error(error.message, 'DB_ERROR', 500);
    }

    return apiResponse.success({ message: 'Updated successfully' });
  } catch (error: any) {
    return apiResponse.error(error.message, 'INTERNAL_ERROR', 500);
  }
});
