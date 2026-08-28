# Kế Hoạch: Chuyển Đổi Luồng Đặt Lịch & Routing Đa Ngôn Ngữ

*Trạng thái: Đã duyệt*

## Mục Tiêu
Gỡ bỏ component form đặt lịch trực tiếp ở trang chủ. Thay vào đó, khi khách hàng bấm nút "Đi tới bước đặt lịch" (hoặc các nút CTA Booking), hệ thống sẽ chuyển hướng sang lộ trình đa ngôn ngữ chuẩn: `/[lang]/new-user/standard/menu` giống hệt luồng của dự án Web Nội Bộ.

## Đề xuất thay đổi

### 1. File `src/app/page.tsx`
- **[MODIFY]** Xóa bỏ component `<BookingForm />`.
- **[MODIFY]** Xóa import `BookingForm`.
- **[MODIFY]** Cập nhật nút CTA ở phần `ServiceBook` (và Hero nếu có): Khi click, thay vì trượt xuống `#booking`, sẽ điều hướng (redirect) sang `/en/new-user/standard/menu` (ngôn ngữ mặc định là `en` hoặc tùy theo logic i18n hiện tại).

### 2. Xây Dựng Lộ Trình (Routing) Mới
- **[NEW]** `src/app/[lang]/new-user/standard/menu/page.tsx`:
  - Tạo route này để khách hàng vào xem danh sách dịch vụ và chọn món.
  - Sẽ đọc param `lang` từ URL để hiển thị ngôn ngữ tương ứng (`en`, `vi`, `kr`, `jp`, `cn`).
  - Giao diện tạm thời có thể là component hiển thị danh sách (như `StandardMenu` của web nội bộ), có nút Back (về `/`) và Checkout (đi tiếp).

- **[NEW]** `src/app/[lang]/new-user/standard/checkout/page.tsx`:
  - Lộ trình cho bước thanh toán tiếp theo.

### 3. Dọn Dẹp (Tuỳ chọn)
- Sau khi luồng mới hoạt động ổn định, có thể xóa hẳn `src/components/BookingForm` cũ để làm sạch codebase.

## Kế hoạch kiểm tra
- Chạy `npm run dev`.
- Vào trang chủ `localhost:3000`, cuộn xuống cuối, xác nhận không còn Form Đặt Lịch cũ.
- Bấm vào nút "Đi tới bước đặt lịch", xác nhận chuyển hướng đúng sang `http://localhost:3000/en/new-user/standard/menu`.
- Tại trang Menu mới, kiểm tra param `lang` có nhận đúng không.
