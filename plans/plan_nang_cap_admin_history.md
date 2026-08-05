# Kế Hoạch Đánh Giá & Điều Chỉnh Trang Admin Ngân Hà WebBooking

Bản rà soát đối chiếu giữa các tính năng trên **Trang Web Khách Hàng (Customer Web)** và **Hệ Thống Quản Trị (Admin Dashboard)** của dự án **NganHa-WebBooking**, bao gồm nâng cấp quản lý **Lịch Sử (History)**.

---

## 🛠️ Các Hạng Mục Điều Chỉnh & Nâng Cấp (Đã Chốt)

### 🔴 Ưu Tiên 1: Bổ Sung Quản Lý Chi Tiết Dịch Vụ & Giá Cả (`/admin/services`)
- Nâng cấp giao diện `/admin/services` thêm Form chỉnh sửa chi tiết dịch vụ.
- Cho phép sửa: **Tên dịch vụ (5 ngôn ngữ)**, **Giá tiền**, **Thời lượng (phút)**, **Danh mục (cat)**, **Trạng thái (Active/Inactive)**.
- Bổ sung API `PUT /api/admin/services/[id]` hỗ trợ cập nhật toàn bộ thuộc tính service.

### 🔴 Ưu Tiên 2: Trang Quản Lý Đơn Đặt Lịch (`/admin/bookings`) & Lịch Sử (`/admin/history`)
- **Trang Đơn Hàng Hiện Tại (`/admin/bookings`)**: Hiển thị các đơn đặt hẹn mới (Chờ xác nhận, Đã xác nhận) để Admin thao tác nhanh.
- **Trang Lịch Sử Đặt Lịch (`/admin/history`) (Theo yêu cầu: Tách route riêng)**:
  - **Lịch sử Đơn Hàng**: Xem danh sách các đơn đã `HOÀN THÀNH` hoặc `ĐÃ HỦY` theo khoảng thời gian (Hôm nay, Tuần này, Tháng này).
  - **Tra cứu Khách Hàng (Customer History)**: Tìm theo SĐT để xem lịch sử tất cả các lần đặt dịch vụ của khách đó.
  - **Thống kê sơ bộ**: Tổng số đơn đã làm, Tổng doanh thu dự tính, Dịch vụ được đặt nhiều nhất.
- Thêm mục **Đặt lịch** và **Lịch sử** vào Menu Sidebar (`AdminLayout.tsx`).

### 🟡 Ưu Tiên 3: Nâng Cấp Liên Kết Sách Lật & Dịch Vụ (`/admin/flipbook-pages`)
- Thêm trường chọn `service_id` trực tiếp trong form tạo/sửa trang Flipbook.
- Đồng bộ payload dữ liệu trả về cho FlipMenu frontend.

---

## 📋 Kế Hoạch Triển Khai (Implementation Steps)

### Bước 1: Nâng cấp `/admin/services` (Cập nhật Giá & Chi tiết Dịch vụ)
- [ ] Cập nhật API route `src/app/api/admin/services/[id]/route.ts` xử lý update các trường (`price`, `duration`, `names`, `descriptions`, `status`).
- [ ] Thêm Modal/Form chỉnh sửa chi tiết dịch vụ tại `src/app/admin/services/page.tsx`.

### Bước 2: Triển Khai Quản Lý Đặt Lịch & Lịch Sử
- [ ] Tạo API route `src/app/api/admin/bookings/route.ts` (Lấy đơn mới & Đơn lịch sử có phân trang, lọc theo SĐT/trạng thái).
- [ ] Tạo UI `src/app/admin/bookings/page.tsx` (Đơn Đặt Mới).
- [ ] Tạo UI `src/app/admin/history/page.tsx` (Lịch Sử Đơn Hàng & Tra Cứu Khách Hàng theo SĐT).
- [ ] Cập nhật Menu Sidebar `src/app/admin/layout.tsx` và Dashboard `src/app/admin/page.tsx`.

### Bước 3: Tối ưu `/admin/flipbook-pages`
- [ ] Bổ sung chọn `service_id` cho từng trang sách lật.
