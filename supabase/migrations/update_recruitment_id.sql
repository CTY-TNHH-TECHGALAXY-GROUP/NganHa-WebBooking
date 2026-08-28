-- 1. Đổi kiểu dữ liệu của cột id từ UUID sang TEXT
ALTER TABLE public.recruitment_applications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.recruitment_applications ALTER COLUMN id TYPE TEXT USING id::text;

-- 2. Tạo hàm tự động sinh ID theo quy ước recruit-YYYYMMDD-XXX
CREATE OR REPLACE FUNCTION generate_recruitment_id()
RETURNS TRIGGER AS $$
DECLARE
    date_part TEXT;
    seq_val INT;
BEGIN
    -- Lấy ngày hiện tại format YYYYMMDD (ví dụ: 20260806)
    date_part := to_char(CURRENT_DATE, 'YYYYMMDD');
    
    -- Tìm số thứ tự lớn nhất trong ngày hôm nay
    SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM '\d+$') AS INTEGER)), 0) INTO seq_val 
    FROM public.recruitment_applications 
    WHERE id LIKE 'recruit-' || date_part || '-%';
    
    -- Tạo ID mới (cộng 1 vào số thứ tự lớn nhất, format 3 chữ số)
    NEW.id := 'recruit-' || date_part || '-' || LPAD((seq_val + 1)::text, 3, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Gắn Trigger vào bảng recruitment_applications (kích hoạt trước khi Insert)
DROP TRIGGER IF EXISTS trigger_generate_recruitment_id ON public.recruitment_applications;
CREATE TRIGGER trigger_generate_recruitment_id
BEFORE INSERT ON public.recruitment_applications
FOR EACH ROW
EXECUTE FUNCTION generate_recruitment_id();
