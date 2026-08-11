# Kế Hoạch Cập Nhật Pure Relaxation Menu

## 1. Phân Tích Hiện Trạng & Yêu Cầu
- **Giao diện hiện tại (từ ảnh chụp):** Gồm 6 nhóm (Body Care, Foot Care, Ear Clean, Barber, Package, Add On).
- **File data:** `src/components/PureRelaxation/pureRelaxationData.ts` (Sử dụng cấu trúc `services` và `variants` cho các package phức tạp).
- **Yêu cầu:** Cập nhật file data này để hiển thị các dịch vụ mới lấy từ danh sách DB (NHT, NHS1000-NHS1019).

## 2. Đề Xuất Cấu Trúc Mapping Dữ Liệu
Dựa vào danh sách dịch vụ mới, mình đề xuất cấu trúc map vào giao diện như sau:

### 🟢 A. BODY CARE (Tương ứng nhóm Điều trị Therapy)
- **Hiện tại:** Đang có Mix, Aroma, Hotstone, No Oil.
- **Đề xuất:** 
  - Gộp tất cả các dịch vụ Therapy (NHT0001 - NHT0006) vào một mục tên là **"Điều trị Therapy"** (hoặc "Therapy Massage").
  - Thời lượng & Giá: 60' (720k), 70' (840k), 90' (1.080k), 120' (1.440k), 150' (1.800k), 180' (2.160k).
  - *Câu hỏi:* Các dịch vụ Body cũ (Aroma, Hotstone...) có giữ lại không, hay xóa bỏ hoàn toàn để thay bằng Therapy?

### 🟢 B. FOOT CARE & EAR CLEAN
Sẽ tách danh sách `NHS1000 - NHS1007` ra làm 2 nhóm trên UI:
- **Foot Care:** 
  - `Mát-xa chân - Cắt móng - Chà gót` (90' - 790k)
- **Ear Clean:** 
  - `Ráy tai - Gội đầu - Cổ vai gáy` (70', 90')
  - `Ráy tai - Cổ vai gáy - Mát-xa chân` (70', 90')
  - `Ráy tai - Cổ vai gáy - Body` (70', 90')
  - `Ráy tai - Body - Cổ vai gáy - Gội đầu` (120')

### 🟢 C. PACKAGE (Các Combo Mới)
Sử dụng tính năng `variants` trong code để gom nhóm các combo cho gọn:
- **Nhóm Gội Đầu (Hair Wash Combos):**
  - Gội đầu - Cổ vai gáy - Mát-xa chân (70', 90')
  - Gội đầu - Cổ vai gáy - Body (70', 90')
  - Gội đầu - Facial - Cổ vai gáy - Chân - Body (120')
- **Nhóm Chà Gót & Cắt Móng (Heel & Nail Combos):**
  - Chà gót - Cắt móng - Mát-xa chân (90', 120')
  - Chà gót - Cắt móng - Body (90', 120')
- **Nhóm Facial & Barber (Grooming Combos):**
  - Facial - Cạo râu - Cổ vai gáy - Body - Gội nhanh (90', 120')
- **Nhóm Signature:**
  - King Combo (Cạo râu - Ráy tai - Facial - Gội - Body 4-hand) (150')

### 🟢 D. BARBER & ADD ON
- Danh sách mới không thấy đề cập đến 2 nhóm này.
- *Câu hỏi:* Giữ nguyên dữ liệu cũ cho Barber và Add On, hay ẩn luôn 2 tab này trên menu?

## 3. Các Rủi Trọng Yếu & Bottleneck Cần Sửa
1. **Giá USD ($0):** Một số dịch vụ Package như `NHS1016 -> NHS1019` có giá USD đang là 0. Chức năng thanh toán có bị lỗi nếu khách chọn hiển thị USD không?
2. **Khớp nối DB:** Component `PureRelaxationPage` đang có cơ chế fetch từ `/api/services` để ghi đè media dựa vào `name`. Ta cần đảm bảo `name` trong `pureRelaxationData.ts` khớp chính xác với DB (hoặc sửa logic này).
3. **Mã Cart Item (LỖI NGHIÊM TRỌNG):** Cần điều chỉnh ID khi đẩy vào giỏ hàng (`buildServicePayload`) để nó map đúng mã dịch vụ chuẩn (VD: `NHT0001` thay vì tự generate theo tên `slugify(active.name)`). Hiện tại code đang tự sinh ID bằng `slugify`. Đây là **bottleneck rất lớn** có thể làm hỏng luồng đặt đơn ở backend nếu backend tìm ID dạng `pure-relaxation-body-care-mix-60`.

---
**Trạng thái:** CHỜ DUYỆT (PENDING_APPROVAL)
