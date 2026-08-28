# Kế hoạch triển khai: Đổi tiền tố ID Celestial UI & Dọn dẹp mã nguồn

Kế hoạch này giải quyết vấn đề trùng lặp ID DOM giữa ứng dụng Sách 3D (`#app`) và ứng dụng Thiên Hà (`#celestial-app`), đảm bảo tương tác của động cơ Thiên Hà hoạt động chính xác và dọn dẹp file `celestial-ui.html` dư thừa.

## Thông tin Khảo sát ban đầu
- **onItemSelected** trong `FlipMenu.js` và **engine.init()** trong `index.html` đã được cấu hình khớp nối hoàn toàn chính xác. 
- Lỗi hiển thị/tương tác hiện tại là do sự trùng lặp ID DOM giữa hai Canvas và các cấu trúc UI giỏ hàng.

## Các thay đổi đề xuất

### 1. Thay đổi ID trong HTML (`index.html`)
Thêm tiền tố `cel-` cho toàn bộ các phần tử có ID nằm bên trong khối `<div id="celestial-app">`:
- `galaxy-canvas` -> `cel-galaxy-canvas`
- `scene-celestial` -> `cel-scene-celestial`
- `category-a11y` -> `cel-category-a11y`
- `cartButton` -> `cel-cartButton`
- `cartBadge` -> `cel-cartBadge`
- `serviceSheet` -> `cel-serviceSheet`
- `sheetKicker` -> `cel-sheetKicker`
- `sheetTitle` -> `cel-sheetTitle`
- `serviceContent` -> `cel-serviceContent`
- `focusCategoryRail` -> `cel-focusCategoryRail`
- `iconPreviewPanel` -> `cel-iconPreviewPanel`
- `cartNotification` -> `cel-cartNotification`
- `cartDrawer` -> `cel-cartDrawer`
- `closeCart` -> `cel-closeCart`
- `cartItems` -> `cel-cartItems`
- `cartSubtotal` -> `cel-cartSubtotal`
- `mobilePrev` -> `cel-mobilePrev`
- `mobileNext` -> `cel-mobileNext`
- `layoutDragHandles` -> `cel-layoutDragHandles`
- `layoutEditor` -> `cel-layoutEditor`
- `layoutCategorySelect` -> `cel-layoutCategorySelect`
- `layoutXInput` -> `cel-layoutXInput`
- `layoutYInput` -> `cel-layoutYInput`
- `layoutZInput` -> `cel-layoutZInput`
- `layoutScaleInput` -> `cel-layoutScaleInput`
- `layoutSaveButton` -> `cel-layoutSaveButton`
- `layoutResetButton` -> `cel-layoutResetButton`
- `layoutCopyButton` -> `cel-layoutCopyButton`
- `layoutEditorStatus` -> `cel-layoutEditorStatus`

### 2. Cập nhật mã Javascript (`CelestialEngine.js`)
Thay thế tất cả các câu lệnh truy vấn DOM (`document.getElementById` hoặc `querySelector`) trỏ tới các ID cũ thành ID mới có tiền tố `cel-`.

### 3. Cập nhật CSS Style (`celestial-style.css` và khối `<style>` trong `index.html`)
Thay thế các CSS Selectors sử dụng ID cũ (ví dụ `#layoutEditor`) thành ID mới có tiền tố (ví dụ `#cel-layoutEditor`).

### 4. Xóa tệp dư thừa
- Tiến hành xóa tệp `celestial-ui.html`.

---

## Các file sẽ chỉnh sửa

#### [MODIFY] [index.html](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/flipmenu/index.html)
- Thay đổi ID trong thẻ HTML `#celestial-app`.
- Cập nhật CSS `#scene-celestial` trong thẻ style thành `#cel-scene-celestial`.

#### [MODIFY] [CelestialEngine.js](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/flipmenu/CelestialEngine.js)
- Thay thế toàn bộ các ID DOM cũ bằng ID mới có tiền tố `cel-`.

#### [MODIFY] [celestial-style.css](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/flipmenu/celestial-style.css)
- Cập nhật các Selector CSS tương ứng.

#### [DELETE] [celestial-ui.html](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/flipmenu/celestial-ui.html)
- Xóa bỏ file không sử dụng.

---

## Kế hoạch kiểm chứng (Verification)

### Kiểm tra thủ công
1. Tải lại trang (F5).
2. Nhấp vào Sách để kích hoạt hiệu ứng Bay xuyên.
3. Kiểm tra xem các chòm sao có hiện lên bình thường và tương tác click hành tinh, mở giỏ hàng, di chuyển các nút điều hướng danh mục hoạt động trơn tru không.
4. Đảm bảo console log không còn báo lỗi `ReferenceError` hay lỗi DOM.
