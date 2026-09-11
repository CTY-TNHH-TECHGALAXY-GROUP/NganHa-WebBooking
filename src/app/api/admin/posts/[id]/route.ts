import { NextRequest } from 'next/server';
import { withCapability } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { PostsService } from '@/lib/services/posts.service';
import { authorizeCapability } from '@/lib/auth/adminCapabilities';

export const GET = withCapability(async (req, { supabase }, params) => {
  const service = new PostsService(supabase);
  const { id } = await params;
  const data = await service.getPostById(id);
  return apiResponse.success(data);
}, 'content.read', { scope: 'blogs' });

export const PUT = withCapability(async (req, access, params) => {
  const body = await req.json();
  if (body?.status !== 'draft') {
    const publishAuthorization = await authorizeCapability(
      access,
      'content.publish',
      { scope: 'blogs', mutation: true },
    );
    if (!publishAuthorization.allowed) {
      return apiResponse.error(
        publishAuthorization.error,
        publishAuthorization.code,
        publishAuthorization.status,
      );
    }
  }
  const service = new PostsService(access.supabase);
  const { id } = await params;
  const data = await service.updatePost(id, body);
  return apiResponse.success(data);
}, 'content.write', { scope: 'blogs', mutation: true });

export const DELETE = withCapability(async (req, access, params) => {
  const publishAuthorization = await authorizeCapability(access, 'content.publish', { scope: 'blogs', mutation: true });
  if (!publishAuthorization.allowed) {
    return apiResponse.error(publishAuthorization.error, publishAuthorization.code, publishAuthorization.status);
  }
  const { supabase } = access;
  const service = new PostsService(supabase);
  const { id } = await params;
  await service.deletePost(id);
  return apiResponse.success({ success: true });
}, 'content.write', { scope: 'blogs', mutation: true });
