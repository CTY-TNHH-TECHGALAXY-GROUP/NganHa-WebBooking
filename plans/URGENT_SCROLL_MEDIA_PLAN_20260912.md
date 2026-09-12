# Khẩn cấp: tải media theo vị trí cuộn

Ngày: 12/09/2026, cập nhật thực thi 13/09/2026. Tài liệu tổng hợp kế hoạch tải media theo scroll và chuyển ảnh History local sang WebP trên Supabase. W0–W5 đã triển khai; W6 đã kiểm thử local và ghi nhận trong `plans/scroll-media-20260912/execution-report.md`. Production rollout, baseline live và kiểm thử Safari/device thật chưa chạy. Branch ghi nhận khi audit là master; nếu được giao deploy phải kiểm tra branch `vercel` trước khi làm. Worktree có nhiều thay đổi khác: không đưa chúng vào bản sửa media.

Tiến độ đã hoàn thành riêng theo yêu cầu trước: chatbot đã chuyển từ PNG 1,657,247 B sang WebP lossless 621,658 B (giảm khoảng 62.5%) và FloatingWidgets đã dùng URL WebP trong workspace. Giữ nguyên 1024×1024, pixel nhìn thấy và alpha đã được đối chiếu; PNG gốc còn giữ nhưng code không còn tham chiếu. Chưa deploy; không làm lại hoặc tự resize trong lượt cập nhật plan này.

## 1. Chẩn đoán có bằng chứng

| Mức | Vị trí | Phát hiện và tác động |
| --- | --- | --- |
| P0 | History.tsx:732–743 | Sau mount thêm `v=Date.now()` vào mọi URL ảnh. URL thay giữa SSR/client và mỗi lần quay lại trang, làm mất khả năng reuse theo cùng cache key; có thể phát sinh hai request nếu URL đầu đã tải. Không khẳng định mọi ảnh đều tải hai lần nếu chưa có waterfall. |
| P0 | History.tsx:904–911 | Ảnh hero History dùng `priority` dù History nằm sau Hero và OurStory trên homepage. Tranh tài nguyên đầu trang. History còn dùng ở `/history`: phải truyền ngữ cảnh để giữ ưu tiên ảnh đầu trang trên route riêng. |
| P0 | History.tsx:1012–1020,1093 | Mount tất cả scene và thumbnail; `unoptimized` cung cấp file gốc. `sizes` không tự resize khi bỏ optimizer. Slide ẩn bằng opacity vẫn có hình học trong viewport nên native lazy không đảm bảo chỉ tải slide đang xem. |
| P0 | public/images/history | 13 file lớn nhất trong inventory khoảng 2.50–3.16 MB/file. Đây là dung lượng file local, không phải khẳng định toàn bộ đều tải trong production. Thumbnail 96px vẫn có thể nhận file gốc nhiều MB. |
| P0 | Footer.tsx:342; FloatingWidgets.tsx:437 | Footer img thiếu lazy. Audit live ngày 11/09 ghi bốn ảnh footer 1,279,081 B + chatbot PNG 1,657,247 B, tổng 2,936,328 B. Chatbot đã đổi WebP trong workspace như tiến độ ở trên; số live cũ chưa phản ánh thay đổi này. Có WebP footer untracked: kiểm tra nội dung và wiring trước khi tạo thêm hoặc ghi đè. |
| P0 | OurStory.tsx:81 | Ảnh city dưới hero thiếu lazy; các ảnh khác phần lớn có lazy nhưng vẫn thiếu responsive derivatives. |
| P1 | SpacePage.tsx:176–202 | Nhiều MediaRenderer gắn src video, autoplay và preload auto ngay khi mount. Observer hiện có phục vụ reveal/nav, không điều phối media. Hàm component thực tế vẫn khai báo trong SpacePage dù comment ghi outside; cần kiểm tra remount khi state đổi. |
| P1 | FarmStorePage.tsx:166,221,231,302,314,354 | Nhiều video bên dưới hero autoplay với metadata. Preload chỉ là hint, không dùng làm hàng rào tải khi autoplay đang bật. |
| P1 | Hero.tsx:528–539 | Đã chỉ mount một video cấu hình đang active: giữ thiết kế này. Chưa thấy cơ chế viewport/tab visibility trong Hero qua source search. Bổ sung pause/resume phải hòa vào attempt/retry state hiện có. |
| P1 | History.tsx:755 trở đi | Timer scene 3.6s cần gắn với chapter nhìn thấy; kiểm tra lifecycle toàn effect trước khi sửa, không cho chapter ngoài màn hình tiếp tục luân phiên media. |

Nguyên nhân tổng hợp: tải sớm + file quá lớn + cache key không ổn định + carousel/video chưa gắn lifecycle với viewport. Lazy-load chỉ xử lý một phần; unload liên tục có thể khiến cuộn ngược chậm hơn.

## 2. Hành vi cần triển khai

Giữ toàn bộ nội dung, kích thước khung, caption, watermark, focal point, badge, ngôn ngữ và tương tác. Chỉ điều phối phần media trong khung, không unmount cả section, cart hoặc book.

| Trạng thái | Ảnh | Video |
| --- | --- | --- |
| First viewport | Hero/LCP được tải ngay; không chờ observer | Chỉ video hero đang active được tải ngay như hiện tại |
| Còn xa | Giữ khung có kích thước, chưa gắn src/srcset/source hoặc CSS URL | Chưa gắn source; poster cũng theo chính sách tải |
| Sắp tới | Gắn URL trong vùng đệm ban đầu 600px; tinh chỉnh bằng trace | Chuẩn bị poster/source trong vùng đệm nhỏ, không autoplay cho đến khi visible |
| Đang thấy | Hiện sau load/decode phù hợp, giữ chuyển cảnh cũ | Play khi visible đủ và tab foreground; xử lý Promise play bị từ chối |
| Vừa lướt qua | Mặc định giữ ảnh đã tải, tận dụng HTTP cache | Pause; giữ buffer một khoảng để cuộn ngược nhanh |
| Rất xa lâu | Chỉ cân nhắc giải phóng ảnh lớn khi đo thấy áp lực RAM | Sau khoảng đề xuất 15s và cách trên 2 viewport, lưu currentTime rồi bỏ source/load để giải phóng; loại trừ video user đang điều khiển/PiP |

Thông số 600px/15s/2 viewport là điểm bắt đầu thử nghiệm, không phải ngưỡng đã chứng minh. Không chờ media đi đúng vào màn hình mới tải vì mạng chậm sẽ để khung trống. Scroll rất nhanh hoặc nhảy anchor phải ưu tiên đích đang thấy, không tải tất cả section đã đi qua.

Dùng IntersectionObserver chia sẻ theo scroll root và policy; không thêm scroll handler setState toàn trang cho từng ảnh. Carousel ngang cần active index hoặc observer đúng container. Dedupe theo URL + variant; request đang thấy ưu tiên hơn prefetch; chỉ prefetch tối đa một scene kế tiếp của carousel đang xem, không toàn bộ gallery. Hủy hàng đợi chưa chạy khi cuộn khỏi; không hứa hủy mọi img request đã bắt đầu.

Async decode/load/play phải gắn generation token để kết quả cũ không ghi đè src mới. Cleanup observer/timer khi unmount và src đổi. Khi quay lại video, restore currentTime sau metadata nếu seekable; chặn retry timeout coi pause chủ động là lỗi. Giữ frame chuyển cảnh trước đến khi frame mới sẵn sàng.

## 3. Cache và ảnh đúng kích thước

- Bỏ timestamp theo mount; dùng URL ổn định và revision/hash thay khi admin thay nội dung. Không nối query tùy tiện vào signed URL. Giữ normalizeHistoryImagePath.
- P0 dùng derivatives cho asset local: thumbnail 96/192px; footer 80/160px; ảnh nội dung theo width/DPR thực tế. WebP/AVIF lựa chọn sau so chất lượng, không đổi artwork, crop hoặc watermark. Giữ bản gốc.
- Với remote media: kiểm tra hostname thực tế trước khi chuyển sang next/image; remotePatterns hiện chỉ cho một số host. Thử cold optimizer để tránh đổi cả loạt rồi phát sinh lỗi host hoặc chậm lần đầu.
- HTTP browser cache là lựa chọn đầu; đọc Cache-Control/ETag trên response thật. Chỉ immutable dài hạn với URL có version nội dung; URL có thể bị ghi đè cần revalidation hoặc TTL phù hợp SLA admin publish.
- Không lưu ảnh/video base64 trong localStorage. Không triển khai Service Worker/Cache Storage toàn site ở hotfix: dễ stale nội dung, quota và khó invalidation. Browser cache có thể bị eviction; không cam kết giữ vĩnh viễn.
- Unload DOM/source không đảm bảo browser giữ nguyên video buffer hoặc tự giải phóng toàn bộ RAM ngay. Đo thực tế; mặc định ưu tiên giữ ảnh đã xem và pause video.

### 3.1. Chuyển ảnh History đang dùng trên Supabase sang WebP

**Trạng thái:** migration 23 scene local đã hoàn tất; phần dưới vẫn là runbook và tiêu chí để agent tái kiểm tra/rollback. Chỉ chuyển ảnh thuộc History; không xử lý hàng loạt toàn bucket. Mục đích giảm dung lượng truyền cho các lượt tải tương lai; không hoàn lại băng thông đã tiêu thụ. Kết quả thực tế: `56,604,252 → 41,104,680` bytes, tiết kiệm `15,499,572` bytes (~27.4%).

**Tên thư mục đã chốt: `history`.** Đường dẫn object dự kiến `history/<ten-anh>-<hash>.webp` trong bucket thực tế được xác minh. `Content-Type` vẫn là `image/webp` vì đây là MIME của file, không phải tên thư mục. Không tạo bucket mới chỉ để đặt tên history, không đổi đuôi URL mà chưa chuyển định dạng.

Bằng chứng source: cấu hình ở `SystemConfigs` với key `brand_history`; URL nằm trong hero và từng scene. `src/lib/services/media.service.ts` có upload vào `media-uploads`. W1 đã xác nhận 23 scene local cần migrate; hero `/images/about-bg.png` nằm ngoài thư mục và được loại. Bucket `media-uploads` đã xác minh public; 23 object WebP đã upload dưới prefix `history` và URL config đã thay.

| Bước | Công việc cụ thể | Điều kiện hoàn thành |
| --- | --- | --- |
| 1. Kiểm kê | Đọc cấu hình History hiện hành từ nguồn có thẩm quyền; liệt kê hero/scene, URL gốc, bucket/path, MIME, kích thước và dung lượng. Phân biệt Supabase, local và host khác; dedupe URL nhưng giữ đầy đủ các vị trí tham chiếu. | Manifest đúng ảnh đang dùng; không lấy danh sách fallback local làm danh sách ảnh Supabase. |
| 2. Sao lưu | Lưu nguyên cấu hình và revision/hash trước sửa; lập mapping vị trí trường, URL cũ và URL mới dự kiến. Kiểm tra quyền upload và quyền publish History hiện có. | Có bản phục hồi và xác định được phạm vi thay đổi; chưa ghi dữ liệu. |
| 3. Chuyển định dạng | Tải đúng ảnh đã kiểm kê; chuyển WebP, ban đầu giữ nguyên kích thước, tỷ lệ và hướng hiển thị. So chất lượng lossless/lossy phù hợp từng ảnh trước khi chọn; không crop, thêm watermark hay resize hàng loạt. | Ghi dung lượng trước/sau; ảnh không giảm hoặc chất lượng chưa đạt thì giữ URL gốc. |
| 4. Upload file mới | Upload vào `history/<ten-anh>-<hash>.webp`, MIME `image/webp`, không ghi đè object cũ. Kiểm tra bucket cho phép MIME và quyền truy cập tương ứng. Dùng cache policy phù hợp URL có version. | Có URL mới; giữ nguyên quyền public/private, không tự công khai bucket hoặc dùng signed URL sắp hết hạn làm URL bền vững. |
| 5. Kiểm tra trước thay | Đọc thử file mới, kiểm tra status/MIME/giải mã/kích thước; đối chiếu hình với bản gốc. Mọi file chưa qua kiểm tra đều không được đưa vào mapping áp dụng. | Không có ảnh lỗi hoặc sai nội dung trong tập sẽ thay. |
| 6. Cập nhật URL | Đọc lại cấu hình ngay trước ghi; nếu revision thay thì hợp nhất trên bản mới hoặc dừng cập nhật để giải quyết xung đột. Chỉ thay các trường URL khớp mapping; giữ mọi trường khác, kể cả field chưa biết. | Caption, alt, locale, thứ tự, ID, focal point, watermark và nội dung giữ nguyên. |
| 7. Kiểm tra hiển thị | Đọc lại cấu hình sau lưu; xác minh homepage, `/history`, locale, desktop/mobile, scene, thumbnail, preview và cuộn xuống–lên. Xác minh revalidation theo đường publish thực tế. | Website dùng đúng ảnh WebP; không 404, layout lệch hay nội dung cũ ngoài ý muốn. |
| 8. Đo và báo cáo | Đo request/transfer/cache cùng kịch bản trước và sau. Tổng hợp số ảnh thay/giữ, bytes gốc/WebP, tỷ lệ giảm, mapping URL và kết quả QA. | Báo cáo phân biệt giảm kích thước file với giảm transfer đo được; có quy trình rollback. |

**Lưu ý đường ghi cấu hình:** Admin History hiện GET `/api/admin/history` nhưng lưu POST `/api/admin/system-settings`. Route History riêng có revision check và revalidation; không mặc định đường lưu UI có cùng bảo vệ. Khi triển khai phải kiểm tra đường publish thực tế và xử lý xung đột trước ghi; không nhân tiện refactor toàn admin. Không dùng kết quả hydrate mặc định để ghi đè nguyên dữ liệu live. Public sanitizer hiện chỉ giữ `brand_history` nếu là array trong khi editor dùng cấu trúc object: không dùng payload public rỗng để kết luận History không có ảnh; xác minh nguồn cấu hình trước lập inventory.

**Rollback và ảnh gốc:** giữ object gốc, không xóa trong đợt này. Nếu cần phục hồi, đọc cấu hình mới nhất rồi đảo đúng các mapping của đợt chuyển đang còn khớp, bảo toàn chỉnh sửa admin phát sinh sau đó; revalidate và kiểm tra lại. Không restore mù toàn snapshot cũ. Việc xóa object cũ là công việc riêng sau kiểm tra mọi nơi dùng chung và yêu cầu riêng của user. Giữ cả hai phiên bản tạm thời tăng storage dù giảm băng thông tải ảnh mới.

**Kết hợp với scroll/cache:** bỏ timestamp theo mount History trong bản sửa code riêng; dùng hash URL đổi theo nội dung. Sau chuyển WebP vẫn thực hiện priority theo context, active/next scene và timer theo viewport. Tạo thumbnail/responsive derivatives là bước tiếp theo có QA riêng, không ngầm gộp vào chuyển định dạng giữ nguyên kích thước.

## 4. Thứ tự sửa khẩn cấp

1. **Baseline, khoảng 30–60 phút:** khóa SHA/build; ghi route và asset URL đang dùng trên production; capture request/bytes/cache headers + viewport lúc bắt đầu request, các scene ẩn, video playing. Desktop và mobile throttle cùng cấu hình audit cũ; cold/warm riêng. Không lấy dev server làm chuẩn hiệu năng.
2. **P0 History WebP trên Supabase — đã hoàn tất W1–W3:** kiểm kê → sao lưu/manifest → chuyển lossless → upload thư mục `history` → kiểm tra MIME/hash → thay 23 URL → nghiệm thu. Ảnh/object gốc vẫn giữ để rollback; xem execution report để biết mapping và giới hạn.
3. **P0 homepage (`done` trên local):** đã sửa cache key History và priority theo context; chỉ tải active/next scene khi chapter gần màn hình; lazy city/footer; chatbot dùng WebP. Derivatives History theo giai đoạn tiếp của mục 3.1. Đã kiểm tra `/history`; production homepage/locale/checkout cần revalidate sau deploy.
4. **P1 vòng đời media (`done` trên local):** đã tích hợp Hero pause/resume, History timer theo viewport, và `ViewportVideo` cho Space/FarmStore; gate source video dưới fold, ngừng playback ngoài viewport, unload xa có debounce. Không đổi transition book/Galaxy hoặc iframe bridge.
5. **P1 ảnh responsive còn lại:** lần lượt OurStory, Space, Farm và gallery; route nào chưa đo thì không blanket rewrite. Font/config/API khác để kế hoạch riêng.
6. **Nghiệm thu và rollout (`local verification done; production pending`):** typecheck/build/lint targeted và browser trace local đã pass. Khi được giao deploy, deploy từng nhóm đã qua gate lên `vercel`, cùng profile before/after. Rollback commit media khi lỗi blank frame, re-download hoặc visual regression; rollback URL Supabase theo mục 3.1 vì git revert không phục hồi DB. Không gộp thay đổi admin/analytics đang có trong worktree.

Ước lượng theo phạm vi, chưa tính lỗi build tồn tại, thời gian Safari thiết bị thật hoặc pipeline xử lý remote asset. P0 có thể phát hành trước P1 nếu đạt gate; không cần chờ refactor toàn website.

## 5. Gate nghiệm thu bắt buộc

- Ở đầu homepage: không request History/footer xa viewport; hero chính vẫn là video cấu hình, không thêm video mặc định. Chatbot vẫn hiện đủ chức năng với asset nhỏ.
- Cuộn theo từng section: media chỉ request khi vào vùng đã quy định; scene ẩn không đồng loạt tải. Cuộn nhanh/anchor ưu tiên section đích.
- Cuộn xuống rồi lên: không sinh timestamp URL mới; kiểm tra transfer thực và HTTP cache thay vì đếm request đơn thuần. Thử cache bật/tắt tách biệt.
- Tab background/video ngoài viewport không tiếp tục playback hoặc advance carousel; quay lại resume đúng, không timeout/retry giả và không vòng mount/load liên tục.
- Ảnh/khung giữ tỷ lệ và crop; CLS <=0.1, không mất caption/watermark/badge; keyboard, preview, locale, gallery, cart, checkout và book-back vẫn hoạt động.
- Ngân sách đề xuất: nhóm footer + chatbot <=200 KB tổng; thumbnail <=30 KB/file; ảnh nội dung mobile thông thường <=200 KB/file nếu chất lượng chấp nhận. Media xa chưa tới có transfer khởi tạo bằng 0, ngoại trừ tài nguyên dùng chung đang thấy.
- Chatbot WebP hiện 621,658 B nên chưa đạt ngân sách nhóm <=200 KB; đây là mục tiêu giai đoạn responsive tiếp theo, không phải kết quả đã đạt. Chuyển History giữ nguyên kích thước cũng không mặc định đạt ngân sách ảnh mobile.
- Với migration History: có manifest và snapshot, file mới thuộc thư mục history và MIME image/webp; mọi URL được thay đã qua QA; diff dữ liệu chỉ chứa trường URL dự kiến. Giữ ảnh gốc, kiểm tra admin chỉnh đồng thời và xác minh rollback bảo toàn chỉnh sửa mới.
- Mục tiêu lab: hero first frame <=5s trên mobile 1.6Mbps/150ms và LCP <=2.5s; báo riêng metric và selector, không thay LCP bằng first frame. Nếu chưa đạt, profile video bitrate/codec/range và critical path tiếp; không tuyên bố thành công chỉ vì giảm request.
- So 5 cold + 5 warm runs/profile/build, báo median/range, bytes media, request dư và readiness khi cuộn cùng kịch bản. Test Safari/iPhone, scroll đảo chiều, lỗi media, đổi URL từ admin và mạng yếu. Memory trend qua 3 vòng scroll, ghi rõ giới hạn công cụ, không suy RAM toàn browser từ JS heap.
- Kiểm tra type/lint/build đúng tooling repo, test state lifecycle có giá trị; rà từng dòng git diff trước hoàn tất. Không sửa file ngoài mục tiêu chỉ để làm check xanh.

## 6. Runbook bàn giao cho agent triển khai

### 6.1. Hợp đồng nhiệm vụ và thứ tự bắt buộc

Agent nhận việc phải đọc toàn bộ tài liệu, `AGENTS.md`, `README.md`, `DEVELOPMENT_NOTES.md` và hướng dẫn Next đúng phiên bản trước sửa code. Tài liệu là runbook; quyền triển khai đến từ yêu cầu công việc hiện tại. Khi được giao thực hiện, làm đúng phần được giao, không hỏi lại các lựa chọn đã chốt: thư mục history, WebP, giữ bản gốc, bảo toàn thiết kế.

Thực hiện tuần tự các work package W0–W6 dưới đây; ghi trạng thái `pending/in_progress/done/blocked` vào báo cáo. W1–W3 là migration ảnh History; W4–W5 là sửa runtime tải theo scroll. Không spawn agent hoặc sửa song song cùng file nếu user không yêu cầu. Không đánh dấu toàn plan done khi mới đổi URL hoặc mới chạy typecheck.

**Không được làm:** xóa media gốc; đổi public/private bucket; ghi đè toàn SystemConfigs; sửa giá/cart/checkout/admin analytics; đổi i18n/caption/badge/layout; thêm video mặc định; sửa book/Galaxy bằng mask; refactor toàn hệ thống media. Không sửa hoặc commit các file bản sao có tên ` 2`, ` 3` chỉ vì xuất hiện trong tìm kiếm. Không đưa token, service key, cookie hoặc signed URL bí mật vào log/commit.

### 6.2. W0 — Chốt môi trường, baseline và hồ sơ thực thi

1. Đọc `git status --short`, branch, HEAD; ghi danh sách thay đổi có trước. Nếu branch/worktree không phù hợp, chuẩn bị checkout cô lập mà không reset, stash hoặc ghi đè công việc của user. Deploy đích vercel; không push master.
2. Ghi phiên bản Next/Node thực cài, lockfile và build đang đo; tìm docs bundled, nếu thiếu dùng docs chính thức đúng phiên bản. Không tự nâng dependencies.
3. Tạo thư mục bằng chứng `plans/scroll-media-20260912/` cho báo cáo đã loại secrets. Snapshot DB nguyên bản, signed URL và thông tin truy cập lưu ở thư mục ngoài git phù hợp, chỉ ghi vị trí lưu an toàn vào báo cáo.
4. Tái sử dụng `scripts/audit-live-performance.cjs` sau khi đọc script. Bổ sung kịch bản scroll riêng nếu thiếu; không chạy bất kỳ endpoint tạo booking/mail nào để đo media.
5. Capture cold/warm riêng, desktop 1440×900 và mobile 390×844, mobile 1.6Mbps/150ms/CPU 4x. Ghi URL route, build/SHA biết được, cache bật/tắt, số mẫu; không khẳng định production trùng local HEAD nếu chưa xác minh.
6. Lưu baseline: request URL đã sanitize, initiator, thời điểm, bytes có thể đo, MIME/cache headers, element/section, active scene và video playing. Resource Timing cross-origin bằng 0 không phải file 0 byte; dùng response headers/network capture khi có quyền.

Đầu ra W0: `execution-report.md`, `baseline.json`, danh sách file được phép sửa theo package. Nếu chưa truy cập được cấu hình live, vẫn hoàn tất phân tích local nhưng W1 phải báo chưa có inventory; không thay thế bằng dữ liệu mẫu.

### 6.3. W1 — Inventory History chính xác, không sửa dữ liệu

Nguồn đọc ưu tiên: endpoint admin History đã xác thực hoặc SELECT read-only đúng `SystemConfigs.key = brand_history` với quyền đã có. `src/app/layout.tsx` truyền trực tiếp cấu hình này vào SystemSettingsProvider; dùng để đối chiếu nguồn hiển thị. Không lấy `/api/public/site-content` làm nguồn duy nhất do khác biệt sanitizer đã nêu tại mục 3.1.

1. Lưu snapshot và revision/hash canonical của cấu hình nguyên bản. Không gọi `hydrateBrandHistoryConfig()` rồi lưu ngược: hàm này thêm defaults và có thể làm đổi nội dung ngoài URL.
2. Duyệt có chủ đích `hero.image`, `chapters[].scenes[].image`; xác minh schema live trước. Nếu thấy field media khác, ghi riêng và chỉ đưa vào khi xác nhận nó là ảnh History đang hiển thị. Không replace đệ quy mọi chuỗi URL toàn JSON.
3. Với mỗi tham chiếu ghi JSON pointer cùng chapter/scene ID nếu có. Dedupe URL chính xác; không bỏ query tùy tiện. Signed/transformed URL phải được xác minh object gốc, không đoán đường dẫn.
4. Lấy metadata đọc-only của ảnh, ghi lỗi/redirect/quyền truy cập. Phân biệt ảnh local, Supabase và host khác. Chỉ Supabase History thuộc migration này; ảnh fallback local để package riêng.
5. Manifest bắt buộc có các trường sau; thêm trường chứ không bỏ thông tin cần rollback:

```json
{
  "runId": "history-webp-<timestamp>",
  "sourceConfigRevision": "<canonical-hash>",
  "entries": [{
    "sourceUrl": "<public-url-or-private-reference>",
    "bucket": "<verified-bucket>",
    "sourcePath": "<verified-object-path>",
    "references": [{"pointer": "/chapters/0/scenes/0/image", "chapterId": "<id>", "sceneId": "<id>"}],
    "sourceMime": "image/png",
    "sourceBytes": 0,
    "width": 0,
    "height": 0,
    "sourceSha256": "<hash>",
    "targetPath": null,
    "targetUrl": null,
    "targetBytes": null,
    "conversionOptions": null,
    "status": "inventoried"
  }]
}
```

Số 0 trong mẫu chỉ là placeholder, phải thay bằng giá trị đo; không điền 0 cho dữ liệu không biết, dùng null kèm lý do. Manifest có URL private/signed phải ở khu vực ngoài git; bản báo cáo sanitize chỉ giữ object reference không chứa credentials.

Đầu ra W1: snapshot an toàn, manifest, tổng unique objects/tham chiếu/bytes đã biết và danh sách bị loại. Điều kiện sang W2: đã xác minh đúng nguồn và ảnh tải đọc được.

### 6.4. W2 — Chuyển ảnh và chuẩn bị upload có thể tiếp tục sau gián đoạn

Agent tạo script chuyên biệt, dự kiến `scripts/migrate-history-webp.mjs`; tên có thể khác nhưng hành vi phải tương đương. Không chạy chuyển ảnh trong render Next hoặc gửi ảnh qua API booking. Dùng Sharp đã có trong môi trường nếu phù hợp; không thêm dịch vụ convert bên ngoài.

Script phải tách các chế độ rõ ràng: `inventory`, `convert`, `verify-local`, `upload`, `prepare-update`, `apply`, `verify-live`, `rollback`. Mặc định read-only/dry-run; chỉ các mode upload/apply/rollback mới được ghi khi đang ở nhiệm vụ triển khai đã được giao. Không có hành vi tự upload khi import module. Không hardcode credentials; không truyền secrets trong command line.

1. Download có timeout, kiểm tra status/MIME/decoder, hash bytes; xử lý từng ảnh hoặc concurrency tối đa 2 ban đầu. Lỗi một ảnh phải ghi status, không ghi file rỗng vào pipeline.
2. Tạo candidate lossless giữ nguyên kích thước; có thể tạo thêm WebP lossy quality 90/85 để so sánh. Chỉ chọn candidate nhỏ hơn và đạt QA; không cam kết tỷ lệ nén trước. Không đổi kích thước/crop/artwork. Nếu animated input hoặc color profile cần xử lý đặc biệt, tách kiểm tra, không âm thầm lấy frame đầu hoặc làm đổi màu.
3. QA ảnh thật bằng view_image hoặc công cụ xem phù hợp: toàn ảnh và chi tiết mặt/chữ/logo. Với lossless, so decoded pixel và alpha; RGB khác ở pixel hoàn toàn trong suốt không đồng nghĩa thay đổi hình nhìn thấy. Với lossy, ghi lựa chọn và nhận xét nhìn thấy, không gọi pixel-identical.
4. Tính hash output; target path `history/<safe-name>-<output-hash>.webp`. Ghi tham số encode, bytes và hash vào manifest. Không ghi đè nguồn hoặc convert lại WebP nhiều lần.
5. Upload với contentType image/webp, upsert false, cacheControl phù hợp URL content-hash. Nếu object đã tồn tại sau resume, xác minh đúng nội dung/metadata rồi reuse; không mặc định overwrite khi 409.
6. Sau upload, đọc URL và giải mã lại để kiểm tra; so hash khi endpoint cung cấp bytes gốc, hoặc ghi rõ transformation nếu có. Chỉ status `uploaded_verified` mới được dùng để thay URL. Retry giới hạn cho timeout/5xx; 401/403 thì dừng phần cần quyền, không nới policy.

Đầu ra W2: file WebP đã QA, manifest cập nhật và bảng bytes trước/sau. Upload một phần chưa làm thay đổi website. Nếu phải dừng, giữ các object mới để resume; không tự dọn bằng remove toàn thư mục.

### 6.5. W3 — Áp dụng URL, chống ghi đè và rollback

**Điểm cần xử lý thật:** route `/api/admin/history` hiện so revision bằng read-then-write, chưa phải compare-and-swap nguyên tử; route `/api/admin/system-settings` hiện không đọc expectedRevision gửi từ editor. Không được mô tả một lần GET trước POST là bảo đảm chống mọi concurrent write.

1. Đọc config hiện hành; dựng bản mới bằng deep clone của đúng bản này. Chỉ apply entry `uploaded_verified`, mỗi pointer phải vẫn trỏ URL gốc và ID tương ứng. Nếu scene bị đổi/reorder thì remap theo ID đã xác minh hoặc đánh dấu conflict, không áp theo index cũ.
2. Xuất diff dữ liệu trước ghi. Gate: chỉ các trường URL đã cho phép thay đổi; mọi field khác deep-equal. Dừng nếu có thay đổi text/array order/unknown field.
3. Thực hiện ghi có điều kiện nguyên tử theo giá trị/revision hiện hành bằng cơ chế DB được hỗ trợ, sau khi xác minh schema/type thực tế. Yêu cầu update đúng một row key brand_history và predicate khớp snapshot hiện hành, trả row đã cập nhật. Không giả định cột revision tồn tại, không tự tạo migration rộng. Nếu công cụ chỉ cho POST read-then-write, phải ghi rõ hạn chế và giải quyết quyền truy cập/cơ chế ghi trước khi claim chống xung đột; không bỏ qua gate.
4. Nếu update trả zero rows/conflict, đọc lại và chuẩn bị diff mới; không retry ghi mù payload cũ. Giới hạn retry, lưu conflict report.
5. Giữ chức năng revision/audit và revalidation hiện hành qua luồng hỗ trợ; nếu ghi DB trực tiếp, chuẩn bị cách revalidate có xác thực phù hợp và kiểm tra fresh navigation thật. Không tạo endpoint revalidate public hoặc ghi lại config lần hai chỉ để kích hoạt cache.
6. Đọc lại DB, kiểm tra URL và các field không thuộc scope; kiểm tra browser render từ cấu hình mới. Chỉ sau bước này mới đánh dấu applied.
7. Rollback cũng dùng read + conditional write nguyên tử: đảo URL mới về cũ chỉ khi pointer/ID vẫn khớp mapping của run; giữ thay đổi admin mới. Nếu đã đổi sang URL thứ ba thì báo conflict, không ghi đè. Không xóa object trong rollback.

Đầu ra W3: diff trước ghi, bằng chứng affected row, revision sau ghi, QA live và mapping rollback. Không commit snapshot private vào repo. Chưa có điều kiện ghi an toàn thì báo phần bị chặn, không sửa rộng admin để che vấn đề.

### 6.6. W4 — Sửa History và ảnh homepage theo viewport (`done`)

Phạm vi file chính: `src/components/History/History.tsx`, CSS Module History chỉ khi cần giữ kích thước khung; `src/app/page.tsx`, `src/app/[lang]/LocalizedHomePageClient.tsx`, `src/app/history/page.tsx` chỉ truyền ngữ cảnh; `OurStory.tsx` và `Footer.tsx` chỉ phần img được chỉ định. Giữ WebP chatbot đã hoàn thành.

1. Thêm prop rõ nghĩa như `aboveFold?: boolean`, mặc định false cho History; truyền true ở `/history`, false ở homepage/locale homepage. Dùng prop cho ưu tiên hero History; không lazy hero đầu viewport của route riêng.
2. Bỏ state/effect cacheBuster và logic nối timestamp. Giữ normalizeHistoryImagePath cho fallback cũ, để remote URL và URL WebP nguyên trạng. Không đổi dữ liệu lịch sử trong code.
3. Tạo helper viewport phạm vi media, dự kiến `src/lib/media/useMediaViewport.ts`. Quan sát wrapper kích thước ổn định, không quan sát node ảnh chưa tồn tại. Near = viewport mở rộng 600px, visible = giao viewport thật; hỗ trợ scroll root. Không lặp query document toàn trang cho mỗi media hoặc thêm listener scroll mỗi ảnh.
4. Trạng thái ảnh: chưa eligible thì không gắn src/srcset/source; khi near thì active scene eligible; giữ các ảnh đã load khi rời viewport. Giữ các wrapper scene và class transition hiện có. Không dùng opacity như cơ chế ngăn request.
5. Chỉ prefetch một next scene của chapter đang visible sau khi active scene đã sẵn sàng. Không prefetch mọi chapter near; thumbnail gắn nguồn khi dải thumbnail gần màn hình, không preload toàn bộ file gốc từ thumbnail. Dedupe khi thumbnail và scene dùng cùng URL.
6. Khi chọn scene chưa tải, giữ frame trước trong lúc chuẩn bị frame mới, sau đó chạy transition hiện có; load/decode callback cũ bị vô hiệu khi lựa chọn đổi. Nút/keyboard vẫn phản hồi; lỗi ảnh không được kẹt toàn carousel.
7. Thay effect `chapters.forEach(restartSceneTimer)` đang khởi động mọi timer bằng timer cho chapter visible và tab foreground. Không đổi thời lượng 3600ms. Manual next/select chỉ restart nếu đủ điều kiện; rời vùng/tab ẩn thì clear; quay lại giữ scene đã chọn.
8. OurStory city/footer dưới fold: lazy + async decode phù hợp; nếu gate yêu cầu không request ngoài vùng đệm thì dùng helper thay vì chỉ native lazy. Giữ class, filter, dimensions, watermark và caption. Không đổi globals.css hoặc container layout.
9. Không bật optimizer remote hàng loạt để hoàn thành W4: WebP URL trực tiếp có thể dùng trước; responsive/next-image cold-path thử riêng theo mục 3. Không mở rộng remotePatterns thành mọi host.

Đầu ra W4: diff nhỏ, test state/cache/priority và trace scroll. Test helper các case near→visible→far→back, src đổi trong lúc decode, scene click nhanh và cleanup. Không viết test chỉ tìm chuỗi thuộc tính rồi coi là nghiệm thu network.

### 6.7. W5 — Lifecycle video và rollout theo route (`done` trên local)

Tích hợp theo thứ tự Hero → Space → FarmStore; kiểm tra từng route trước tiếp. Xác định route từ source đang dùng thật, bỏ qua file bản sao. Component video dùng chung có thể đặt `src/components/Shared/ViewportVideo.tsx` nếu adapter nhỏ phù hợp; không ép thay Hero có state retry phức tạp bằng component mới toàn bộ.

1. Near nhưng chưa visible: chuẩn bị source/poster có kiểm soát, autoplay false; far chưa xem thì source và poster URL chưa được gắn. Hero active đầu viewport là ngoại lệ tải ngay.
2. Visible + tab foreground: gọi play, catch rejection, giữ điều khiển user. Invisible: pause ngay và ngừng timer đổi slide. Lưu riêng pause theo policy để không biến thành lỗi mạng trong retry/first-frame state Hero.
3. Far hơn 2 viewport liên tục 15s: với video trang thông thường, lưu currentTime, bỏ src và source con rồi gọi load; giữ wrapper và state. Quay lại trước hạn phải hủy timer unload. Không unload video user đang điều khiển/PiP hoặc hero trong đợt đầu nếu chưa kiểm chứng tương thích retry.
4. Resume sau unload: attach URL đúng generation, chờ metadata, clamp currentTime trong seekable/duration hợp lệ rồi play nếu vẫn visible. Không dùng event của src cũ để update state mới.
5. Space: xác minh component MediaRenderer đang khai báo trong parent có gây remount theo state; nếu có, chuyển định nghĩa ra module scope và truyền dependency tường minh, giữ output/styles. Timer ảnh 6s và video onEnded chỉ đổi tab khi section visible. Không đổi navigation/reveal observer ngoài nhu cầu media.
6. FarmStore: gate các video story/gallery phía dưới, bảo toàn muted/loop/object-position và kiểu hiển thị. Không thay video thành ảnh hoặc bỏ media do tối ưu.
7. Nếu IntersectionObserver thiếu, dùng fallback chức năng lazy/native và playback an toàn; không để media trống vĩnh viễn. Ghi giới hạn fallback, không claim strict network gate ở môi trường không hỗ trợ.

Đầu ra W5: request/playing trace theo viewport, test timer unload được hủy, resume/src race, tab background và Safari. Không hứa browser sẽ giữ video buffer sau unload; report phần đo được.

### 6.8. W6 — Ma trận nghiệm thu, bàn giao và định nghĩa hoàn tất (`local verification done`)

| Case | Thao tác | Bằng chứng pass |
| --- | --- | --- |
| Cold homepage | Mở mới, không scroll | Hero đúng cấu hình; History/footer xa không request; không timestamp ngẫu nhiên. |
| Route History riêng | Mở `/history` trực tiếp | Hero History tải ngay, scene dưới fold được gate. |
| Scroll chậm | Cuộn từng 0.5 viewport, dừng 2s | Request bắt đầu trong vùng cho phép; active scene hiện, không tải mọi slide ẩn. |
| Scroll nhanh/anchor | Nhảy xuống cuối và chapter giữa | Đích được ưu tiên; không enqueue mọi phần đi qua; không mất nội dung. |
| Scroll ngược | Xuống rồi lên 3 vòng, cache bật | URL ổn định; ảnh đã xem không bị tháo/lắp lặp vô ích; video pause/resume đúng. |
| Carousel race | Next/back nhanh, đổi scene đang tải | Frame cuối đúng lựa chọn; event cũ không ghi đè; caption và ảnh khớp. |
| Tab background | Ẩn tab rồi quay lại | Timer/playback dừng theo policy; không retry giả hoặc nhảy scene hàng loạt. |
| Unload | Ra xa >15s rồi quay lại; lặp case <15s | Unload chỉ case đủ điều kiện; quay lại sớm hủy timer; resume hợp lệ. |
| Lỗi media | Giả lập 404/timeout/play bị từ chối | Không infinite retry, không kẹt carousel; phần còn lại tương tác được. |
| Admin concurrent | Dùng fixture/test an toàn mô phỏng revision đổi | Apply/rollback conflict không ghi đè bản mới; không thử phá config live. |
| Regression chung | Locale, thumbnail/preview, cart rỗng/có hàng, checkout, book Back | Không mất badge/caption/filter/layout/state; không tạo booking thật để test media. |

1. Chạy type/lint/build đúng tooling sau đọc package; nếu baseline đã lỗi, ghi command và lỗi sẵn có, không tự sửa ngoài scope. Với docs-only không cần chạy app tests.
2. Rà toàn bộ diff từng dòng, bao gồm asset paths và config diff. Chỉ stage explicit paths thuộc package; không git add toàn worktree.
3. Trước deploy, kiểm tra build/preview của phần đã sửa và branch vercel. Chỉ deploy nếu nhiệm vụ triển khai đã bao gồm publish; bản plan hiện tại không yêu cầu publish.
4. Sau deploy, xác minh URL/build thật, chạy cùng kịch bản cold/warm và kiểm tra CDN MIME/cache headers. Không kết luận chỉ từ local.
5. `execution-report.md` phải ghi: trạng thái W0–W6; file/code commit; số ảnh/bytes trước-sau; vị trí snapshot an toàn; mapping public đã sanitize; QA pass/fail; metric median/range; lỗi còn lại; cách rollback code riêng với dữ liệu.
6. Hoàn tất chuyển ảnh khi W1–W3 đạt gate; hoàn tất toàn plan khi các package được user giao đều đạt gate. Nếu chưa giảm first-frame/LCP đủ mục tiêu, báo số thực và nguyên nhân chưa rõ, không báo đã fix toàn bộ chỉ dựa vào giảm dung lượng WebP.

## 7. Giới hạn và nguồn

Phân tích dựa trên source hiện tại + kích thước asset local, kết quả chuyển chatbot và execution report W0–W3. Metrics live kế thừa báo cáo `plans/PERFORMANCE_LIVE_RESEARCH_AND_ACTION_PLAN_20260911.md`; chưa đo lại deploy hiện tại hoặc chứng minh LCP/first-frame đã cải thiện. Thư mục `node_modules/next/dist/docs/` không tồn tại trong workspace lúc kiểm tra; package khai báo Next ^15.5.14. Trước viết code tiếp theo xác minh phiên bản cài và đọc guide tương ứng.

- Next Image v15 (lazy, priority, sizes, unoptimized): https://nextjs.org/docs/15/app/api-reference/components/image
- IntersectionObserver và rootMargin: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
- Supabase Standard Uploads (khuyến nghị đường dẫn mới tránh stale CDN khi overwrite): https://supabase.com/docs/guides/storage/uploads/standard-uploads
