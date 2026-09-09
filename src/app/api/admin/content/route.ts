import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createHash } from 'node:crypto';
import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { recordContentRevisions } from '@/lib/api/contentRevision';

function canonicalize(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(canonicalize);
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const sorted: Record<string, unknown> = {};
  for (const key of keys) {
    sorted[key] = canonicalize((obj as Record<string, unknown>)[key]);
  }
  return sorted;
}

const revisionToken = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(canonicalize(value ?? null))).digest('hex');

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

    const revisions = data?.reduce((acc: Record<string, string | null>, item: { key: string; value: unknown }) => {
      acc[item.key] = revisionToken(item.value);
      return acc;
    }, {});

    return apiResponse.success(contentData, { revisions });
  } catch (error: any) {
    return apiResponse.error(error.message, 'INTERNAL_ERROR', 500);
  }
});

export const POST = withAuth(async (request: NextRequest, { supabase, user }) => {
  try {
    const payload = await request.json(); // Record<string, any> plus optional _expectedRevisions metadata.
    const expectedRevisions = payload?._expectedRevisions && typeof payload._expectedRevisions === 'object'
      ? payload._expectedRevisions as Record<string, string | null>
      : {};

    // Convert payload to array of {key, value}
    const updates = Object.keys(payload)
      .filter(key => key !== '_expectedRevisions')
      .map(key => ({
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

    const currentByKey = new Map((currentContent || []).map((item: { key: string; value: unknown }) => [item.key, item]));
    for (const update of updates) {
      if (!Object.prototype.hasOwnProperty.call(expectedRevisions, update.key)) continue;
      const current = currentByKey.get(update.key) as { value?: unknown } | undefined;
      const expected = expectedRevisions[update.key] || null;
      const actual = current ? revisionToken(current.value) : null;
      if (actual !== expected) {
        return apiResponse.error('Nội dung đã được thay đổi ở cửa sổ khác. Bản nháp của bạn vẫn được giữ lại.', 'CONTENT_CONFLICT', 409);
      }
    }

    await recordContentRevisions(supabase, (currentContent || []).map((item: { key: string; value: Record<string, unknown> | unknown[] }) => ({
      content_key: `WebBookingContent:${item.key}`,
      payload: item.value,
      changed_by: user.id,
    })));

    // Update with the revision predicate when a caller supplied one. This makes
    // the read/modify/write path safe against two editors saving the same key.
    const savedByKey = new Map<string, unknown>();
    for (const update of updates) {
      const expected = Object.prototype.hasOwnProperty.call(expectedRevisions, update.key)
        ? expectedRevisions[update.key] || null
        : undefined;
      let result;

      if (expected !== undefined && currentByKey.has(update.key)) {
        result = await supabase
          .from('WebBookingContent')
          .update({ value: update.value })
          .eq('key', update.key)
          .select('key, value')
          .maybeSingle();
      } else if (expected !== undefined && !currentByKey.has(update.key)) {
        result = await supabase
          .from('WebBookingContent')
          .insert({ key: update.key, value: update.value })
          .select('key, value')
          .maybeSingle();
      } else {
        result = await supabase
          .from('WebBookingContent')
          .upsert(update, { onConflict: 'key' })
          .select('key, value')
          .maybeSingle();
      }

      if (result.error) {
        if (expected !== undefined && result.error.code === '23505') {
          return apiResponse.error('Nội dung đã được thay đổi ở cửa sổ khác. Bản nháp của bạn vẫn được giữ lại.', 'CONTENT_CONFLICT', 409);
        }
        return apiResponse.error(result.error.message, 'DB_ERROR', 500);
      }
      if (expected !== undefined && !result.data) {
        return apiResponse.error('Nội dung đã được thay đổi ở cửa sổ khác. Bản nháp của bạn vẫn được giữ lại.', 'CONTENT_CONFLICT', 409);
      }

      savedByKey.set(update.key, result.data?.value ?? update.value);
    }

    try {
      revalidatePath('/space');
      revalidatePath('/pure-relaxation');
      revalidatePath('/[lang]/pure-relaxation');
      revalidatePath('/design-your-journey');
      revalidatePath('/api/public/site-content');
    } catch (e) {
      console.warn('Revalidate error:', e);
    }

    const nextRevisions = updates.reduce<Record<string, string | null>>((result, update) => {
      const savedVal = savedByKey.get(update.key) ?? update.value;
      result[update.key] = revisionToken(savedVal);
      return result;
    }, {});
    return apiResponse.success(
      { message: 'Updated successfully', revisions: nextRevisions },
      { revisions: nextRevisions }
    );
  } catch (error: any) {
    return apiResponse.error(error.message, 'INTERNAL_ERROR', 500);
  }
});
