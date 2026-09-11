import { NextRequest } from 'next/server';
import { withCapability } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { FlipbookService } from '@/lib/services/flipbook.service';
import { authorizeCapability } from '@/lib/auth/adminCapabilities';

export const GET = withCapability(async (req, { supabase }) => {
  const service = new FlipbookService(supabase);
  const data = await service.getPages();
  return apiResponse.success(data);
}, 'content.read', { scope: 'flipbook' });

export const POST = withCapability(async (req, access) => {
  const publishAuthorization = await authorizeCapability(access, 'content.publish', { scope: 'flipbook', mutation: true });
  if (!publishAuthorization.allowed) {
    return apiResponse.error(publishAuthorization.error, publishAuthorization.code, publishAuthorization.status);
  }
  const { supabase } = access;
  const body = await req.json();
  const service = new FlipbookService(supabase);
  const data = await service.createPage(body);
  return apiResponse.success(data, undefined, 201);
}, 'content.write', { scope: 'flipbook', mutation: true });
