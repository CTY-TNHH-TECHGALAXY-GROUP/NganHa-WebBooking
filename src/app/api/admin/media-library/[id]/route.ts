import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { MediaService } from '@/lib/services/media.service';

export const DELETE = withAuth(async (req, { supabase }, params) => {
  const { id } = await params;

  // 1. Fetch the media record to get the URL
  const { data: media, error: fetchError } = await supabase
    .from('MarketingMedia')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !media) {
    return apiResponse.error('Không tìm thấy file', 'NOT_FOUND', 404);
  }

  // 2. If the source is 'supabase', we delete the physical file
  if (media.source === 'supabase' && media.url) {
    try {
      const parts = media.url.split('/media-uploads/');
      if (parts.length > 1) {
        const filePath = parts[1].split('?')[0]; // Remove query params if any
        if (filePath) {
          const service = new MediaService(supabase);
          await service.deleteFile(filePath);
        }
      }
    } catch (e) {
      console.error('[DELETE MEDIA] Failed to delete physical file:', e);
      // We continue to delete the DB record even if file deletion fails
    }
  }

  // 3. Delete from DB
  const { error: deleteError } = await supabase
    .from('MarketingMedia')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return apiResponse.error(deleteError.message, 'DB_ERROR', 500);
  }

  return apiResponse.success({ success: true });
});
