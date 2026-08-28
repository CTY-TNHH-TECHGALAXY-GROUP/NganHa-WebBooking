# Kế hoạch thay thế FlipBook Menu cũ bằng FlipMenu 3D (Celestial)

Thay thế cuốn sách dịch vụ hiện tại (`react-pageflip`) bằng bản demo 3D chạy bằng HTML/Three.js từ thư mục `flipmenu`. Để đảm bảo tính nguyên vẹn của hiệu ứng 3D phức tạp (được viết bằng Vanilla JS và Three.js), phương pháp tốt nhất và an toàn nhất là sử dụng chiến lược nhúng qua thẻ `iframe`.

## User Review Required
> [!IMPORTANT]
> - Cuốn sách mới hiện tại lấy dữ liệu hình ảnh và nội dung **cố định (hardcoded)** từ file `main.js` trong thư mục `flipmenu`. Nó sẽ không tự động lấy dữ liệu dịch vụ từ Supabase như cuốn sách cũ trừ khi chúng ta thiết lập cơ chế truyền dữ liệu (postMessage) vào bên trong iframe.
> - Kế hoạch này sẽ tập trung vào việc **tích hợp thành công bản gốc 3D** vào hệ thống trước. Xin hãy xác nhận bạn đồng ý với hướng tiếp cận dùng Iframe này.

## Proposed Changes

---

### Tích hợp Source Code 3D (Assets)

#### [NEW] `public/flipmenu/*`
Sao chép toàn bộ nội dung cần thiết từ thư mục `C:\Users\ADMIN\OneDrive\Desktop\Ngan Ha\flipmenu` vào thư mục tĩnh `public/flipmenu` của project Next.js. Bao gồm:
- Các file HTML: `index.html`
- Các file Javascript lõi: `main.js`, `FlipMenu.js`, `CelestialEngine.js`
- Các file Style: `style.css`, `celestial-style.css`
- Thư mục hình ảnh / icons: `icon-library`

*(Sẽ bỏ qua các thư mục không cần thiết của repo cũ như `.git`, `.vscode`, `.DS_Store`, v.v.)*

---

### Component Dịch Vụ Mới (Iframe)

#### [MODIFY] `ServiceBook.tsx`
Thay thế toàn bộ logic sử dụng thư viện `react-pageflip` và Data Fetching (tạm thời) bằng một khung `iframe` nhúng toàn màn hình trỏ tới file `/flipmenu/index.html` trong public. Cung cấp một bộ hiển thị đẹp mắt bao bọc Iframe để tương thích với bố cục trang chủ.

#### [DELETE] Thư mục `src/components/Shared/FlipBook/*`
Xóa thư mục `FlipBook` cũ (chứa `FlipBook.tsx`, `FlipBookPage.tsx`, `index.ts`) vì không còn cần thiết nữa, giảm bớt dependency cho project. 

---

### Cập Nhật Trang Chủ (Home)

#### [MODIFY] `page.tsx`
Cập nhật lại cách gọi `ServiceBook` (bỏ dynamic import `ssr: false` đi vì Iframe không bị lỗi SSR), điều chỉnh lại CSS section nếu kích thước của bản 3D yêu cầu tỷ lệ toàn màn hình.

## Verification Plan

### Manual Verification
- Vận hành server cục bộ `npm run dev`.
- Truy cập vào trang chủ (`/`) trên trình duyệt để xác minh hiệu ứng sách 3D mới xuất hiện mượt mà.
- Kiểm tra bảng điều khiển (F12) đảm bảo không có lỗi thiếu đường dẫn assets (404) bên trong Iframe.
- Kiểm tra tính tương thích trên giao diện di động (Mobile Responsive).
