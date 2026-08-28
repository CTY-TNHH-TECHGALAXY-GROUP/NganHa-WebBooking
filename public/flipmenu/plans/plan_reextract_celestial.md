# Kế hoạch triển khai: Tái cấu trúc Celestial Engine từ index2.html mới nhất

Kế hoạch này sửa chữa sai sót do trích xuất nhầm file cũ bằng cách nạp lại toàn bộ mã nguồn của động cơ Thiên Hà mới nhất từ tệp `index2.html` (trong thư mục `standalone-celestial-menu (2)` hoặc `flipmenu`), đồng thời áp dụng lại toàn bộ các bản vá ID và đường dẫn tài nguyên.

## Các bước thực hiện

### 1. Trích xuất mã nguồn mới nhất
Viết kịch bản NodeJS (`scratch/extractCelestialNew.js`) để đọc file `standalone-celestial-menu (2)/index2.html` và trích xuất khối lệnh `<script type="module">`.

### 2. Đóng gói thành Module `CelestialEngine`
Đóng gói mã nguồn vừa trích xuất thành class `CelestialEngine` có cấu trúc:
```javascript
export class CelestialEngine {
    constructor(containerSelector) {
        this.containerSelector = containerSelector;
    }
    init() {
        this._runLegacyEngine();
    }
    _runLegacyEngine() {
        // Toàn bộ 4900 dòng code mới của index2.html
    }
}
```

### 3. Áp dụng bản vá đường dẫn (Asset & Import Paths)
Trong đoạn mã mới trích xuất:
- Giữ nguyên các đường dẫn import `./src/camera-angle-rig.js` và `./src/celestial-planet.js` (vì chúng sẽ chạy tương đối từ file `CelestialEngine.js` nằm ở gốc `flipmenu` đến thư mục `flipmenu/src/` vốn đã có sẵn 2 file này từ bản mới).
- Thay thế toàn bộ các đường dẫn ảnh bắt đầu bằng `"public/` hoặc `'public/` thành `"standalone-celestial-menu (2)/public/` hoặc `'standalone-celestial-menu (2)/public/` để trỏ vào đúng bộ tài nguyên ảnh mới nhất.

### 4. Áp dụng bản vá tránh xung đột ID (Prefix `cel-`)
Tự động thay thế 29 ID DOM bên trong mã nguồn `CelestialEngine.js` mới trích xuất sang dạng `cel-ID` để khớp với giao diện HTML đã sửa ở bước trước.

### 5. Ghi đè vào `CelestialEngine.js`
Ghi đè file `CelestialEngine.js` hiện tại bằng phiên bản mới được trích xuất và vá lỗi hoàn chỉnh.

---

## Các file sẽ chỉnh sửa

#### [MODIFY] [CelestialEngine.js](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/flipmenu/CelestialEngine.js)
- Ghi đè bằng lõi động cơ trích xuất từ `index2.html` mới cùng các bản vá ID/đường dẫn.

---

## Kế hoạch kiểm chứng (Verification)

### Kiểm tra thủ công
1. Tải lại trang (F5).
2. Nhấp vào Sách lật để kiểm tra hiệu ứng chuyển cảnh.
3. Xác minh các chòm sao phiên bản mới nhất hiện lên đầy đủ và các tương tác Click hành tinh, Giỏ hàng, Chuyển mục hoạt động trơn tru.
