# Kế hoạch phát triển: Quản lý Nội Dung Trang Chủ Đa Ngôn Ngữ (Cập nhật giao diện mới)

Dựa trên yêu cầu của bạn và giao diện trang chủ vừa được cập nhật (Hero banner mới với Logo Oria Spa và text "TechGalaxy Group"), chúng ta sẽ tạo trang cấu hình cho toàn bộ text trên trang chủ với **5 ngôn ngữ** (Tiếng Việt, Tiếng Anh, Tiếng Hàn, Tiếng Nhật, Tiếng Trung).

## 1. Mục tiêu (Goal)
- **Tạo trang Admin**: `/admin/homepage-content` với giao diện trực quan, có các tab ngôn ngữ để cấu hình nội dung.
- **Tích hợp Supabase**: Lưu trữ nội dung dưới dạng JSON vào bảng `SystemConfigs` với key là `homepage_content`.
- **Hiển thị trên Frontend**: Sửa đổi các component ở trang chủ (`Hero`, `BestSeller`, và thẻ `Services` trong `page.tsx`) để tự động đọc cấu hình từ Context.

> [!NOTE] 
> Bản kế hoạch này đã được **cập nhật lại để khớp với cấu trúc UI mới nhất** (loại bỏ các nút bấm, text không còn dùng ở Hero banner).

---

## 2. Các thay đổi dự kiến (Proposed Changes)

### 2.1 Cấu trúc dữ liệu JSON (Lưu vào SystemConfigs)
Dữ liệu sẽ được lưu nhóm theo section, mỗi field sẽ chứa một object cho 5 ngôn ngữ.
```json
{
  "hero": {
    "companyName": { "vi": "TechGalaxy Group", "en": "TechGalaxy Group", ... },
    "subtitle": { "vi": "", "en": "", ... },
    "tagline": { "vi": "", "en": "", ... }
  },
  "bestSeller": {
    "eyebrow": { "vi": "Đặt nhiều nhất tháng này", "en": "Most booked this month", ... },
    "title1": { "vi": "Bán chạy nhất tại", "en": "Best-seller of", ... },
    "title2": { "vi": "Oria Spa", "en": "Oria Spa", ... }
  },
  "services": {
    "eyebrow": { "vi": "Menu Dịch Vụ", "en": "Service Menu", ... },
    "title": { "vi": "Lật từng trang để chọn đúng trải nghiệm bạn muốn", ... },
    "subtitle": { "vi": "Hãy chọn cho mình một dịch vụ hoàn hảo và thư giãn.", ... },
    "hintText": { "vi": "Bạn có thể nhấp vào nút dưới đây để tiếp tục.", ... },
    "cta": { "vi": "Đi tới bước đặt lịch", ... }
  }
}
```

### 2.2 Các Component Frontend sẽ thay đổi

---

#### [NEW] `src/app/admin/homepage-content/page.tsx`
- Tạo giao diện Admin với 5 Tab ngôn ngữ (🇻🇳, 🇬🇧, 🇰🇷, 🇯🇵, 🇨🇳).
- Các form group cho 3 section: Hero, Best Seller, Services.
- Nút "Lưu thay đổi" gọi API `/api/admin/system-settings` để cập nhật dữ liệu.

#### [MODIFY] `src/app/api/admin/system-settings/route.ts`
- Bổ sung key `homepage_content` vào logic `GET` và `POST` để lưu settings.

#### [MODIFY] `src/components/Hero/Hero.tsx`
- Xóa mảng hằng số `HERO_TEXT` dư thừa.
- Thay thế dòng chữ cứng `TechGalaxy Group` bằng `getLocalizedText(systemSettings?.homepage_content?.hero?.companyName, currentLang, 'TechGalaxy Group')`.

#### [MODIFY] `src/components/BestSeller/BestSeller.tsx`
- Tương tự, lấy nội dung tiêu đề và text mô tả của phần BestSeller từ `systemSettings?.homepage_content?.bestSeller`.

#### [MODIFY] `src/app/page.tsx`
- Đọc nội dung section `Service Menu` từ `systemSettings?.homepage_content?.services`.

---

## 3. Kiểm tra & Đánh giá (Verification Plan)
- **UI Admin**: Xác minh người dùng có thể chuyển tab ngôn ngữ, nhập và lưu thành công.
- **UI Frontend**: Truy cập trang chủ, chuyển ngôn ngữ từ Header, xem các tiêu đề ở 3 Section (Hero, Best Seller, Service Menu) có thay đổi tức thì đúng với cấu hình không.

---
Nếu bản kế hoạch cập nhật này đã đúng ý anh, vui lòng nhấn **Proceed** hoặc báo **Duyệt** để em bắt đầu code nhé!
