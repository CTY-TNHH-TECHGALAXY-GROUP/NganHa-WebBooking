# Cập nhật Duration Drawer cho Celestial Engine (Menu 3D)

Qua phản hồi của Quý khách, hệ thống nhận thấy giao diện đang xem nằm ở **Menu 3D Celestial** (`public/flipmenu/CelestialEngine.js`), không phải trang Checkout tiêu chuẩn. Trước đó, hệ thống chỉ mới áp dụng tính năng Drawer cho trang Checkout (Next.js).

Bản kế hoạch này sẽ cập nhật tính năng Drawer cho không gian Menu 3D (Vanilla JS).

## Proposed Changes

### 1. `NganHa-WebBooking/public/flipmenu/CelestialEngine.js`
- **[MODIFY] Render Thẻ Dịch Vụ (`service-card--grouped`)**:
  - Gỡ bỏ hoàn toàn cụm mã `<div class="celestial-dropdown">` (dropdown chọn thời lượng giả lập).
  - Thay thế bằng nội dung tĩnh hiển thị giá thấp nhất và số lượng tuỳ chọn: `Từ [Giá min] - [x] lựa chọn` như HTML mẫu.
  - Cập nhật sự kiện click của nút **BOOK NOW** và icon Thêm giỏ hàng để kích hoạt hàm mở Drawer (`openDurationDrawer`).
- **[NEW] Khởi tạo Duration Drawer (Vanilla JS)**:
  - Tạo cấu trúc DOM (HTML) của Drawer (gồm Backdrop, Panel chính, Ảnh Thumbnail, Lưới chọn thời gian, Footer...).
  - Thêm logic quản lý state: Lưu lại thời lượng đang chọn, cập nhật giá ở Footer.
  - Xử lý sự kiện "THÊM VÀO GIỎ" trên Drawer: Khi chốt, gọi hàm thêm vào giỏ hàng (`cart.push()`) của Celestial Engine và đóng Drawer, đồng thời hiện thông báo "Đã thêm".

### 2. `NganHa-WebBooking/public/flipmenu/celestial-style.css`
- **[NEW] Thêm CSS Drawer**:
  - Chuyển giao các CSS class của Drawer (tương tự như đã làm bên Checkout) sang `celestial-style.css`.
  - Đảm bảo animation (keyframes) trượt lên, độ trong suốt Backdrop hoạt động ổn định trên nền tảng 3D.
