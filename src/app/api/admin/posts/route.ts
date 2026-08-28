import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { PostsService } from '@/lib/services/posts.service';

export const GET = withAuth(async (req, { supabase }) => {
  const service = new PostsService(supabase);
  const data = await service.getPosts();
  return apiResponse.success(data);
});

export const POST = withAuth(async (req, { supabase }) => {
  const body = await req.json();
  const service = new PostsService(supabase);
  const data = await service.createPost(body);
  return apiResponse.success(data, undefined, 201);
});
