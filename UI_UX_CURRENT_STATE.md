# 🎨 Báo Cáo Phân Tích Hiện Trạng UI/UX - Spa Ngân Hà Web Booking

## 1. Tổng Quan Ngôn Ngữ Thiết Kế (Design System & Theme)
- **Phong cách chủ đạo:** Sang trọng, Huyền bí, Cao cấp (Luxury & Elegant).
- **Theme:** Dark Mode (Nền tối chủ đạo) kết hợp với các chi tiết màu Vàng Gold.
- **Bảng màu (Color Palette):**
  - **Màu nền (Background):** Nâu đậm / Đồng thâu / Đen tuyền (`#000000`).
  - **Màu nhấn (Primary/Accent):** Gradient Vàng Gold (`#e7aa51` → `#ffe499` → `#8d5a1b`) dùng cho viền, nút bấm, và các đường phân cách.
  - **Màu văn bản (Text):** 
    - Tiêu đề (Heading): Vàng Gold (`#997239`).
    - Nội dung (Body): Trắng ngà/Kem (`#f8f8f8`, `#f4f1e6`) để tối ưu độ tương phản trên nền tối.
    - Các ghi chú (Annotations): Đỏ (`#e7191f`).
- **Nghệ thuật chữ (Typography):**
  - **Heading:** Serif font (mang lại cảm giác cổ điển, sang trọng).
  - **Body text:** Sans-serif (sạch sẽ, hiện đại, dễ đọc trên thiết bị di động).
  - **Tên dịch vụ:** Text gradient gold có gạch chân.

## 2. Cấu Trúc Layout & Components Chính
Dự án được thiết kế theo hướng **Mobile-first** (ưu tiên trải nghiệm trên điện thoại) và áp dụng cấu trúc **One-page scrolling** (cuộn trang mượt mà).

### 2.1 Navigation & Khung Sườn
- **Desktop Layout:** Sử dụng thanh điều hướng dọc (Vertical Sidebar) cố định bên trái thay vì Topbar truyền thống.
  - Các mục chính: Service | Shop | Service Area | Blogs | Academy | Spa Home.
  - Tích hợp cụm cờ chuyển đổi 5 ngôn ngữ (🇻🇳 🇬🇧 🇨🇳 🇯🇵 🇰🇷).
  - Các nút hành động (CTA): "BOOK NOW", "PROMOTIONS", "Log in", "Cart".

### 2.2 Các Section Hiển Thị (UI Sections)
1. **Hero Section:** Ảnh/Video nền full-width tràn viền, hiệu ứng xuất hiện (animated entrance) đi kèm Logo Spa Ngân Hà.
2. **Thông Tin Chi Nhánh (Branch Info):** 
   - 2 chi nhánh hiển thị rõ ràng (11 Ngô Đức Kế & 6B Thi Sách).
   - Nút liên kết Google Maps bo góc, viền gold gradient.
3. **Câu Chuyện Thương Hiệu (Our Story):** Giới thiệu không gian kiến trúc.
4. **Thư Viện Dịch Vụ (Service Gallery):** Sử dụng các thẻ hình ảnh phong cách ảnh lấy liền (Polaroid-style photo cards).
5. **Menu Dịch Vụ (Service Menu):** 
   - Thay vì hiển thị danh sách phẳng thông thường, UI hiện tại áp dụng hiệu ứng **Menu lật sách (react-pageflip)** tạo cảm giác như đang xem cuốn menu thực tế tại Spa.
6. **Blog & Khuyến Mãi:** Các thẻ card chứa bài viết và chương trình giảm giá.
7. **Footer:** Thông tin pháp lý (MST), Hotline, Social links và Google Maps nhúng.
8. **Floating Widgets (Nút liên hệ nhanh):** Trôi nổi trên màn hình, hỗ trợ đa nền tảng chat (Zalo, FB Messenger, WhatsApp, Line, KakaoTalk, WeChat) và Hotline trực tiếp.

## 3. Phân Tích Luồng Chức Năng Cốt Lõi (Core UX Flows)

### 3.1 Luồng Đặt Lịch (Booking Flow)
Đây là luồng chức năng quan trọng nhất, được thiết kế để giảm thiểu số bước cho người dùng:
- **Bước 1 (Khám phá):** Người dùng lướt qua Hero section, tương tác với Menu lật sách để xem giá và thông tin dịch vụ (Dữ liệu fetch động từ Supabase).
- **Bước 2 (Lựa chọn):** Bấm "BOOK NOW" hoặc chọn trực tiếp một dịch vụ.
- **Bước 3 (Nhập liệu):** 
  - Chọn Chi nhánh thực hiện.
  - Cung cấp thông tin cơ bản: Họ tên, Số điện thoại, Email.
  - Chọn Ngày và Khung giờ mong muốn.
- **Bước 4 (Xác nhận & Thanh toán):**
  - Chuyển sang màn hình Checkout.
  - Hiển thị QR Code thanh toán (VietQR) được gen tự động.
  - **Điểm nhấn UX:** Mã QR đã chứa sẵn số tiền chuẩn xác và nội dung chuyển khoản tự động (Mã Booking + Tên Khách) giúp khách hàng không cần gõ tay, giảm thiểu sai sót.
  - Hệ thống ghi nhận trạng thái chờ xác nhận từ nhân viên (Phase 1).

### 3.2 Luồng Đa Ngôn Ngữ (i18n & Localization)
- Giao diện được thiết kế để liền mạch khi chuyển đổi giữa 5 ngôn ngữ, phục vụ đa phần khách du lịch quốc tế khu vực Quận 1.
- UX không bị gãy layout khi độ dài văn bản thay đổi (ví dụ: tiếng Anh dài hơn tiếng Trung).
- Tích hợp sẵn cơ chế ngôn ngữ từ đầu vào các UI component.

## 4. Các Vấn Đề UI/UX Cần Lưu Ý Cho Chuyên Gia
- **Hiệu ứng & Hoạt ảnh:** Các thành phần như thẻ ảnh Polaroid, menu lật sách, gradient chữ, viền bo góc cần giữ được sự mượt mà trên mobile.
- **Tính đồng bộ:** Chú ý độ nhất quán của viền gradient gold trên các component khác nhau (nút bấm, thẻ, sidebar).
- **Tương tác ngón tay (Touch targets):** Vì là Mobile-first, tất cả các nút bấm, phần tử tương tác phải có vùng chạm (touch target) >= 44px theo chuẩn thiết kế di động.
- **Hệ thống Design Token (Gợi ý):** Nên cấu hình các giá trị Animation duration, Border radius, Colors thành biến Constant tại root để dễ dàng tinh chỉnh (ví dụ: `ANIMATION_DURATION`, `CARD_BORDER_RADIUS`).
