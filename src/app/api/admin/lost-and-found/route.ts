import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { toWebbookingLostFoundItem, toWebbookingLostFoundPayload } from '@/lib/webbookingLostFound';

export const GET = withAuth(async (_request, { supabase }) => {
  const { data, error } = await supabase
    .from('WebbookingLostFound')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('found_on', { ascending: false });

  if (error) return apiResponse.error(error.message, 'DB_ERROR', 500);
  return apiResponse.success((data || []).map(toWebbookingLostFoundItem));
});

export const POST = withAuth(async (request: NextRequest, { supabase }) => {
  const body = await request.json();
  const payload = toWebbookingLostFoundPayload(body);
  const { data, error } = await supabase
    .from('WebbookingLostFound')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    console.error('[admin/lost-and-found POST] Error:', error);
    return apiResponse.error(error.message, 'DB_ERROR', 500);
  }

  try {
    const { revalidatePath } = require('next/cache');
    revalidatePath('/lost-and-found');
    revalidatePath('/api/public/lost-and-found');
  } catch (e) {
    console.error('Revalidation error:', e);
  }

  return apiResponse.success(toWebbookingLostFoundItem(data), undefined, 201);
});
