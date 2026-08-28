# Kế Hoạch Triển Khai: Header Mobile Flags & "Coming Soon"

## Mục tiêu
1. **Mobile Flag Selector**: Thêm dropdown cho selector ngôn ngữ trên mobile header (bên trái nút Login).
2. **"Coming Soon" trên Desktop**: Thêm hiệu ứng hover đổi text thành "Coming Soon" cho các mục "Academy" và "Spa home" trên desktop nav.
3. **"Coming Soon" trên Mobile**: Thêm label *Coming Soon* bên phải các mục "Academy" và "Spa home" trong menu mobile.

## Files Bị Ảnh Hưởng
1. `src/components/Header/Header.logic.ts`: Thêm state management cho ngôn ngữ và dropdown.
2. `src/components/Header/Header.tsx`: Cập nhật UI components.
3. `src/styles/header.css`: Thêm styling cho dropdown, hover animations và layout mobile menu.

## Các bước triển khai

### Bước 1: Cập nhật Header.logic.ts
- Thêm state `currentLang` (khởi tạo bằng `LANGUAGES[0]`).
- Thêm state `isLangDropdownOpen`.
- Thêm function `toggleLangDropdown`, `setLanguage`, `closeLangDropdown`.
- Thêm logic để đóng dropdown khi click ra ngoài.

### Bước 2: Thêm CSS vào header.css
- Style cho `.mobile-lang-selector` và `.lang-dropdown-menu`.
- Thêm class `.nav-link-coming-soon` để setup hover animation (dùng pseudo-element hoặc 2 spans) cho mục đích thay đổi text.
- Thêm style cho label `.coming-soon-badge` trên mobile menu.

### Bước 3: Cập nhật Header.tsx
- Integrate `currentLang` và dropdown toggle.
- Thêm khối `.mobile-lang-selector` trong `.header-right` hiển thị cho `<= 1024px`.
- Áp dụng cấu trúc HTML mới cho "Academy" và "Spa home" trong `header-nav-desktop` để support hover text change.
- Thêm `coming-soon-badge` vào mobile menu.

## Lưu ý Kỹ Thuật
- Language switch: khi click vào cờ trong dropdown, cập nhật `currentLang` và đóng dropdown.
- Mobile dropdown UI cần đẹp và phù hợp với theme (Glassmorphism, viền vàng).
- Hover effect "Coming Soon" dùng CSS transition giữa opacity và translateY để tạo sự mượt mà.
