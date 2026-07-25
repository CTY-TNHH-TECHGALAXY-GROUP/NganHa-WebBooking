-- Tạo bucket "media-uploads" nếu chưa có
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-uploads', 'media-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Bỏ qua dòng ENABLE ROW LEVEL SECURITY vì mặc định Supabase đã bật và có thể gây lỗi quyền

-- 1. Cho phép TẤT CẢ MỌI NGƯỜI xem file (public url)
CREATE POLICY "Cho phép tất cả xem media-uploads"
ON storage.objects FOR SELECT
USING ( bucket_id = 'media-uploads' );

-- 2. Cho phép insert file vào bucket
CREATE POLICY "Cho phép tải file lên media-uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'media-uploads' );

-- 3. Cho phép update file
CREATE POLICY "Cho phép sửa file trong media-uploads"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'media-uploads' );

-- 4. Cho phép delete file
CREATE POLICY "Cho phép xóa file trong media-uploads"
ON storage.objects FOR DELETE
USING ( bucket_id = 'media-uploads' );
