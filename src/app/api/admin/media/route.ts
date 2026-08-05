import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { ApiError } from '@/lib/api/apiError';
import { MediaService } from '@/lib/services/media.service';

export const POST = withAuth(async (req, { supabase }) => {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const folder = formData.get('folder') as string || 'general';

  if (!file) {
    return apiResponse.error('No file provided', 'BAD_REQUEST', 400);
  }

  // Create unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const service = new MediaService(supabase);
  const publicUrl = await service.uploadFile(file, filePath);
  
  return apiResponse.success({ url: publicUrl, path: filePath });
});

export const DELETE = withAuth(async (req, { supabase }) => {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');

  if (!path) {
    return apiResponse.error('No path provided', 'BAD_REQUEST', 400);
  }

  const service = new MediaService(supabase);
  await service.deleteFile(path);
  
  return apiResponse.success({ success: true });
});
