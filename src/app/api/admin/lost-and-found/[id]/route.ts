import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { toWebbookingLostFoundItem, toWebbookingLostFoundPayload } from '@/lib/webbookingLostFound';

export const PUT = withAuth(async (request: NextRequest, { supabase }, params) => {
  const { id } = await params;
  const body = await request.json();
  const { data, error } = await supabase
    .from('WebbookingLostFound')
    .update(toWebbookingLostFoundPayload(body))
    .eq('id', id)
    .select('*')
    .single();

  if (error) return apiResponse.error(error.message, 'DB_ERROR', 500);
  return apiResponse.success(toWebbookingLostFoundItem(data));
});

export const DELETE = withAuth(async (_request, { supabase }, params) => {
  const { id } = await params;
  const { error } = await supabase.from('WebbookingLostFound').delete().eq('id', id);
  if (error) return apiResponse.error(error.message, 'DB_ERROR', 500);
  return apiResponse.success({ success: true });
});
