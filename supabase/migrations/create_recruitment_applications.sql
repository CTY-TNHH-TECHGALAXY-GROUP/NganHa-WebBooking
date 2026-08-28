-- Tạo bảng lưu trữ thông tin ứng tuyển (Recruitment Applications)
CREATE TABLE IF NOT EXISTS public.recruitment_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Thông tin cá nhân
    full_name TEXT NOT NULL,
    dob DATE NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    languages TEXT,
    height INTEGER,
    weight DECIMAL(5,2),
    
    -- Hình ảnh (URL lưu trên Storage)
    photo_url TEXT NOT NULL,
    certificate_url TEXT NOT NULL,
    
    -- Kinh nghiệm & Tình trạng công việc
    experience TEXT NOT NULL,
    employment_status TEXT NOT NULL,
    job_change_reason TEXT,
    previous_company TEXT NOT NULL,
    previous_position TEXT NOT NULL,
    previous_duration TEXT NOT NULL,
    previous_reason TEXT NOT NULL,
    previous_duties TEXT NOT NULL,
    
    -- Vị trí ứng tuyển & Mong muốn
    applied_position TEXT NOT NULL,
    start_date TEXT NOT NULL,
    contact_method TEXT NOT NULL,
    referral_source TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Thông tin hệ thống
    status TEXT DEFAULT 'new' NOT NULL, -- Trạng thái: new, reviewing, interviewed, rejected, hired
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bật Row Level Security (RLS) cho bảng
ALTER TABLE public.recruitment_applications ENABLE ROW LEVEL SECURITY;

-- Chính sách 1: Bất kỳ ai cũng có thể insert (để ứng viên nộp form mà không cần đăng nhập)
-- Lưu ý: Trong môi trường production, bạn có thể muốn thêm reCAPTCHA hoặc token để chống spam.
CREATE POLICY "Allow public insert to recruitment_applications" 
ON public.recruitment_applications 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Chính sách 2: Chỉ người dùng đã đăng nhập (admin) mới có thể xem danh sách ứng viên
CREATE POLICY "Allow authenticated users to read recruitment_applications" 
ON public.recruitment_applications 
FOR SELECT 
TO authenticated 
USING (true);

-- Chính sách 3: Chỉ admin mới có thể cập nhật trạng thái đơn
CREATE POLICY "Allow authenticated users to update recruitment_applications" 
ON public.recruitment_applications 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Chính sách 4: Chỉ admin mới có thể xóa đơn
CREATE POLICY "Allow authenticated users to delete recruitment_applications" 
ON public.recruitment_applications 
FOR DELETE 
TO authenticated 
USING (true);


-- -------------------------------------------------------------
-- TẠO STORAGE BUCKET CHO HÌNH ẢNH RECRUITMENT
-- -------------------------------------------------------------

-- Chèn record tạo bucket vào bảng buckets của schema storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('recruitment_images', 'recruitment_images', true)
ON CONFLICT (id) DO NOTHING;

-- Bật RLS cho đối tượng trong storage
-- Mặc định bảng storage.objects đã bật RLS, ta chỉ cần thêm policy.

-- Policy: Cho phép upload file (INSERT) công khai vào bucket recruitment_images
CREATE POLICY "Allow public to upload recruitment images" 
ON storage.objects 
FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'recruitment_images');

-- Policy: Cho phép đọc file (SELECT) công khai từ bucket recruitment_images
CREATE POLICY "Allow public to view recruitment images" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'recruitment_images');

-- Policy: Chỉ cho phép admin xóa file
CREATE POLICY "Allow authenticated to delete recruitment images" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'recruitment_images');
