import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { MediaService } from '@/lib/services/media.service';
import { validateUpload, UploadValidationError } from '@/lib/uploads/validateUpload';

export const GET = withAuth(async (req, { supabase }) => {
  const { data, error } = await supabase
    .from('MarketingMedia')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return apiResponse.error(error.message, 'DB_ERROR', 500);
  }

  return apiResponse.success(data);
});

export const POST = withAuth(async (req, { supabase }) => {
  try {
    const contentType = req.headers.get('content-type') || '';

    // Case 1: Direct multipart/form-data file upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const title = formData.get('title')?.toString()?.trim() || '';

      if (!file || !(file instanceof Blob) || file.size === 0) {
        return apiResponse.error('No file provided', 'BAD_REQUEST', 400);
      }

      const validated = await validateUpload(file, {
        folder: 'marketing',
        allowedKinds: ['image', 'video']
      });

      const service = new MediaService(supabase);
      const publicUrl = await service.uploadFile(file, validated.storagePath);

      const { data, error } = await supabase
        .from('MarketingMedia')
        .insert([{
          title: title || validated.safeFileName,
          type: validated.kind,
          url: publicUrl,
          source: 'supabase',
        }])
        .select()
        .single();

      if (error) {
        // Rollback uploaded file if DB insert fails
        try {
          await service.deleteFile(validated.storagePath);
        } catch (delErr) {
          console.error('[POST media-library] Rollback cleanup failed:', delErr);
        }
        return apiResponse.error(error.message, 'DB_ERROR', 500);
      }

      return apiResponse.success(data);
    }

    // Case 2: JSON payload (metadata registration)
    const body = await req.json();

    if (!body.title || !body.type || !body.url || !body.source) {
      return apiResponse.error('Thiếu thông tin bắt buộc', 'BAD_REQUEST', 400);
    }

    if (!['image', 'video'].includes(body.type)) {
      return apiResponse.error('Loại media không hợp lệ (chỉ chấp nhận image hoặc video)', 'BAD_REQUEST', 400);
    }

    if (!['supabase', 'external', 'gdrive'].includes(body.source)) {
      return apiResponse.error('Nguồn media không hợp lệ (supabase, external, gdrive)', 'BAD_REQUEST', 400);
    }

    // Validate URL format and prevent javascript:, data:, file: URI injection
    try {
      const parsedUrl = new URL(body.url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return apiResponse.error('Giao thức URL không an toàn (chỉ chấp nhận http/https)', 'BAD_REQUEST', 400);
      }
    } catch {
      return apiResponse.error('Định dạng URL không hợp lệ', 'BAD_REQUEST', 400);
    }

    const { data, error } = await supabase
      .from('MarketingMedia')
      .insert([{
        title: String(body.title).trim(),
        type: body.type,
        url: String(body.url).trim(),
        source: body.source,
      }])
      .select()
      .single();

    if (error) {
      return apiResponse.error(error.message, 'DB_ERROR', 500);
    }

    return apiResponse.success(data);
  } catch (err: any) {
    if (err instanceof UploadValidationError) {
      return apiResponse.error(err.message, err.code, err.status);
    }
    console.error('[API /admin/media-library POST] Error:', err);
    return apiResponse.error(err.message || 'Lỗi lưu thông tin media', 'INTERNAL_ERROR', 500);
  }
}, ['owner', 'editor']);
