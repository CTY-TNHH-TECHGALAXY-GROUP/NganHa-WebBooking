import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';

export const GET = withAuth(async (req, { supabase }) => {
  const { data, error } = await supabase
    .from('MarketingMedia')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return apiResponse.error(error.message, 'DB_ERROR', 500);
  }

  return apiResponse.success(data);
});

export const POST = withAuth(async (req, { supabase }) => {
  const body = await req.json();

  if (!body.title || !body.type || !body.url || !body.source) {
    return apiResponse.error('Thiếu thông tin bắt buộc', 'BAD_REQUEST', 400);
  }

  const { data, error } = await supabase
    .from('MarketingMedia')
    .insert([{
      title: body.title,
      type: body.type,
      url: body.url,
      source: body.source,
    }])
    .select()
    .single();

  if (error) {
    return apiResponse.error(error.message, 'DB_ERROR', 500);
  }

  return apiResponse.success(data);
});
