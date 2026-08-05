-- ==========================================
-- ALTER TABLE: Services
-- Purpose: Thêm cột media_url và media_type để lưu video/ảnh
-- cho từng dịch vụ (admin upload qua trang /admin/services)
-- ==========================================

ALTER TABLE public."Services"
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video'));

-- Comment for documentation
COMMENT ON COLUMN public."Services".media_url IS 'URL ảnh hoặc video đại diện cho dịch vụ, do admin upload qua Supabase Storage';
COMMENT ON COLUMN public."Services".media_type IS 'Loại media: image hoặc video';
