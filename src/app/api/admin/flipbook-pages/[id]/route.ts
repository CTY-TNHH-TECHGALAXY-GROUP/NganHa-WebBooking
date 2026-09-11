import { NextRequest } from 'next/server';
import { withCapability } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { FlipbookService } from '@/lib/services/flipbook.service';
import { authorizeCapability } from '@/lib/auth/adminCapabilities';

export const GET = withCapability(async (req, { supabase }, params) => {
  const service = new FlipbookService(supabase);
  const { id } = await params;
  const data = await service.getPageById(id);
  return apiResponse.success(data);
}, 'content.read', { scope: 'flipbook' });

export const PUT = withCapability(async (req, access, params) => {
  const publishAuthorization = await authorizeCapability(access, 'content.publish', { scope: 'flipbook', mutation: true });
  if (!publishAuthorization.allowed) {
    return apiResponse.error(publishAuthorization.error, publishAuthorization.code, publishAuthorization.status);
  }
  const { supabase } = access;
  const body = await req.json();
  const service = new FlipbookService(supabase);
  const { id } = await params;
  const data = await service.updatePage(id, body);
  return apiResponse.success(data);
}, 'content.write', { scope: 'flipbook', mutation: true });

export const DELETE = withCapability(async (req, access, params) => {
  const publishAuthorization = await authorizeCapability(access, 'content.publish', { scope: 'flipbook', mutation: true });
  if (!publishAuthorization.allowed) {
    return apiResponse.error(publishAuthorization.error, publishAuthorization.code, publishAuthorization.status);
  }
  const { supabase } = access;
  const service = new FlipbookService(supabase);
  const { id } = await params;
  await service.deletePage(id);
  return apiResponse.success({ success: true });
}, 'content.write', { scope: 'flipbook', mutation: true });
