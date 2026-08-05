import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { PostsService } from '@/lib/services/posts.service';

export const GET = withAuth(async (req, { supabase }, params) => {
  const service = new PostsService(supabase);
  const { id } = await params;
  const data = await service.getPostById(id);
  return apiResponse.success(data);
});

export const PUT = withAuth(async (req, { supabase }, params) => {
  const body = await req.json();
  const service = new PostsService(supabase);
  const { id } = await params;
  const data = await service.updatePost(id, body);
  return apiResponse.success(data);
});

export const DELETE = withAuth(async (req, { supabase }, params) => {
  const service = new PostsService(supabase);
  const { id } = await params;
  await service.deletePost(id);
  return apiResponse.success({ success: true });
});
