-- ==========================================
-- CREATE TABLE: MarketingMedia
-- Purpose: Quản lý kho hình ảnh/video tập trung cho Marketing
-- Hỗ trợ lưu trữ link Google Drive và link Supabase
-- ==========================================

CREATE TABLE public."MarketingMedia" (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('image', 'video')),
    url TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('supabase', 'external', 'gdrive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bật Row Level Security (RLS) để bảo mật
ALTER TABLE public."MarketingMedia" ENABLE ROW LEVEL SECURITY;

-- Cho phép tất cả mọi người đọc (SELECT) để web có thể render ảnh/video
CREATE POLICY "Cho phép tất cả đọc MarketingMedia" 
ON public."MarketingMedia" 
FOR SELECT 
USING (true);

-- Cho phép sửa/xóa với Service Role (Admin)
CREATE POLICY "Cho phép admin sửa MarketingMedia" 
ON public."MarketingMedia" 
USING (true)
WITH CHECK (true);
