import { NextRequest } from 'next/server';
import { withCapability } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { PostsService } from '@/lib/services/posts.service';
import { authorizeCapability } from '@/lib/auth/adminCapabilities';

export const GET = withCapability(async (req, { supabase }) => {
  const service = new PostsService(supabase);
  const data = await service.getPosts();
  return apiResponse.success(data);
}, 'content.read', { scope: 'blogs' });

export const POST = withCapability(async (req, access) => {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return apiResponse.error('Payload bài viết không hợp lệ', 'INVALID_PAYLOAD', 400);
  }
  if (body.status !== 'draft') {
    const publishAuthorization = await authorizeCapability(access, 'content.publish', { scope: 'blogs', mutation: true });
    if (!publishAuthorization.allowed) {
      return apiResponse.error(publishAuthorization.error, publishAuthorization.code, publishAuthorization.status);
    }
  }
  const { supabase } = access;
  const service = new PostsService(supabase);
  const data = await service.createPost(body);
  return apiResponse.success(data, undefined, 201);
}, 'content.write', { scope: 'blogs', mutation: true });
