import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { FlipbookService } from '@/lib/services/flipbook.service';

export const GET = withAuth(async (req, { supabase }) => {
  const service = new FlipbookService(supabase);
  const data = await service.getPages();
  return apiResponse.success(data);
});

export const POST = withAuth(async (req, { supabase }) => {
  const body = await req.json();
  const service = new FlipbookService(supabase);
  const data = await service.createPage(body);
  return apiResponse.success(data, undefined, 201);
});
