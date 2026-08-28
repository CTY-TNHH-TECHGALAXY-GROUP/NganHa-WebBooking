# Kế Hoạch Triển Khai: Chuyển Đổi Flipmenu Thành Thư Viện JS Dùng Chung & Nâng Cấp Hiệu Ứng 3D

Kế hoạch này hướng dẫn các bước chi tiết để refactor mã nguồn hiện tại trong `main.js` và `index.html` thành một thư viện lập trình hướng đối tượng (`class FlipMenu`), đồng thời **nâng cấp hiệu ứng 3D mô phỏng cuốn sách lật trang chân thực**.

---

## 1. Các Thay Đổi Đề Xuất (Proposed Changes)

### Component: Core JS & Nâng Cấp Hiệu Ứng 3D

#### [MODIFY] main.js
*   **Chuyển đổi thành Class:** Định nghĩa cấu trúc `class FlipMenu { constructor(container, options) { ... } }`.
*   **Tham số hóa cấu hình (Parameters Options):** 
    *   Chuyển các biến cứng (`totalPages`, `PAGE_BG_IMAGES`, cấu hình ảnh) thành tham số để dev bên ngoài tự truyền vào.
    *   Hỗ trợ cấu hình bảng màu (`theme`) và các font chữ.
*   **Độc lập logic UI DOM (UI Decoupling):** 
    *   Tách biệt logic render Three.js 3D khỏi các logic DOM (như xử lý giỏ hàng, bảng danh mục, nút bấm...).
    *   Cung cấp các Event Hooks (`onPageFlip`, `onItemSelected`, `onCartChange`) để các UI bên ngoài (React/Vue/HTML) giao tiếp dễ dàng.
*   **✨ Nâng Cấp Hiệu Ứng Mô Phỏng Sách Thật (Realistic Book Physics) ✨**
    *   **Mở sách từ trang số 1 (Bìa):** Xử lý kịch bản cuốn sách ban đầu nằm gập trên mặt bàn. Khi lật trang đầu tiên (trang bìa cứng), bìa mở ra, cuốn sách tự động xoay và di chuyển nhẹ để căn giữa khu vực trang mở.
    *   **Độ cong và độ võng của giấy (Page Bending & Arch):** Sử dụng Shader (Vertex Manipulation) hoặc thay đổi cấu trúc lưới 3D để khi lật, góc mép giấy sẽ uốn cong lả lướt theo thao tác vuốt của GSAP, mô phỏng lực cản không khí và độ dai của giấy.
    *   **Ánh sáng & Đổ bóng động (Dynamic Shadows):** Khi trang đang lật lơ lửng, nó sẽ đổ một bóng mềm (soft shadow) trực tiếp lên trang đang nằm bên dưới. Phần gáy sách sẽ được làm tối hơn (AO) để tạo chiều sâu 3D thật hơn.

#### [MODIFY] index.html
*   Cập nhật cú pháp khởi tạo thư viện với đầy đủ options cấu hình mới và kiểm tra UI giỏ hàng mặc định.
