# Scroll media execution report — W0/W6 local verification

Ngày cập nhật: 13/09/2026
Trạng thái: `W0 done`, `W1 done`, `W2 done`, `W3 done`, `W4 done`, `W5 done`, `W6 local verification done`. Chưa deploy production; baseline live, Safari/device thật và 5 cold + 5 warm runs vẫn pending.

## W4 — Runtime tải ảnh theo viewport

- `History` bỏ cache-buster `Date.now()`, giữ URL WebP Supabase ổn định và chỉ ưu tiên hero khi route `/history` truyền `aboveFold`.
- Chapter chỉ gắn stage active/next và thumbnail khi chapter nằm trong vùng đệm `600px`; ảnh đã xem được giữ trong DOM/cache để cuộn ngược không tải lại.
- Timer scene `3600ms` chỉ chạy cho chapter active khi tab foreground; timer được clear khi đổi chapter, unmount hoặc tab background.
- Timer ảnh 6 giây trong `Space` chỉ chạy khi node ảnh visible; khi rời viewport timer được hủy và bắt đầu lại khi quay lại.
- `OurStory` city và ảnh Core Values ở Footer được thêm `loading="lazy"` + `decoding="async"`; chatbot dùng `chatbot-icon.webp`.

## W5 — Runtime tải video theo viewport

- Thêm `src/components/Shared/ViewportVideo.tsx`: gắn source trong vùng đệm `600px`, chỉ play khi visible + tab foreground, pause khi rời viewport/background.
- Video thường ở ngoài hơn `2 viewport` trong `15s` được lưu `currentTime`, tháo source và gọi `load()`; khi quay lại source được gắn lại và khôi phục vị trí phát sau metadata.
- Khi `src` đổi hoặc event metadata/ended về trễ, generation/source check bỏ qua event cũ để không ghi đè media hiện tại.
- Video hero ở Space/FarmStore dùng `eager`; giữ muted/loop/playsInline/object-position và không thay đổi layout. Hero homepage giữ state/retry riêng, chỉ bổ sung pause/resume và retry gating theo viewport/tab.
- Có fallback khi browser không có IntersectionObserver; không claim strict source gate trong fallback đó.

## W6 — Kiểm thử local và gate build

- `npx tsc --noEmit`: pass.
- `npm run build`: pass (Next 15.5.14, 71 static pages generated).
- ESLint targeted cho các file media: 0 errors; warnings đều là cảnh báo tồn tại sẵn (`img`, `any`, hook dependencies, unused symbols).
- `git diff --check`: pass.
- Playwright local desktop `1440x900`, homepage cold: History lúc đầu có `0` ảnh URL thật (`46` placeholder), nhảy cuối có `17` ảnh WebP thật (`29` placeholder); chỉ phát sinh các URL History thuộc vùng đã cuộn tới, không có page error.
- `/history`: lúc đầu chapter đầu có `5` ảnh WebP thật và `41` placeholder; nhảy cuối có `28` ảnh WebP thật và `18` placeholder; không có page error.
- `/space`: lúc đầu hero và video gần viewport có source, video xa không có source; nhảy cuối gắn source cho video đích; trace riêng sau hơn 15s ở xa xác nhận source unload, cuộn về re-attach và video visible phát lại; không có page error.
- `/oriafarm-store`: cấu hình live trong lần kiểm thử không có video URL nên route render ảnh; code path `ViewportVideo` đã qua typecheck/build, chưa có fixture video để đo network lifecycle trên route này.

## Changeset và rollback boundary

- Code thuộc package: `src/components/History/History.tsx`, `src/app/history/page.tsx`, `src/components/Hero/Hero.tsx`, `src/components/Shared/ViewportVideo.tsx`, `src/components/Space/SpacePage.tsx`, `src/components/FarmStore/FarmStorePage.tsx`, `src/components/OurStory/OurStory.tsx`, `src/components/Footer/Footer.tsx`, `src/components/FloatingWidgets/FloatingWidgets.tsx`.
- Asset mới: `public/images/chatbot-icon.webp`; PNG gốc giữ nguyên để rollback.
- Kế hoạch và artefact: `plans/URGENT_SCROLL_MEDIA_PLAN_20260912.md`, `plans/scroll-media-20260912/`.
- Chưa tạo commit/deploy vì worktree có thay đổi không thuộc package. Khi đóng gói phải stage explicit các path trên, rà `git diff` từng dòng và giữ nguyên phần ngoài phạm vi.

## Phạm vi lượt chạy

Đã kiểm kê, chuyển đổi, upload và thay URL 23 ảnh History scene theo yêu cầu. Không xóa object gốc hoặc file PNG local. Các thay đổi ngoài media có trước trong worktree được giữ nguyên.

## W0 — Môi trường và quyền

- Branch lúc kiểm tra: `master`.
- Runtime: Node `v24.18.0`, npm `11.16.0`.
- Lockfile: `package-lock.json`; package khai báo Next `^15.5.14`.
- `.env.local` có các biến Supabase cần thiết; giá trị không được in ra log.
- Lần truy vấn đầu bị DNS chặn trong sandbox. Các lệnh read/write Supabase sau đó chạy với quyền mạng được phê duyệt.
- Không chạy endpoint booking/mail.

## W1 — Kết quả kiểm kê `brand_history`

Nguồn: `SystemConfigs` với `key = brand_history`.

- Snapshot trước thay đổi: `updated_at = 2026-09-11T16:11:54.973+00:00`.
- Shape: object với `hero`, `finale`, `chapters`.
- Có 24 tham chiếu ảnh: 1 hero và 23 scene.
- 23 scene trỏ `/images/history/...`; hero `/images/about-bg.png` nằm ngoài thư mục và được loại khỏi migration.
- 23 file PNG effective trong `public/images/history` tổng `56,604,252` bytes.
- Raw config có một scene `.jpg`; runtime normalize về PNG đã biết, nên migration dùng đúng file PNG hiệu lực.
- Bucket `media-uploads` tồn tại, public; prefix `history` trước migration không có object.

## W2 — Chuyển WebP và upload

- 23/23 scene convert WebP lossless, giữ nguyên dimensions và pixel (`pixelExact: true`).
- Bytes nguồn: `56,604,252`.
- Bytes WebP: `41,104,680`.
- Tiết kiệm: `15,499,572` bytes, khoảng `27.4%`.
- Object path: `history/<safe-name>-<content-hash-prefix>.webp`.
- MIME upload: `image/webp`.
- Cache policy: `31536000`; hash trong path giúp URL ổn định theo nội dung.
- Từng object được download lại sau upload và đối chiếu SHA-256.
- Ảnh PNG local và mọi object gốc vẫn giữ nguyên.

## W3 — Cập nhật cấu hình

- `SystemConfigs.brand_history` đã cập nhật sau khi toàn bộ object verify thành công.
- `updated_at` sau ghi: `2026-09-12T17:12:55.742+00:00`.
- Chỉ 23 trường `chapters[].scenes[].image` đổi sang URL public WebP; hero, finale, text, locale, thứ tự, ID, `imageFit`, `imagePosition` và field khác giữ nguyên.
- Guard kiểm tra canonical revision và `updated_at` trước update; nếu cấu hình đổi trong lúc upload thì dừng, không ghi payload cũ.
- Script chạy ngoài Next server, nên deploy/revalidate route sau khi code phát hành để route static chắc chắn đọc cấu hình mới.

## Xác minh sau ghi

- DB có 23 scene URL WebP.
- HEAD public 23/23 trả HTTP `200`.
- 23/23 trả `Content-Type: image/webp` và có `Content-Length`.
- Listing `media-uploads/history` có 23 object.
- `media-uploads` là bucket public.

## Artefact

- `history-inventory-readonly.md`: snapshot/kiểm kê trước migration.
- `history-webp-manifest-20260912.json`: manifest conversion và QA.
- `history-webp-apply-20260912.json`: mapping target, bytes, hash, kết quả apply.
- `scripts/migrate-history-webp.mjs`: script dry-run/apply có kiểm tra pixel, upload verify và conditional update.

Manifest apply có URL target để đối chiếu/rollback nội bộ; không chứa credential. Không commit snapshot chứa token, signed URL bí mật hoặc service key.

## Rollback

Không xóa file/object gốc. Nếu cần rollback, đọc revision mới nhất, chỉ đảo URL theo mapping của run khi pointer/ID vẫn khớp; không restore mù snapshot cũ và không ghi đè chỉnh sửa admin mới. Git revert không phục hồi dữ liệu Supabase.

## Bước kế tiếp

- Nếu user giao rollout, deploy/revalidate code trên branch `vercel`, sau đó kiểm tra production headers và render từng locale.
- Chạy lại ma trận cold/warm, Safari/iPhone, CLS/LCP/first-frame và memory trend trên build production; local pass không thay thế số đo live.
- Không convert lại object có hash. Chỉ xem xét xóa PNG/object cũ trong một nhiệm vụ riêng sau audit nơi dùng chung và kiểm tra rollback.

## Giới hạn

Chưa có baseline network production mới cho runtime scroll; script audit sẵn có trỏ origin khác và có output thuộc worktree. Việc giảm bytes file không tự chứng minh LCP/first-frame đã đạt mục tiêu. Cần đo 5 cold + 5 warm runs/profile sau deploy.
