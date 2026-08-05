# Kế hoạch phát triển: Kho Media (Media Gallery) cho Marketing

Tính năng này sẽ tạo một trang chuyên dụng để team Marketing quản lý toàn bộ hình ảnh và video. 
Điểm đặc biệt là hệ thống sẽ cho phép **nhập trực tiếp link từ Google Drive hoặc các nguồn ngoài** để tiết kiệm dung lượng lưu trữ cho Supabase.

## Đề xuất cấu trúc dữ liệu (Database)

Vì kho media có thể chứa hàng trăm/ngàn ảnh và video, tôi đề xuất tạo một bảng mới trong Supabase tên là `MarketingMedia` thay vì lưu trong file cấu hình JSON. 

### Bảng `MarketingMedia`
- `id` (uuid): Khóa chính
- `title` (text): Tên file hoặc mô tả (VD: "Banner khuyến mãi T8")
- `type` (text): `image` hoặc `video`
- `url` (text): Đường dẫn trực tiếp đến file (Link Supabase hoặc Link Google Drive/External)
- `source` (text): Nguồn của file (`supabase` hoặc `external`)
- `created_at` (timestamptz): Ngày tạo

> [!CAUTION]
> **Tạo bảng trong Supabase**
> Chúng ta sẽ cần tạo bảng này bằng một đoạn mã SQL. Tôi sẽ chuẩn bị sẵn file SQL để bạn dán vào Supabase SQL Editor.

## Proposed Changes

### 1. API Routes
- Tạo file `src/app/api/admin/media-library/route.ts` để xử lý GET (Lấy danh sách) và POST (Thêm file mới / Link Google Drive).
- Tạo file `src/app/api/admin/media-library/[id]/route.ts` để xử lý DELETE (Xóa file). API này sẽ đảm nhiệm việc thu dọn triệt để: **xóa cả record trong database lẫn file vật lý trên Supabase Storage** (đối với ảnh/video tải lên máy chủ) để giải phóng dung lượng.

### 2. Giao diện (UI) - Trang quản lý
- Tạo trang `src/app/admin/media-library/page.tsx`.
- Tính năng:
  - Hiển thị dạng lưới (Grid) cho ảnh và video.
  - Form thêm mới: 
    - Có 2 tab: **Tải lên máy chủ** (Upload vào Supabase) và **Dùng link ngoài** (Nhập link Google Drive / Youtube / v.v...).
  - Cho phép copy nhanh URL để team Marketing chèn vào bài viết/blog hoặc cập nhật vào các trang khác.
  - **Tính năng dọn dẹp (Cleanup)**: Mỗi ảnh/video sẽ có nút "Thùng rác" để xóa (cảnh báo trước khi xóa). Nếu xóa sẽ gỡ hoàn toàn khỏi máy chủ.
  - Phân trang hoặc tải thêm (Load more) nếu cần.

### 3. Cập nhật Sidebar Admin
- Sửa `src/components/AdminSidebar.tsx` (hoặc file sidebar tương ứng) để thêm menu "🖼️ Kho Media" vào mục quản lý.

## Open Questions

> [!WARNING]
> **Lưu ý về Google Drive Link**
> Link Google Drive mặc định không cho phép nhúng (embed) trực tiếp như một ảnh bình thường (ví dụ thẻ `<img>` hay `<video>`). Để hiển thị được, hệ thống sẽ phải tự động chuyển đổi link dạng `https://drive.google.com/file/d/ID/view` sang dạng `https://drive.google.com/uc?id=ID`. Bạn có đồng ý với cách tiếp cận này không?

> [!IMPORTANT]
> Bạn có đồng ý tạo một bảng mới `MarketingMedia` trong database không? Nếu đồng ý, tôi sẽ tiến hành tạo script SQL. Hoặc nếu bạn muốn lưu vào bảng cấu hình chung `SystemConfigs` (không khuyến khích vì khó tìm kiếm và mở rộng), xin hãy cho tôi biết.
