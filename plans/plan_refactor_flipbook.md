# Tổng hợp hiệu ứng lật sách (FlipBook) thành thư viện tái sử dụng

Mục tiêu: Tách toàn bộ logic liên quan đến `react-pageflip`, quản lý state (trang hiện tại, tổng số trang), animation chuyển trang, và UI điều hướng ra khỏi `ServiceBook.tsx` để tạo thành một component dùng chung (Library/Shared Component).

## 1. Cấu trúc thư mục mới
Sẽ tạo một thư mục `FlipBook` trong `src/components/Shared/`:
- `src/components/Shared/FlipBook/FlipBook.tsx`: Component chính bao bọc `HTMLFlipBook` và xử lý UI/logic điều hướng.
- `src/components/Shared/FlipBook/FlipBookPage.tsx`: Wrapper bắt buộc (cần dùng `forwardRef`) cho mỗi trang sách.
- `src/components/Shared/FlipBook/index.ts`: Export các thành phần để dễ dàng import ở nơi khác.

## 2. Thiết kế Component `FlipBook`

### Props của `FlipBook`
- `children`: Các trang con (ReactNode).
- `width`, `height`, `minWidth`, `minHeight`: Cấu hình kích thước sách.
- `showCover`, `drawShadow`, `flippingTime`: Cấu hình hiệu ứng lật.
- `renderPageIndicator`: Hàm custom (tuỳ chọn) để render số trang (ví dụ: "Dịch vụ 1/10" hoặc "Trang 1/5").
- `instructionText`: Chữ hướng dẫn dưới cùng ("Vuốt hoặc click...").
- `className`: CSS class bổ sung.

### Logic xử lý nội bộ (Internal Logic)
- Quản lý `bookRef`, `currentPage`, `totalPages`.
- Xử lý các sự kiện `onFlip`, `onInit`.
- Xây dựng sẵn UI điều hướng: Nút Next/Prev với `lucide-react` icons.
- Kèm sẵn animation Framer Motion cho container và navigation.

## 3. Cập nhật `ServiceBook.tsx`
- Refactor `ServiceBook.tsx` để import và sử dụng `<FlipBook>` từ thư viện mới.
- Thay thế nội bộ `<Page>` bằng `<FlipBookPage>`.
- Code `ServiceBook.tsx` sẽ ngắn gọn hơn rất nhiều, chỉ còn tập trung vào việc fetch dữ liệu, render `<CoverPage>`, `<GroupedServicePage>`, `<BackCover>`, thay vì xử lý thư viện pageflip.
