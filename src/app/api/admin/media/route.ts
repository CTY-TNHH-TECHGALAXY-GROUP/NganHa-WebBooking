import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { MediaService } from '@/lib/services/media.service';
import { validateUpload, UploadValidationError } from '@/lib/uploads/validateUpload';

export const POST = withAuth(async (req, { supabase }) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawFolder = formData.get('folder')?.toString() || 'general';

    if (!file || !(file instanceof Blob) || file.size === 0) {
      return apiResponse.error('No file provided', 'BAD_REQUEST', 400);
    }

    // Comprehensive validation: magic bytes, extension, size, and unguessable path
    const validated = await validateUpload(file, {
      folder: rawFolder,
      allowedKinds: ['image', 'video'],
    });

    const service = new MediaService(supabase);
    const publicUrl = await service.uploadFile(file, validated.storagePath);

    return apiResponse.success({ url: publicUrl, path: validated.storagePath });
  } catch (err: any) {
    if (err instanceof UploadValidationError) {
      return apiResponse.error(err.message, err.code, err.status);
    }
    console.error('[API /admin/media POST] Upload error:', err);
    return apiResponse.error(err.message || 'Lỗi tải tệp lên', 'UPLOAD_ERROR', 500);
  }
}, ['owner', 'editor']);

export const DELETE = withAuth(async (req, { supabase }) => {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path');

    if (!path) {
      return apiResponse.error('No path provided', 'BAD_REQUEST', 400);
    }

    // Sanitize path against directory traversal
    if (path.includes('..') || path.startsWith('/') || path.includes('\\') || path.includes('\0')) {
      return apiResponse.error('Invalid file path', 'BAD_REQUEST', 400);
    }

    const service = new MediaService(supabase);
    await service.deleteFile(path);

    return apiResponse.success({ success: true });
  } catch (err: any) {
    console.error('[API /admin/media DELETE] Delete error:', err);
    return apiResponse.error(err.message || 'Lỗi xóa tệp', 'DELETE_ERROR', 500);
  }
}, ['owner', 'editor']);
