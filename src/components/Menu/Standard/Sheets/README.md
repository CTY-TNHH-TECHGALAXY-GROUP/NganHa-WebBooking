# Hướng Dẫn Kỹ Thuật (Dành cho Người Quản Trị)

Thư mục này chứa các "Sheets" (Bảng thông tin trượt từ dưới lên) của hệ thống Menu.

## 1. Giới thiệu các File

| Tên File | Chức năng | Hình dung thực tế |
| :--- | :--- | :--- |
| **`MainSheet.tsx`** | Bảng chọn thời gian & dịch vụ | Khi khách bấm vào một nhóm món (VD: Massage Body), bảng này hiện lên để khách chọn 60', 90'... |
| **`CartDrawer.tsx`** | Giỏ hàng | Khi khách bấm nút Giỏ hàng góc phải dưới, bảng này hiện danh sách món đã chọn. |
| **`ReviewSheet.tsx`** | Xem nhanh 1 món | Ít dùng hơn, thường dùng khi khách muốn sửa nhanh 1 món cụ thể. |

---

## 2. Cách Chỉnh Sửa (Cấu hình)

Dưới đây là các vị trí bạn có thể tự chỉnh sửa code để thay đổi hiển thị theo ý muốn. Hãy tìm kiếm (Ctrl + F) các từ khóa được bôi đậm.

### A. Chỉnh Sửa Ngôn Ngữ & Từ Vựng
Trong mỗi file (`MainSheet.tsx`, `CartDrawer.tsx`...), ở ngay đầu file (khoảng dòng 20-40) luôn có một biến tên là **`const TEXT`**. Đây là từ điển.

**Cách sửa:**
```javascript
const TEXT = {
    // vn: Tiếng Việt, en: Tiếng Anh, cn: Trung, jp: Nhật, kr: Hàn
    item_name: { vn: 'Tên Mới', en: 'New Name', ... },
};
```
*   **Lưu ý:** Chỉ sửa nội dung trong dấu nháy đơn `'...'`. Đừng xóa mất dấu phẩy `,` hoặc ngoặc nhọn `{}`.

### B. Chỉnh Tốc Độ Trượt (Animation)
Tìm từ khóa: **`duration-300`**
*   Số `300` nghĩa là 300 miliseconds (0.3 giây).
*   Muốn nhanh hơn: Sửa thành `duration-200` hoặc `duration-150`.
*   Muốn chậm hơn (mượt hơn): Sửa thành `duration-500`.
*   **Vị trí:** Thường nằm ở đoạn code `div className="fixed bottom-0 ..."` gần cuối file.

### C. MainSheet.tsx - Chỉnh Số Lượng Hiển Thị Mặc Định
Mặc định hệ thống chỉ hiện 4 mốc thời gian đầu tiên, nếu nhiều hơn sẽ hiện nút "Xem thêm" (View More).
*   **Cách chỉnh:** Tìm số **`4`** trong đoạn: `.slice(0, showAll ? undefined : 4)`
*   Sửa số `4` thành `6` hoặc `8` nếu muốn hiện nhiều hơn.

### D. CartDrawer.tsx - Chỉnh Hiển Thị Giá
Hiện tại giá đang hiển thị gộp dòng: `525.000 VND / 22 USD`.
*   Nếu muốn tách dòng hoặc đổi màu, tìm đoạn code chứa `{formatCurrency(item.priceVND)}` (Khoảng dòng 115).
*   Màu vàng: `text-yellow-500`, Màu đỏ: `text-red-500`, Màu trắng: `text-white`.

---

## 3. Giải Thích Các Hàm Quan Trọng (Logic)

Phần này giải thích cách máy tính "suy nghĩ", bạn **không nên sửa** phần này nếu không hiểu rõ, nhưng nên đọc để biết.

*   **`t(key)`**: Hàm "Người Phiên Dịch".
    *   Ví dụ code gọi `t('back')`.
    *   Máy tính sẽ tra từ điển `TEXT`, xem khách đang chọn ngôn ngữ gì (ví dụ Tiếng Việt), rồi hiển thị chữ "QUAY LẠI".
*   **`formatCurrency(number)`**: Hàm "Kế Toán".
    *   Giúp biến số `500000` thành dạng đẹp `500.000` (thêm dấu chấm).
*   **`onAddToCart`**: Hành động "Bỏ vào giỏ".
    *   Khi khách bấm nút, hàm này sẽ lưu thông tin món ăn vào bộ nhớ tạm của trình duyệt.
*   **`useEffect`**: Hàm "Tự Động".
    *   Chạy tự động khi mở bảng lên. Ví dụ: Tự động sắp xếp thời gian từ thấp đến cao (60' -> 90').

---

## 4. Lưu ý quan trọng
*   ⚠️ **Sao lưu:** Trước khi sửa gì, hãy copy toàn bộ nội dung file ra Notepad để nếu lỡ xóa nhầm code thì còn copy lại được.
*   ✅ **Kiểm tra:** Sửa xong nhớ bấm `Ctrl + S` để lưu và ra màn hình web kiểm tra xem có lỗi không.
