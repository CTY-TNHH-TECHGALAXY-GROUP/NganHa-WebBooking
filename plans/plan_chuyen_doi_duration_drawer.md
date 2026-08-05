# Chuyển đổi giao diện chọn Mốc Thời Gian sang Drawer Popup (Checkout)

Thay vì sử dụng dropdown `<select>` truyền thống dễ gây lỗi đè chữ, nhìn xuyên và trải nghiệm không tốt trên Mobile, chúng ta sẽ áp dụng thiết kế **Duration Drawer** (popup trượt từ dưới lên) cho trang Checkout, đồng bộ với thiết kế trong file HTML tham khảo.

## Proposed Changes

### `NganHa-WebBooking/src/app/[lang]/new-user/[menuType]/checkout/page.tsx`
- **[MODIFY] `CheckoutGroupedServiceCard`**: 
  - Xóa thẻ `<select>`.
  - Nếu nhóm có nhiều lựa chọn thời gian, hiển thị mức giá từ thấp nhất (`minPrice`) và nhãn `{x} lựa chọn thời lượng`.
  - Cập nhật sự kiện nút "Thêm": Nếu có nhiều tuỳ chọn, gọi hàm mở Drawer thay vì chọn trực tiếp biến thể đầu tiên.
- **[NEW] `DurationDrawer` Component**: 
  - Thêm một component mới quản lý popup chọn thời lượng. Popup bao gồm: Nút kéo (handle), Tiêu đề, Thumbnail dịch vụ, Lưới các nút chọn thời gian (duration options), và Footer chứa tổng quan giá & Nút "Thêm vào giỏ".
  - Khi người dùng bấm chốt, dịch vụ được add vào giỏ hàng và Drawer sẽ đóng.
- **[MODIFY] `CheckoutPage` State**:
  - Bổ sung `activeDrawerGroup` để theo dõi xem dịch vụ nào đang được mở Drawer.

### `NganHa-WebBooking/src/app/[lang]/new-user/[menuType]/checkout/checkout-demo.module.css`
- **[MODIFY] Bổ sung CSS Styling cho Drawer**: 
  - Dịch mã CSS từ file HTML mẫu (các class như `.durationDrawer`, `.drawerBackdrop`, `.drawerOption`, `.drawerConfirm`...) sang định dạng CSS Modules (`camelCase` hoặc giữ nguyên class tương thích).
  - Thêm `@keyframes` để tạo animation slide-up, mượt mà khi mở và đóng.
