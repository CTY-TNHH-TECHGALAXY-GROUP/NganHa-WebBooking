import { NextRequest } from 'next/server';
import { withCapability } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { toWebbookingLostFoundItem, toWebbookingLostFoundPayload } from '@/lib/webbookingLostFound';

export const PUT = withCapability(async (request: NextRequest, { supabase }, params) => {
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = resolvedParams?.id;
  const body = await request.json();
  const { data, error } = await supabase
    .from('WebbookingLostFound')
    .update(toWebbookingLostFoundPayload(body))
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('[admin/lost-and-found PUT] Error:', error);
    return apiResponse.error(error.message, 'DB_ERROR', 500);
  }

  try {
    const { revalidatePath } = require('next/cache');
    revalidatePath('/lost-and-found');
    revalidatePath('/api/public/lost-and-found');
  } catch (e) {
    console.error('Revalidation error:', e);
  }

  return apiResponse.success(toWebbookingLostFoundItem(data));
}, 'lost_found.write', { mutation: true });

export const DELETE = withCapability(async (_request, { supabase }, params) => {
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = resolvedParams?.id;
  const { error } = await supabase.from('WebbookingLostFound').delete().eq('id', id);
  if (error) {
    console.error('[admin/lost-and-found DELETE] Error:', error);
    return apiResponse.error(error.message, 'DB_ERROR', 500);
  }

  try {
    const { revalidatePath } = require('next/cache');
    revalidatePath('/lost-and-found');
    revalidatePath('/api/public/lost-and-found');
  } catch (e) {
    console.error('Revalidation error:', e);
  }

  return apiResponse.success({ success: true });
}, 'lost_found.delete', { mutation: true });
