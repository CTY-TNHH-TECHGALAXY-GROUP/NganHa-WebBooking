# History inventory — read-only W0/W1

> Snapshot taken before the user authorized local → Supabase migration. The blocker and “do not run W2/W3” statements below describe that earlier read-only checkpoint; see `execution-report.md` and `history-webp-apply-20260912.json` for the completed migration.

Ngày kiểm tra: 12/09/2026 (Asia/Ho_Chi_Minh)

## Kết luận

Truy vấn read-only vào `SystemConfigs` với `key = brand_history` đã thành công. Giá trị live có shape `{ hero, finale, chapters }`, gồm 7 chapter và 23 scene image references.

Tất cả 24 tham chiếu ảnh (1 hero + 23 scene) là đường dẫn local bắt đầu bằng `/images/`; không có URL `http(s)` tới Supabase Storage. Vì vậy hiện chưa có danh sách “ảnh History đang lấy link Supabase” để chuyển WebP và upload ngược. Đây là blocker dữ liệu cho W2/W3 của plan migration Supabase.

Revision canonical của cấu hình tại thời điểm đọc (chỉ dùng để đối chiếu, không phải secret):

```text
2c02c628edef1944b1767b86f19f864e46d6ecb67475ce0ff90aab2db50f3a7f
```

## Đối chiếu source và live config

- `src/app/layout.tsx` đọc `SystemConfigs` và truyền `brand_history` vào `SystemSettingsProvider`.
- `src/components/History/History.tsx` lấy `hero.image` và `chapters[].scenes[].image` sau khi hydrate.
- Source defaults có 23 PNG trong `public/images/history/` và hero `/images/about-bg.png`; live config trỏ cùng nhóm local assets.
- Live có một giá trị raw `/images/history/2020-ngan-ha-team-ao-dai.jpg`. `normalizeHistoryImagePath` trong `History.tsx` đổi `.jpg` sang PNG đã biết trong defaults, nên file thực tế cần đối chiếu là `/images/history/2020-ngan-ha-team-ao-dai.png`.
- `src/app/admin/history/page.tsx` chỉ cho nhập URL dạng text; không có upload History vào Storage.

## Inventory local effective assets

Metadata được đọc từ file hiện có trong workspace. Không có file nào được sửa.

| Nhóm | Số file | Bytes |
| --- | ---: | ---: |
| Scene PNG effective | 23 | 56,604,252 |
| Hero `/images/about-bg.png` (file thực tế là JPEG dù extension `.png`) | 1 | 81,044 |
| Tổng effective asset set | 24 | 56,685,296 |

Kích thước scene lớn nhất:

- `2018-ngan-ha-facade-day.png`: 3,164,062 B, 1122×1402
- `2026-oriafarm-fnb-display.png`: 3,117,370 B, 1086×1448
- `2015-ngan-ha-storefront.png`: 2,719,992 B, 1448×1086
- `2024-ngan-ha-updated-interior-space.png`: 2,696,589 B, 1254×1254
- `2024-ngan-ha-ngo-duc-ke-new-signboard.png`: 2,644,961 B, 1672×941

Mọi scene PNG đều đang là RGB, 8-bit, non-interlaced. Không có WebP counterpart trong `public/images/history/` tại thời điểm kiểm tra. Có `.DS_Store` 10,244 B trong thư mục; không phải media và đã loại khỏi inventory.

## Storage verification

Supabase Storage bucket list read-only trả về 6 bucket: `attendance`, `avatars`, `media-uploads`, `task-photos`, `Logo`, `recruitment_images`. Listing prefix `history` trả về 0 item ở từng bucket. Kết quả này củng cố rằng chưa có object History ở prefix đã chốt; vẫn không thay thế việc kiểm tra toàn bộ object listing nếu sau này migrate.

## Env audit (names/presence only)

Các biến cần cho live read-only query có mặt trong `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Giá trị không được ghi vào report/log. Truy vấn chỉ dùng service client để `select` một row; không upload, update, insert, delete hoặc gọi API booking.

## Handoff / blocker

1. Không chạy W2 conversion/upload và không thay `brand_history` vì live source không phải Supabase URL.
2. Nếu mục tiêu vẫn là đưa History lên Supabase WebP, agent triển khai cần xem đây là migration local → Supabase: dùng 23 scene PNG effective (và quyết định riêng hero), tạo object mới trong bucket đã xác minh, rồi mới cập nhật URL trong config. Đây là phạm vi mở rộng so với “Supabase URL → WebP”, cần ghi rõ trong execution approval.
3. Nếu admin đã chuyển config sang URL Supabase sau thời điểm inventory, phải chạy lại W1 và kiểm tra revision trước mọi conversion/apply; không dùng manifest này để ghi mù.
4. Không cần tạo manifest URL thật cho lần read-only này; report chỉ giữ các path local, revision hash và số liệu đã sanitize.
