import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { FlipbookService } from '@/lib/services/flipbook.service';

export const GET = withAuth(async (req, { supabase }, params) => {
  const service = new FlipbookService(supabase);
  const { id } = await params;
  const data = await service.getPageById(id);
  return apiResponse.success(data);
});

export const PUT = withAuth(async (req, { supabase }, params) => {
  const body = await req.json();
  const service = new FlipbookService(supabase);
  const { id } = await params;
  const data = await service.updatePage(id, body);
  return apiResponse.success(data);
});

export const DELETE = withAuth(async (req, { supabase }, params) => {
  const service = new FlipbookService(supabase);
  const { id } = await params;
  await service.deletePage(id);
  return apiResponse.success({ success: true });
});
