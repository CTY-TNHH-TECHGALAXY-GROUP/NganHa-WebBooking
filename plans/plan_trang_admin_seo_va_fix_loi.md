# Bản Vẽ Kỹ Thuật V2: Hệ thống Admin SEO, Đa ngôn ngữ, Media Upload, API SOLID & Dựng Lại Blog

> **Phiên bản:** V2 (đã bổ sung từ Audit Report + Phân tích API SOLID + Blog Migration)
> **Cập nhật cuối:** 23/07/2026

---

## 1. Mục tiêu (Goals)
- Xây dựng trang Admin quản trị nội dung chuẩn SEO bằng **Next.js App Router & Supabase**.
- Tích hợp **5 ngôn ngữ** (Việt, Anh, Hàn, Nhật, Trung) cho toàn bộ nội dung.
- Hỗ trợ **upload Video & Ảnh** linh hoạt cho từng Dịch vụ (Service) **theo Category hiện tại**.
- Cấu trúc mở cho Flipbook Menu: Admin tự do phân loại, quản lý, thêm/xóa trang và upload (Ảnh hoặc Video) cho từng trang lật.
- **Dựng lại trang Blog** từ HTML tĩnh sang Next.js dynamic (đọc từ DB).
- Fix lỗi nghiêm trọng: Trang web **không cuộn được bằng chuột**.
- Kiến trúc API tập trung, chuẩn **SOLID**, thuận tiện bảo trì.

---

## 2. Phân tích hiện trạng & Giải pháp

### 2.1. Lỗi không cuộn được trang bằng chuột (Scroll Bug)
- **File lỗi:** [new-user/layout.tsx](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/NganHa-WebBooking/src/app/%5Blang%5D/new-user/layout.tsx) — Dòng 13-14 đặt `overflow: hidden` vào cả `html` và `body`.
- **Giải pháp:** Gỡ bỏ logic can thiệp `style.overflow` toàn cục. Dùng CSS class toggle thay vì JS trực tiếp.

### 2.2. Quản lý nội dung động & Cơ chế lưu trữ Media (Storage)
- **Lưu trữ:** Dùng **Supabase Storage** (Bucket `media-uploads`). Video/Ảnh KHÔNG lưu trên Vercel.
- **Luồng Upload:** Admin upload → File đẩy lên Supabase Storage → Nhận URL công khai → Lưu URL vào Database.
- **Flipbook:** Bảng `flipbook_pages` — Admin thêm trang không giới hạn.
- **Services:** Bảng `"Services"` ĐÃ CÓ SẴN → Chỉ `ALTER TABLE` thêm `media_url` + `media_type`. **KHÔNG chuyển cấu trúc tên sang JSONB** (giữ nguyên `nameEN`, `nameVN`... để tránh phá vỡ API hiện tại).
- **Migration video cũ:** 6 file trong `public/videos/` (~27MB) cần upload lên Supabase Storage và cập nhật references.

### 2.3. Xác thực & Phân quyền (Authentication & Authorization)
- **Thực trạng:** Nút login hiện tại (`<a href="#login">`) là **rỗng**, KHÔNG có Supabase Auth. Không có `middleware.ts`.
- **Giải pháp:** Xây dựng **toàn bộ luồng Auth từ đầu**:
  1. Tạo form Login (email/password) + Supabase Auth (`signInWithPassword`).
  2. Tạo `middleware.ts` chặn route `/admin/*`.
  3. Kiểm tra role `admin` trong `user_metadata` hoặc bảng `Users` Supabase.
  4. Redirect về trang chủ nếu không phải Admin.

### 2.4. Hỗ trợ 5 Ngôn Ngữ & SEO
- Sử dụng `JSONB` cho nội dung **mới** (content_posts, seo_metadata).
- Nội dung **cũ** (Services) giữ nguyên cấu trúc `nameEN/nameVN/...` để tránh regression.

### 2.5. Dựng lại Blog (từ HTML tĩnh sang Next.js Dynamic)

**Thực trạng trang Blog hiện tại** ([blog.html](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/NganHa-WebBooking/public/blog.html)):
- **416 dòng HTML tĩnh**, chứa 9 bài viết được code cứng trong mảng JS (`ARTICLES`).
- Dùng **Canvas API** tạo background galaxy + nebula thumbnail (không dùng ảnh thật).
- Có header/nav/footer riêng, **tách biệt hoàn toàn** khỏi hệ thống Next.js.
- Được truy cập qua link `/blog.html` (target `_blank`) từ Header chính.
- **Không có SEO** (bài viết render bằng JS → Google không index được nội dung).
- **Không đa ngôn ngữ** — chỉ có tiếng Việt.
- **Không có CMS** — muốn thêm/sửa bài phải sửa trực tiếp source code.

**Giải pháp — Dựng lại hoàn toàn:**
| Tiêu chí | Hiện tại (blog.html) | Sau khi dựng lại |
|---|---|---|
| Render | Client-side JS | **Server Component** (SSR → SEO tốt) |
| Dữ liệu | Code cứng 9 bài | Từ bảng `content_posts` (Supabase) |
| Thêm bài | Sửa code | Từ Admin UI (CRUD) |
| Đa ngôn ngữ | Chỉ tiếng Việt | 5 ngôn ngữ (JSONB) |
| SEO | Không | Meta tags động + `generateMetadata()` |
| URL | `/blog.html` | `/blog` + `/blog/[slug]` |
| Background | Canvas galaxy (170 dòng JS) | Giữ nguyên hiệu ứng — chuyển sang React component |
| Thumbnail | Canvas nebula giả | Ảnh thật từ Supabase Storage |

---

## 3. Kiến trúc API — Chuẩn SOLID

### 3.1. Nguyên tắc
- **S (Single Responsibility):** Mỗi file chỉ 1 trách nhiệm — Route parse request, Service xử lý logic, Supabase chỉ query.
- **O (Open/Closed):** Thêm tính năng mới = thêm Service mới, KHÔNG sửa route cũ.
- **D (Dependency Inversion):** Route gọi Service, Service gọi Supabase client — có thể mock khi test.

### 3.2. Cấu trúc thư mục API mới

```
src/
├── app/api/
│   ├── admin/                         # ← ADMIN APIs (Protected by middleware)
│   │   ├── auth/login/route.ts        # POST: Đăng nhập Admin
│   │   ├── flipbook/route.ts          # GET (list) + POST (create)
│   │   ├── flipbook/[id]/route.ts     # PUT (update) + DELETE
│   │   ├── services/route.ts          # GET (list by category) + PUT (update media)
│   │   ├── posts/route.ts             # GET + POST (CRUD bài viết blog)
│   │   ├── posts/[id]/route.ts        # PUT + DELETE
│   │   ├── seo/route.ts               # GET + PUT (cấu hình SEO global)
│   │   └── upload/route.ts            # POST: Upload file → Supabase Storage
│   │
│   ├── bookings/route.ts              # (Giữ nguyên — public)
│   ├── services/route.ts              # (Giữ nguyên — public)
│   └── chat/route.ts                  # (Giữ nguyên)
│
├── lib/
│   ├── api/                           # ← SHARED API LAYER (MỚI)
│   │   ├── apiResponse.ts             # Format: { success, data/error }
│   │   ├── apiError.ts                # Error classes + codes
│   │   └── withAuth.ts                # Auth wrapper (check admin role)
│   │
│   ├── services/                      # ← SERVICE LAYER (MỚI — Business Logic)
│   │   ├── flipbook.service.ts        # CRUD flipbook_pages
│   │   ├── posts.service.ts           # CRUD content_posts
│   │   ├── media.service.ts           # Upload/Delete trên Supabase Storage
│   │   └── seo.service.ts             # Đọc/Ghi SEO config
│   │
│   ├── supabase.ts                    # (Giữ nguyên)
│   ├── supabase-server.ts             # (Giữ nguyên)
│   └── supabase-client.ts             # (Giữ nguyên)
│
├── app/blog/                          # ← BLOG MỚI (Next.js Dynamic)
│   ├── page.tsx                       # Trang danh sách bài viết
│   └── [slug]/page.tsx                # Trang chi tiết bài viết (SSR + SEO)
│
├── app/admin/                         # ← ADMIN UI (Protected)
│   ├── layout.tsx                     # Admin layout + sidebar
│   ├── page.tsx                       # Dashboard
│   ├── flipbook/page.tsx              # Quản lý Flipbook Pages
│   ├── posts/page.tsx                 # Quản lý bài viết Blog
│   ├── services/page.tsx              # Quản lý media cho Services
│   └── seo/page.tsx                   # Cấu hình SEO global
│
└── middleware.ts                      # ← MỚI: Chặn /admin/* (check auth + admin role)
```

### 3.3. Response Format chuẩn (áp dụng cho MỌI API mới)
```typescript
// Success
{ success: true, data: T, meta?: { total, page } }

// Error
{ success: false, error: { code: string, message: string } }
```

---

## 4. Kiến trúc CSDL (Supabase PostgreSQL)

> ⚠️ **Chú ý:** Tên bảng trong Supabase dùng **PascalCase** (ví dụ `"Services"`, `"Bookings"`). SQL phải dùng dấu ngoặc kép.

1. **Bảng `content_posts` (MỚI — Bài viết Blog):**
   - `id`, `slug` (unique)
   - `title`, `content`, `excerpt` (JSONB — 5 ngôn ngữ)
   - `cover_image` (URL từ Supabase Storage)
   - `category` (text: `skin`, `wellness`, `mind`, `story`)
   - `status` (`draft`, `published`)
   - `author`, `read_time`
   - `seo_metadata` (JSONB)
   - `created_at`, `updated_at`

2. **Bảng `"Services"` (ALTER — Chỉ thêm cột):**
   - Thêm `media_url` (text — URL video/ảnh)
   - Thêm `media_type` (text — `image` hoặc `video`)
   - **KHÔNG** thay đổi cấu trúc cột cũ (`nameEN`, `nameVN`...)

3. **Bảng `flipbook_pages` (MỚI):**
   - `id`, `page_number`, `title`, `media_url`, `media_type`, `is_active`, `created_at`

4. **Bảng `seo_config` (MỚI):**
   - `id`, `robots_txt`, `favicon`, `ga_tracking_id`, `updated_at`

---

## 5. Lộ trình triển khai (7 Phase)

### Phase 1: Fix lỗi Scroll ⚡
- Rà soát [new-user/layout.tsx](file:///c:/Users/ADMIN/OneDrive/Desktop/Ngan%20Ha/NganHa-WebBooking/src/app/%5Blang%5D/new-user/layout.tsx) — xóa `overflow: hidden` trực tiếp.

### Phase 2: Database & Storage 🗄️
- Chạy SQL tạo bảng `content_posts`, `flipbook_pages`, `seo_config`.
- `ALTER TABLE "Services" ADD COLUMN media_url text, ADD COLUMN media_type text;`
- Tạo bucket `media-uploads` trên Supabase Storage + Public Policy.
- Upload 6 file video cũ từ `public/videos/` → Supabase Storage.

### Phase 3: API Shared Layer (SOLID Foundation) 🏗️
- Tạo `lib/api/apiResponse.ts` — Response format chuẩn.
- Tạo `lib/api/apiError.ts` — Error classes + codes.
- Tạo `lib/api/withAuth.ts` — Auth wrapper.

### Phase 4: Auth System 🔐
- Tạo form Login cho Admin (email/password → Supabase Auth).
- Tạo `middleware.ts` — chặn `/admin/*`.
- Cấu hình role `admin` trong Supabase (user_metadata hoặc bảng Users).

### Phase 5: Service Layer + Admin APIs 🔧
- `lib/services/flipbook.service.ts` — CRUD flipbook_pages.
- `lib/services/posts.service.ts` — CRUD content_posts.
- `lib/services/media.service.ts` — Upload/Delete trên Supabase Storage.
- `lib/services/seo.service.ts` — Đọc/Ghi SEO config.
- Tất cả API routes trong `app/api/admin/*` gọi xuống Service Layer.

### Phase 6: Admin UI 🎨
- Dashboard tổng quan.
- Form CRUD bài viết (có tab 5 ngôn ngữ + SEO Scoring).
- Form quản lý Flipbook Pages (thêm/xóa/sắp xếp trang + upload media).
- Form quản lý media cho Services (gom nhóm theo Category).

### Phase 7: Dựng lại Blog + Frontend Tích hợp 🌐
- Tạo `app/blog/page.tsx` — Server Component, fetch từ `content_posts`.
- Tạo `app/blog/[slug]/page.tsx` — Chi tiết bài + `generateMetadata()`.
- Chuyển hiệu ứng Galaxy background sang React component (tái sử dụng).
- Xóa `public/blog.html` sau khi blog mới hoạt động.
- Cập nhật Header: đổi `/blog.html` → `/blog`.
- Cập nhật Flipbook iframe (`public/flipmenu`) để fetch từ API.

---

## 6. Mã SQL tạo bảng (Supabase SQL Editor)

```sql
-- ═══════════════════════════════════════
-- Chạy đoạn này trong Supabase > SQL Editor
-- ═══════════════════════════════════════

-- 1. Bảng bài viết Blog
CREATE TABLE IF NOT EXISTS public.content_posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    slug text UNIQUE NOT NULL,
    title jsonb NOT NULL DEFAULT '{"vi":"","en":"","ko":"","ja":"","zh":""}',
    content jsonb NOT NULL DEFAULT '{"vi":"","en":"","ko":"","ja":"","zh":""}',
    excerpt jsonb DEFAULT '{"vi":"","en":"","ko":"","ja":"","zh":""}',
    cover_image text,
    category text NOT NULL DEFAULT 'story',
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    author text,
    read_time text,
    seo_metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Bảng Flipbook Pages
CREATE TABLE IF NOT EXISTS public.flipbook_pages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    page_number integer NOT NULL,
    title text,
    media_url text NOT NULL,
    media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Bảng SEO Config
CREATE TABLE IF NOT EXISTS public.seo_config (
    id integer PRIMARY KEY DEFAULT 1,
    robots_txt text,
    favicon text,
    ga_tracking_id text,
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. Thêm cột media cho bảng Services hiện tại
ALTER TABLE "Services" ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE "Services" ADD COLUMN IF NOT EXISTS media_type text CHECK (media_type IN ('image', 'video'));
```

---

## 7. 🚨 ĐÁNH GIÁ RỦI RO — Deadline 2 Ngày (25/07/2026)

### 7.1. Phân loại rủi ro từng Phase

| Phase | Mô tả | Rủi ro hỏng UI | Làm trong 2 ngày? |
|---|---|---|---|
| **Phase 1** | Fix lỗi Scroll | 🟡 TRUNG BÌNH | ⚠️ CẨN THẬN — xem 7.2 |
| **Phase 2** | Database & Storage | 🟢 AN TOÀN | ✅ LÀM ĐƯỢC |
| **Phase 3** | API Shared Layer | 🟢 AN TOÀN | ✅ LÀM ĐƯỢC |
| **Phase 4** | Auth System | 🟢 AN TOÀN | ✅ LÀM ĐƯỢC |
| **Phase 5** | Service Layer + Admin APIs | 🟢 AN TOÀN | ✅ LÀM ĐƯỢC |
| **Phase 6** | Admin UI | 🟢 AN TOÀN | ✅ LÀM ĐƯỢC (MVP) |
| **Phase 7** | Dựng lại Blog + Sửa Flipbook | 🔴 CỰC KỲ NGUY HIỂM | ❌ KHÔNG LÀM |

### 7.2. Phase CỰC KỲ NGUY HIỂM — KHÔNG ĐƯỢC ĐỤNG TRƯỚC DEADLINE

**Phase 7 (Dựng lại Blog + Sửa Flipbook + Frontend tích hợp):**
- Sửa `main.js` (184KB) của Flipbook → File vanilla JS khổng lồ, sửa sai 1 dòng = cuốn sách lật CHẾT TRẮNG.
- Xóa `public/blog.html` → Link "Blogs" trên Header trỏ vào 404.
- Migration video từ `public/videos/` → Xóa trước khi Supabase Storage hoạt động = Video hero MẤT.

**Phase 1 (Fix Scroll) — Cần cẩn thận:**
- File `new-user/layout.tsx` đặt `overflow: hidden` CÓ MỤC ĐÍCH (triệt tiêu thanh cuộn khi ở trong menu).
- Xóa mù quáng → Menu hiển thị thanh cuộn xấu, layout nhảy.
- **Khuyến nghị:** Để SAU deadline, hoặc chỉ sửa cleanup function + test kỹ trên cả Desktop & Mobile.

### 7.3. 📁 DANH SÁCH FILE BẤT KHẢ XÂM PHẠM (KHÔNG ĐƯỢC SỬA)

> ⛔ Trong 2 ngày trước deadline, TUYỆT ĐỐI KHÔNG sửa các file sau:

| Nhóm | File | Lý do |
|---|---|---|
| Trang chủ | `src/app/page.tsx` | Render Hero + ServiceBook + About |
| Root layout | `src/app/layout.tsx` | Bọc toàn bộ app |
| Global CSS | `src/app/globals.css` | Sửa sai = vỡ toàn bộ giao diện |
| Components | `src/components/*` (tất cả) | Header, Menu, Checkout, Hero... |
| Flipbook bridge | `src/lib/flipbook/*` | Bridge postMessage đang ổn định |
| Flipbook HTML | `public/flipmenu/*` | Cuốn sách lật (47KB + 600KB JS) |
| Video hero | `public/videos/*` | 6 file video nền trang chủ |
| Blog tĩnh | `public/blog.html` | Blog đang chạy, để yên |
| Luồng booking | `src/app/[lang]/*` | select-menu → menu → checkout |
| Cart storage | `src/lib/bookingCartStorage.ts` | Logic giỏ hàng |
| API public | `src/app/api/services/route.ts` | API lấy dịch vụ |
| API public | `src/app/api/bookings/route.ts` | API đặt lịch |

### 7.4. Tại sao Phase 2–6 AN TOÀN?

Vì chúng chỉ tạo **file/bảng/route MỚI HOÀN TOÀN**, không sửa bất kỳ file cũ nào:

| Phase | Tạo mới | Sửa file cũ? | Rủi ro |
|---|---|---|---|
| 2 — Database | Bảng SQL mới trên Supabase | ❌ Không | 🟢 0% |
| 3 — API Layer | `lib/api/*.ts` mới | ❌ Không | 🟢 0% |
| 4 — Auth | `middleware.ts` + login form | ❌ Không (*) | 🟢 0% |
| 5 — Services | `lib/services/*.ts` + `api/admin/*` | ❌ Không | 🟢 0% |
| 6 — Admin UI | `app/admin/*` mới | ❌ Không | 🟢 0% |

(*) `middleware.ts` chỉ chặn route `/admin/*` — KHÔNG ảnh hưởng route cũ.

---

## 8. 📖 Phân Tích Luồng Flipbook & Booking (Tham Khảo)

### 8.1. Sơ đồ luồng Booking hiện tại

```
Trang chủ (page.tsx)
  ├── Hero (video background)
  ├── AboutStory
  └── ServiceBook (cuốn sách lật)
        └── iframe → public/flipmenu/index.html (47KB HTML tĩnh)
              ↕ postMessage (7 loại)
        └── useFlipbookBridge.ts (lắng nghe message)
              └── appendBookingCartItem() → localStorage
              └── router.push('/en/new-user/standard/checkout')

Luồng 2 (từ menu):
  /:lang/new-user/select-menu → Chọn Standard/VIP
    → /:lang/new-user/:menuType/menu → StandardMenu component
      → /:lang/new-user/:menuType/checkout → Điền form + Xác nhận
        → POST /api/bookings → OrderConfirmModal
```

### 8.2. Kiến trúc Flipbook (7 loại message)

| Message | Hướng | Tác dụng |
|---|---|---|
| `flipmenu:galaxy-entered` | iframe → React | Bật fullscreen |
| `flipmenu:book-returned` | iframe → React | Tắt fullscreen |
| `flipmenu:menu-back` | iframe → React | Quay về select-menu |
| `flipmenu:add-service-to-cart` | iframe → React | Thêm dịch vụ vào giỏ |
| `flipmenu:remove-service-from-cart` | iframe → React | Xóa dịch vụ |
| `flipmenu:book-now` | iframe → React | Thêm + checkout |
| `flipmenu:place-order` | iframe → React | Chuyển checkout |

> ⚠️ **Bridge postMessage đang ổn định. Phase 7 (sau deadline) PHẢI giữ nguyên bridge, chỉ thay nguồn data trong `main.js`.**

### 8.3. Các lỗ hổng ghi nhận (Backlog)

| # | Vấn đề | Mức độ | Trạng thái |
|---|---|---|---|
| 1 | Lỗi cuộn trang Checkout trên Mobile | 🟢 | **Đã sửa an toàn** |
| 2 | Hardcode URL `/en/...` trong ServiceBook | 🟢 | **Đã sửa an toàn** |
| 3 | Flipbook chứa data cứng, không gọi API | 🔴 | Phase 7 (chờ sau show) |
| 4 | Checkout page 888 dòng, vi phạm SRP | 🟡 | Chờ sau show |
| 5 | PremiumMenu bị comment out → VIP = 404 | 🟡 | Chờ sau show |
| 6 | Thiếu trang đặt lịch thành công | 🟡 | Chờ sau show |

---

## 9. 📋 KẾ HOẠCH THỰC THI 2 NGÀY

### Ngày 1 (24/07 — Xây nền)

| Giờ | Task | Phase | Rủi ro |
|---|---|---|---|
| Sáng | Chạy SQL tạo bảng + Tạo Supabase Storage bucket | 2 | 🟢 0% |
| Sáng | Tạo `apiResponse.ts`, `apiError.ts`, `withAuth.ts` | 3 | 🟢 0% |
| Chiều | Tạo form login + `middleware.ts` chặn `/admin` | 4 | 🟢 0% |
| Chiều | Tạo Service Layer (`*.service.ts`) | 5 | 🟢 0% |
| Tối | Tạo API routes `app/api/admin/*` | 5 | 🟢 0% |

### Ngày 2 (25/07 — Admin UI + Test)

| Giờ | Task | Phase | Rủi ro |
|---|---|---|---|
| Sáng | Admin Dashboard + Flipbook Pages Manager | 6 | 🟢 0% |
| Trưa | Blog Posts Manager (CRUD + 5 ngôn ngữ) | 6 | 🟢 0% |
| Chiều | Services Media Manager + SEO Config | 6 | 🟢 0% |
| Chiều | Test trên Vercel Preview | — | 🟢 0% |
| **TỐI** | **SHOW** 🎉 | — | — |

### Sau khi show (tuần sau):
- Phase 7: Tích hợp Flipbook động + Dựng Blog mới
- Backlog: Refactor checkout, PremiumMenu, trang success

### ⚠️ Quy tắc bắt buộc trong 2 ngày:
1. **KHÔNG SỬA** file trong danh sách "bất khả xâm phạm" (mục 7.3).
2. **Mỗi commit** → Deploy Vercel Preview → Kiểm tra trang chủ + booking CÒN CHẠY.
3. **Gặp lỗi build** → REVERT ngay, KHÔNG cố fix sát deadline.
4. **Admin UI chỉ cần hoạt động (MVP)** — không cần đẹp hoàn hảo.
5. **KHÔNG merge vào main** nếu chưa test trên Preview.
