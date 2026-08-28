# 🎨 Báo Cáo Phân Tích & Tiến Độ Triển Khai UI/UX Revision Plan

 Dựa trên yêu cầu từ `KẾ HOẠCH CHỈNH SỬA WEBSITE` (UI/UX Revision Plan), dưới đây là kết quả phân tích hiện trạng codebase của dự án `NganHa-WebBooking` và đối chiếu tiến độ với các tiêu chí nghiệm thu.

 ---

 ## 📊 Tổng Quan Tiến Độ

 Nhìn chung, dự án hiện đang ở **giai đoạn đầu** của bản cập nhật UI/UX này. Đa số các tính năng vẫn đang sử dụng cấu trúc cũ (ví dụ: dùng ảnh nền thay vì video, font mặc định thay vì các font custom được yêu cầu, và giỏ hàng chưa được xây dựng).

 ### 1. Priority 1 — Giao diện chính (Navigation Bar)
 - 🟡 **Điều chỉnh Navigation Bar:** Đã có hiệu ứng làm mờ nền khi scroll (`header-scrolled` với `backdrop-filter`). Các category đã ở dạng text đơn giản.
 - 🔴 **Đưa logo vào giữa:** **Chưa triển khai**. Hiện tại logo nằm bên trái, còn danh sách menu nằm ở chính giữa màn hình (Desktop).
 - 🔴 **Chuyển category sang dạng text không viền:** Đã có dạng text, tuy nhiên **chưa áp dụng font SFU Futura** và chưa xử lý hiệu ứng mờ cho trạng thái un-active.
 - 🟢 **Giữ nguyên icon giỏ hàng:** **Đã hoàn thành**. Hiện có icon `ShoppingBag` trên thanh điều hướng.

 ### 2. Priority 2 — Homepage Video Background
 - 🔴 **Xây dựng homepage video background:** **Chưa triển khai**. Hero section hiện tại đang sử dụng ảnh nền tĩnh (`hero-spa-bg.jpg`).
 - 🔴 **Các tính năng liên quan video (Hỗ trợ 5 video, swipe/scroll, autoplay/pause, poster image):** **Chưa triển khai**. 

 ### 3. Priority 3 — Font và trạng thái UI
 - 🔴 **Áp dụng đúng ba font theo từng khu vực:** **Chưa triển khai**. Codebase hiện tại (file `globals.css`) chỉ mới import font `Cinzel`, chưa có file font local của `SFU Futura`, `Abramo`, hay `UTM French Vanilla Regular`.
 - 🔴 **Làm mờ category chưa active & Thêm states:** **Chưa triển khai**. Chỉ mới có hiệu ứng hover đổi màu sang vàng (`--gold-400`).

 ### 4. Priority 4 — Giỏ hàng (Cart)
 - 🔴 **Tạo cart drawer hoặc modal:** **Chưa triển khai**. Nút icon giỏ hàng hiện tại chỉ là một thẻ link neo (`<a href="#cart">`).
 - 🔴 **Hiển thị mục đã chọn, overlay & Nút Đặt lịch:** **Chưa triển khai**.

 ### 5. Priority 5 — Hoàn thiện
 - 🔴 **Thêm loading skeleton:** **Chưa triển khai**. Chưa có component `Skeleton` nào được sử dụng trong thư mục `components`.
 - 🟡 **Thiết kế lại nút chuyển trang cuốn sách:** Đã có cụm nút ChevronLeft / ChevronRight ở component `ServiceBook`, nhưng cần thiết kế lại vùng bấm 44x44px và states theo chuẩn "luxury" như yêu cầu.
 - 🟡 **Tối ưu Responsive, Accessibility và Performance:** Đang có code responsive cơ bản cho các kích thước màn hình, nhưng các tiêu chí mới (như swipe cho video, khóa scroll cho modal) thì chưa có.

 ---

 ## 🛠️ Đề xuất Kế hoạch Triển khai (Implementation Steps)

 Để đưa dự án đạt chuẩn đúng theo Checklist, chúng ta cần thực hiện theo các bước sau:

 1. **Setup Assets (Fonts):**
    - Tải và đưa các font `SFU Futura`, `Abramo`, `UTM French Vanilla Regular` vào thư mục `public/fonts`.
    - Khai báo `@font-face` trong `globals.css` và cập nhật Tailwind config.
 2. **Cập nhật Navigation (Header):**
    - Sửa flex-layout trong `header.css` / `Header.tsx` để Logo ra chính giữa tuyệt đối, dời menu sang trái hoặc phải.
    - Áp dụng font `SFU Futura` và quy tắc opacity (`opacity: 0.4` cho inactive, `1` cho active/hover).
 3. **Xây dựng Video Background (Hero Component):**
    - Cấu trúc lại `Hero.tsx` để nhận mảng dữ liệu video thay vì ảnh tĩnh.
    - Thêm logic xử lý vuốt (swipe) và auto-play/pause dựa trên active index.
 4. **Xây dựng Cart Drawer:**
    - Tạo một component `CartDrawer` (có thể dùng Framer Motion hoặc thư viện UI).
    - Thêm backdrop blur, hiển thị list items và giữ nguyên luồng redirect sang "Đặt lịch".
 5. **Tối ưu Menu Lật Sách & Skeleton:**
    - Cài đặt / Tự code Skeleton Loader và gắn vào trạng thái loading.
    - Chỉnh sửa UI cho nút lật sách.

 > **Lưu ý:** Xin phép xác nhận với bạn để tiến hành bước 1 và bước 2 (Setup Fonts và Điều chỉnh Navigation Bar) trước nhé?
