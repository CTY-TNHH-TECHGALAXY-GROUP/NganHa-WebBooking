# Hoàn tất P0 / P1 / P2 với 4 subagent

> Phạm vi đã được thay thế: dùng [plan hiện hành](./GO_LIVE_FINAL_STEPS_20260908.md). Admin web chỉ quản lý content/media/SEO; không triển khai mục 5/migration/điều phối trên DB chung. Giữ tài liệu này làm lịch sử bàn giao; không chạy lại các worker theo chỉ dẫn cũ.

Ngày: 2026-09-08.
Trạng thái: PLAN, chưa thực thi, chưa dịch/seed/deploy trong lượt lập kế hoạch này.
Báo cáo đầu vào: `plans/GO_LIVE_RECHECK_20260908.md`.
Tài liệu này thay phân công cũ khi chạy đợt sửa tiếp theo.

## 1. Kết quả phải bàn giao

1. Booking atomic, chống trùng mã và idempotency hoạt động thật trên staging; RPC chỉ server được gọi.
2. Checkout đúng giờ Việt Nam, không hydration error, validation rõ ràng, không sửa nhầm hồ sơ khách.
3. Giá VND/USD và phụ phí nhất quán giữa catalog, cart, reprice, xác nhận và dữ liệu lưu.
4. Nội dung public thuộc P2 được dịch đầy đủ VI/EN/JP/KR/CN, không chỉ heading; nội dung hiện hữu xuất hiện đúng ở admin và chỉnh sửa/lưu/preview được.
5. Sửa ảnh History 404, logo mobile chồng BOOK, URL demo và cấu hình Tablet Continue chưa nối.
6. Có bằng chứng test thực, danh sách chưa test và điều kiện cho phép release.

Quyết định dữ liệu và test bắt buộc: giữ nguyên toàn bộ giá thật đang có trong bảng
`Services`; không migration, seed, reprice test hay fixture nào được update giá thật.
Mọi test ghi dữ liệu phải chạy trên mock hoặc database staging cô lập. Địa chỉ
`nghik22@gmail.com` được phép dùng cho tối đa một bài test notification có kiểm soát
sau khi booking test đã được đánh dấu/cô lập; không gửi concurrency, retry hàng loạt
hoặc dữ liệu khách thật tới địa chỉ này.

Không tự mở thanh toán trước, realtime giữ phòng/KTV, màn hình hai sách menu hoặc chatbot.
Giữ Google badge, video hero homepage, theme, media/watermark từng khung và các luồng giỏ đã được duyệt.
Không xóa `.env.local`, không in secret, không chạy migration/seed hoặc gửi email production khi chưa được phê duyệt.
Đây là 4 worker; người điều phối hiện tại merge và nghiệm thu, không tạo worker thứ năm.
Luna/Terra là nhãn phân công, không phải tuyên bố công cụ tự chọn được model mang tên này.

## 2. Baseline trước khi chạy song song

Người điều phối thực hiện một lần:

- Đọc `AGENTS.md`, `README.md`, `DEVELOPMENT_NOTES.md` và guide Next liên quan trước khi sửa code.
- Kiểm tra lại git status/branch; hiện có nhiều thay đổi local và branch đang là `master`, không tự bỏ chúng.
- Chốt snapshot có đầy đủ thay đổi local đã review. Không chỉ tạo worktree từ HEAD vì sẽ bỏ sót các sửa chưa commit. Không tự `git add .`, commit secret hoặc đổi branch deployment.
- Chia 4 worktree từ cùng snapshot, ghi baseline SHA vào handoff. Mỗi worktree có `.next`, node_modules và port riêng nếu cần chạy đồng thời; không dùng chung thư mục output.
- Gán port 3101/3102/3103/3104; kiểm tra trước, nếu có process khác dùng thì chọn port khác. Không kill process không thuộc agent.
- Chốt API/RPC fixtures mục 4; test data dùng prefix duy nhất theo run và chỉ ở DB staging được chỉ định.
- Xác nhận DB test độc lập production. Không có staging thì agent làm code/mock và ghi BLOCKED cho integration, không ghi PASS giả.
- Giữ giá VND và USD hiện có trong `Services` như hai giá catalog độc lập trong đợt sửa này. Không tự tính lại toàn catalog theo tỷ giá 24.000. Nếu chủ web muốn quy đổi tự động, cần quyết định riêng trước release. Không agent nào được update giá thật trong DB.
- Khung giờ nhận lịch và giới hạn booking phải kiểm kê và chốt giữa UI/API; không tự suy luận từ văn bản giờ mở cửa. Chưa chốt thì ghi một business blocker cụ thể.

## 3. Bốn agent và quyền sở hữu

| Worker | Phạm vi | Sở hữu file chính | Không sửa |
| --- | --- | --- | --- |
| Terra-1 | P0 database, transaction, ACL, customer atomic | `supabase/migrations/*atomic_booking*`, `supabase/verification/*atomic_booking*`, SQL test/preflight/rollback mới thuộc booking | API TypeScript, CMS seed, frontend |
| Terra-2 | P1 API, validation, giá server, idempotency, mail | `src/app/api/bookings/**`, `src/lib/mailer.ts`, helper server mới trong `src/lib/booking/`, test API/mail | SQL atomic, admin content, checkout UI, cart storage |
| Luna-1 | P2 dịch 5 ngôn ngữ + admin + History media | `src/components/PureRelaxation/**`, `src/app/admin/services/pure/**`, `src/app/admin/services/page.tsx`, `/api/services`, `/api/admin/services/[id]`, `/api/admin/content`, `src/components/History/**`, `src/app/admin/history/**`, helper/editor content riêng, seed content riêng | booking API/SQL, checkout/Header/global settings |
| Luna-2 | P1 checkout/time/currency client, P2 navigation/demo/CTA | checkout page/CSS, `src/components/Checkout/**`, `src/components/Menu/MenuContext.tsx`, `src/lib/bookingCartStorage.ts`, `src/lib/paymentConstants.ts`, Header/CSS, middleware, demo routes/assets, system-settings UI/API, URL helper, sanitizer | Pure/History/content API, booking API/atomic SQL |

Các đường dẫn viết tắt `/api/...` nằm dưới `src/app`. Ownership chỉ áp dụng file thực sự cần sửa, không cho phép refactor cả thư mục.

### File dùng chung và ranh giới dữ liệu

- `SystemSettingsProvider.tsx` và `siteContentSanitizer.ts`: Luna-2 duy nhất.
- `src/app/api/public/site-content/route.ts` và `src/lib/api/contentRevision.ts`: Luna-1 nếu cần cho CMS invalidation/revision; không thay bộ lọc secret do Luna-2 quản lý.
- `src/components/TranslationProvider.tsx`, dictionary dùng chung, `package.json`, lockfile, root layout/config, `.env.example`: người điều phối. Worker đề xuất patch riêng, không sửa đồng thời.
- Nếu có file service editor thực tế ngoài danh sách, Luna-1 xác định caller rồi xin điều phối bổ sung ownership trước khi sửa.
- Seed nội dung dùng `supabase/seeds/go_live_content_i18n_20260908.sql`: Luna-1. Terra-1 không sửa file đó.
- Seed reception nếu còn cần dùng file khác, Terra-2 sở hữu; không đụng seed CMS.
- Không đổi schema/cột giá `Services` hay API catalog contract đơn phương. Luna-1 sở hữu adapter; Terra-2 và Luna-2 dùng fixtures catalog thống nhất.
- Mỗi agent ghi `plans/handoffs/<worker>.md`; test/screenshot đặt trong thư mục riêng theo worker/run.

Phát triển song song độc lập qua fixtures/mocks. Không import helper chỉ tồn tại trên nhánh khác.
Helper lịch canonical do Terra-2 bàn giao; Luna-2 dùng cùng contract qua adapter hiện có, điều phối nối import khi merge.
Mọi thay đổi contract được ghi và duyệt trước, không tự tạo một response shape khác.

## 4. Contract bắt buộc trước khi code

### 4.1 Locale, content và admin

- Internal keys giữ `vi`, `en`, `jp`, `kr`, `cn`; không đổi DB thành `zh/ja/ko` trong đợt này.
- Admin có 5 tab ký hiệu VI / EN / JP / KR / CN, dùng đúng style tab hiện hành. Nội dung từng tab là bản ngôn ngữ đó, không chép VI/EN vào tab khác để giả đủ coverage.
- UI shell admin có thể giữ tiếng Việt. Yêu cầu 5 ngôn ngữ áp dụng nội dung public và các field biên tập của nó, không bắt buộc dịch toàn bộ hệ quản trị.
- Tên/mô tả/giá/thời lượng dịch vụ: `Services`, không tạo catalog thứ hai trong CMS.
- Media, editorial, privilege, caption theo khung: tái sử dụng `WebBookingContent`, key `pure_relaxation_media`, giữ khóa media cũ ổn định khi đổi ngôn ngữ.
- Tên cột dịch vụ: `nameVN/nameEN/nameJP/nameKR/nameCN`; description là JSON đa ngôn ngữ, đọc tương thích `vi/vn/VN` và các legacy key đang có. Không xóa key cũ hàng loạt.
- Public và admin dùng cùng resolver cho nội dung hiệu lực: giá trị đã lưu của locale -> default đã dịch của locale -> fallback legacy được xác định rõ. Chuỗi rỗng có chủ đích không bị thay lại bằng default.
- Default hiển thị ngay trong input/editor và preview khi DB thiếu field, không chỉ nằm trong placeholder. Mở admin không tự ghi DB.
- Seed chỉ bù field nội dung thiếu/null theo manifest đã review; tuyệt đối không seed/update `priceVND`, `priceUSD`, duration hoặc trạng thái service. Giá trị hiện có, chuỗi rỗng chủ đích, ảnh/video, vị trí crop, watermark và định dạng đoạn phải được giữ.
- Field intentionally empty được đánh dấu riêng khỏi missing; mọi field cần dịch phải có coverage hoặc explicit exemption. Brand, ID, số tiền không phải untranslated bug.

### 4.2 Booking, RPC và replay

Giữ caller checkout tương thích. Kiểm kê aliases hiện hành trước khi siết validation.

```text
create_booking_atomic(
  p_booking_data JSONB,
  p_booking_items JSONB,
  p_idempotency_key TEXT DEFAULT NULL,
  p_booking_id TEXT DEFAULT NULL
)

success: { booking_id, bill_code, idempotent, data: persisted_booking_snapshot }
400: VALIDATION_ERROR + fieldErrors (field paths ổn định, dịch ở client)
409: CART_REQUIRES_REVIEW / PRICE_CHANGED / IDEMPOTENCY_CONFLICT
503: BOOKING_TEMPORARILY_UNAVAILABLE
```

- Chốt exact shape của `data` bằng fixture từ response checkout hiện tại, không chỉ interface mới.
- ID/key/status/source/branch/prices không được browser tự quyết định. Đơn nhận là `NEW`; tiền đã trả là 0, không tin client báo paid.
- Request fingerprint do server tính từ yêu cầu đã normalize, không từ timestamp, tên dịch theo locale hoặc giá catalog đang biến động. Quy định rõ field nghiệp vụ nào tạo booking khác; đổi UI locale không tạo trùng đơn.
- Quote/version được server phát hoặc ký từ kết quả reprice; không tin hash hoặc giá browser. Trước commit so sánh giá/duration/addon hiện tại với quote. Chênh lệch trả 409 kèm canonical data, khách xác nhận lại.
- Replay cùng key + cùng intent trả snapshot đã lưu, kể cả catalog đổi hoặc thời gian hẹn vừa trôi qua; không dựng lại theo catalog mới, không gửi mail lần nữa. Replay khác intent phải conflict, không lộ booking người khác chỉ nhờ đoán key.
- RPC kiểm tra giá cuối cùng trong transaction; response/email lấy snapshot commit, không dùng total đã tính trước RPC nếu nó khác.
- Không ghi Customers trước booking commit. Resolve/create/link trong transaction do Terra-1 triển khai; booking giữ thông tin khách gửi. Không update hồ sơ hiện hữu bằng payload chưa xác minh; Terra-2 gỡ nhánh ghi đè sau RPC.
- Thiếu schema/ACL sai: fail closed, giữ cart, không fallback max+1, không insert parent/child riêng hoặc compensating delete.

### 4.3 Lịch và tiền

- Appointment date/time luôn là giờ spa `Asia/Ho_Chi_Minh`; timezone thiết bị chỉ phục vụ hiển thị nếu có nhu cầu rõ ràng.
- SSR và lần render client đầu tiên dùng cùng mốc thời gian hoặc trạng thái chờ ổn định, không gọi local clock tạo hai cây HTML khác nhau.
- Revalidate thời gian khi mở lại tab, đến ranh giới slot và trước submit. Nếu giờ đã chọn hết hạn, bỏ chọn/thông báo theo locale; không âm thầm đổi cuộc hẹn của khách.
- Phụ phí phòng riêng đọc `NHS0900` active, VND và USD theo DB. Không fallback 105.000/5 USD khi addon thiếu hoặc ngừng hoạt động.
- Chọn private room -> thêm phụ phí đúng một lần mỗi đơn vị; chỉnh qty/options/variant và reprice cùng công thức. Không tạo thêm dòng phí trùng từ hai nơi.
- Giá USD hiện là catalog-authored: không suy ra `VND / 24000`, không đổi giá đã lưu. Bỏ thông tin tỷ giá gây hiểu lầm trên bề mặt đang dùng hoặc tách rõ tỷ giá thu ngân đã được chủ web duyệt; không coi 24.000 là tỷ giá thị trường. Test chỉ đối chiếu/read-back giá, không sửa giá DB thật.
- API booking và tiền gốc vẫn VND theo schema hiện tại; USD là giá tham khảo catalog, không ngầm tạo FX/payment engine.

## 5. Terra-1: database an toàn

1. Inventory read-only theo từng environment: columns/indexes/constraints/RPC overloads/ACL/counter, duplicate mã/key, schema Customers và BookingItems. Ghi timestamp; không chỉ dùng sự có mặt của file SQL làm bằng chứng.
2. Kiểm tra migration đã apply ở đâu. Environment chưa apply dùng bản đã review; nơi đã apply cần forward migration, không sửa lịch sử rồi giả đồng bộ.
3. Preflight duplicates hoặc FK không tương thích phải dừng; không tự xóa record thật. Additive columns cho dữ liệu cũ, fingerprint và index idempotency đúng semantics null/empty.
4. Bọc tạo RPC + revoke/grant trong cùng transaction. Revoke PUBLIC/anon/authenticated trên tất cả overload liên quan, grant server-only, qualify object names và cố định search_path. Counter không được client ghi trực tiếp.
5. Counter/unique constraints/locking phải chống concurrent writer, không cắt số khi vượt 999. Cùng key serialize, khác key không tạo trùng mã. Không giữ logic max+1 không khóa.
6. Resolve customer + booking + items trong một transaction; bảo toàn hồ sơ có sẵn. Giá/status canonical và snapshot trả về đúng dữ liệu commit. Phối hợp quote/intent contract với Terra-2.
7. Sửa verifier: dùng `oidvectortypes(proargtypes)` cho type list, kiểm tra `proargnames` riêng; ACL kiểm tra effective privileges. Đừng phụ thuộc chuỗi format index có/không dấu quote.
8. Không tạo thêm bảng content. Counter kỹ thuật nếu cần dùng tên `Webbooking...`; không thêm bảng mới cho mọi vấn đề.
9. Bàn giao SQL apply, verify, rollback giữ dữ liệu, staging test runner và chiến lược ngừng writer cũ khi cutover. Không chạy production.

## 6. Terra-2: API, validation, privacy và mail

1. Xây schema validation theo caller thật; parser đã được kiểm thử cho phone/country, không tự viết parser quốc tế. Dependency mới phải qua điều phối.
2. Reject null/array/JSON sai, body quá lớn, tên/control chars sai, email sai, ngày không tồn tại, giờ quá khứ/ngoài lịch, guests không nguyên, quantity bool/lẻ/âm/0/vượt cap và alias mâu thuẫn.
3. Validate options trước `.some/.map`: arrays of enum strings, dedupe focus/avoid, không giao nhau; flags boolean; notes length/escape; kiểm tra tùy chọn dịch vụ thật sự hỗ trợ. Không tự loại lựa chọn khách một cách im lặng.
4. Normalize phone một lần cùng country explicit, không đoán lại từ locale. Chưa có OTP nên không tuyên bố đã xác minh khách.
5. Reprice/post cùng catalog và addon active; signed quote/version hoặc equivalent server-verifiable contract. Xử lý giá đổi giữa quote và transaction, không silently charge new price. Trong test dùng fixture/catalog staging, không đổi giá production.
6. Implement replay/conflict theo mục 4, retry không đổi key khi timeout/503. Gỡ toàn bộ update Customers.fullName từ input chưa xác minh. Booking snapshot tách khỏi master profile.
7. Response success chỉ sau commit, map lỗi có code ổn định không lộ SQL/secret/PII. RPC missing/schema missing là 503; lỗi dữ liệu là 400/409, không generic 500.
8. Email đọc snapshot commit, escape HTML, validate To/BCC, không log full PII. SMTP fail không làm booking đã commit thành thất bại; ghi trạng thái để retry có kiểm soát với mã hiện hữu. Replay không gửi lại. Sau khi mock PASS, chỉ được gửi một booking test tới `nghik22@gmail.com` khi đã xác nhận environment test; không dùng email này cho load test.
9. Kiểm tra reception setting/env presence, chuẩn bị patch/seed chỉ field cần thiết nếu thiếu; không tự tạo mailbox hay gửi thử người thật. Test transport mock tách biệt rõ ràng.

## 7. Luna-1: thực sự dịch đủ 5 ngôn ngữ và đưa vào admin

### 7.1 Inventory trước khi dịch

1. Xuất manifest field-by-field từ nội dung VI đang hiệu lực (CMS + catalog + defaults), không chỉ quét source. Giữ nguyên ý, thứ tự, đoạn, bullet; không thêm claim y tế/dịch vụ không có.
2. Đối chiếu từng section Pure: body-care, foot-care, ear-clean, barber, package, additional, vip-package. Section không có editorial không tự bịa thêm chỉ để đủ schema.
3. Manifest bao gồm name/description nhóm và variant, caption/tag/alt, privilege title/copy/time, eyebrow/headline/lead, signature, rows.title/text, body1/2/3, quote/pullQuote/pullSign, closing, finalBig/finalSmall, CTA, toast và empty/error/loading state.
4. Kiểm tra 14 NHP thiếu mô tả; xác nhận lại runtime scope. Không báo NHP chưa xuất hiện trong Pure là lỗi mất description NHS, nhưng vẫn hoàn thành các mô tả còn thiếu trong catalog admin.

### 7.2 Dịch và lưu mặc định

5. Giữ VI làm chuẩn, sửa typo chỉ khi đã được duyệt. Dịch toàn bộ phần còn thiếu sang EN, JP, KR, CN; review theo từng đoạn, không dùng bản tóm tắt làm bản dịch.
6. Giữ các bản dịch admin hiện có nếu đúng; chỗ cần chỉnh có diff VI-source/old/new và danh sách quyết định, không overwrite hàng loạt. Giữ Oria Spa, ID, currency, số phút và quyền lợi chính xác.
7. Đưa các bản dịch default có type vào source để render được khi CMS thiếu; dữ liệu thay đổi thường xuyên vẫn ưu tiên CMS/Services. Không hardcode giá/duration vào bộ dịch.
8. Chuẩn bị seed idempotent chỉ fill missing và manifest đếm số field dự kiến đổi; backup giá trị cũ theo record/path, review staging trước. Sửa ảnh History .jpg -> .png chỉ đúng path cũ được xác nhận hỏng, không thay ảnh admin đã chọn khác.

### 7.3 Admin có thể sửa đúng nội dung đang nhìn trên web

9. Form Pure có 5 tab nội dung; hiện đầy đủ giá trị đã lưu hoặc default cùng locale. Mọi field render trên public có input/editor tương ứng, gồm tiêu đề từng row và caption/tag, không chỉ headline/body.
10. Preview bằng cùng resolver/schema với public, giữ xuống đoạn/bullet; không bắt người dùng sửa JSON/HTML thô. Media preview giữ ảnh/video/crop/watermark hiện có.
11. Service description phải lấy từ `Services`; API `src/app/api/admin/services/[id]/route.ts` hiện chưa update `description`: bổ sung validate và lưu đúng JSON locale. Không lưu description vào CMS nhưng public lại đọc DB khác.
12. Giữ ranh giới quyền sửa dịch vụ và pricing hiện có; không mở thêm quyền cho user thường. `priceUSD` nếu cần chỉnh trong admin phải là field numeric riêng, không nằm trong dịch thuật. Luna-2/Terra-2 không sửa endpoint này.
13. Map legacy `quote/body1/body2` sang `pullQuote/rows` có tương thích; mọi nhánh frontend dùng dữ liệu đã resolve. Khóa media không đổi theo tên dịch hiển thị.
14. Save patch đúng locale/path, giữ siblings và unknown keys. Không upsert snapshot stale ghi đè cả JSON. Dùng version/conditional write atomic theo schema thực có; chưa có revision column thì thiết kế CAS trên giá trị baseline hoặc cơ chế tương đương được review, không chỉ read-merge-write có race.
15. Conflict admin trả 409 và giữ draft, cho reload/compare; lỗi 401/403/500 không báo success. Mở/chuyển tab không tự save. Refresh/cache invalidation phải làm public nhận cập nhật sau save.
16. Sửa History media path có bằng chứng; kiểm tra caption/label History 5 locale đang thiếu và cho admin hiện đúng field đã sửa. Các trang blog/Journey/Lost & Found đã có dịch: smoke 5 locale để phát hiện regression; scope bổ sung phải được điều phối gán file trước.

## 8. Luna-2: checkout, currency UI, responsive, CTA và demo

1. Sửa init date/strip/slots/hydration theo giờ spa; không che lỗi bằng `suppressHydrationWarning`. Nối helper server canonical khi tích hợp.
2. Hiển thị field errors theo 5 locale; 409 cho khách xem giá mới và xác nhận lại, 503/timeout giữ tên/cart/options và key. Không đổi phone country khách đã chọn khi đổi ngôn ngữ.
3. Sửa tất cả luồng cart dùng addon DB: add, edit, bulk options, replace duration, qty +/- và persisted cart. Reuse bookingCartStorage, không tạo store thứ hai. Đối chiếu số tiền với reprice fixture.
4. Giữ selected services thành từng dòng theo cartId/option như yêu cầu; không gộp người/option khác nhau. Quick-select hiển thị số lượng và Add another option cho service một/nhiều duration. Không tái tạo hook-order bug khi đóng/mở/đổi catalog.
5. Currency display theo contract; label quốc tế VND/USD rõ ràng, không đổi tiền chỉ vì đổi locale. QR TRANSFER chỉ thông tin, không popup hoặc yêu cầu trả trước.
6. Header có tracks ổn định để logo không đè BOOK/cart/lang/location; giữ tap target, menu, Google badge và responsive desktop/tablet/mobile. Không giảm font toàn web để che lỗi overlap.
7. Nối setting `tabletContinue` vào đúng action/QR tablet. Không tự thay Home action của desktop nếu khác semantics. Resolve locale template, validate protocol/URL, reject javascript/data/protocol-relative URLs.
8. Kiểm tra system settings save patch/secret filtering, reception email không xuất hiện public HTML/RSC/API. Không chạm content API của Luna-1.
9. Xóa đúng demo routes/asset còn dùng riêng demo, cập nhật links/sitemap/middleware cần thiết. Route retirement phải trả 404/410 thực; không chỉ 200 trang không tìm thấy. Không xóa `DesignYourJourneyDemoPage.tsx` nếu nó đang là production implementation.

## 9. Ma trận test nhiều tình huống

Mỗi dòng dưới là một nhóm test có kết quả riêng, không tick toàn nhóm chỉ từ một screenshot.
Fixtures ngày giờ dùng clock cố định, không phụ thuộc ngày chạy. Tuyệt đối không chạy concurrency/invalid-role write test vào production.

### Terra-1: database staging thật

| ID | Tình huống | Expected |
| --- | --- | --- |
| DB01 | Fresh schema + schema legacy chứa booking | Migration additive, dữ liệu cũ không đổi |
| DB02 | Apply lại và kiểm tra version/overload | Không tạo duplicate index/function, verifier PASS thật |
| DB03 | Duplicate bill/key có sẵn | Preflight dừng, không tự sửa/xóa |
| DB04 | anon + authenticated gọi mọi overload | Bị từ chối, không ghi bảng nào |
| DB05 | Client direct write counter/bookings qua đường mới | Không tạo bypass RPC/API |
| DB06 | 20 request khác key chạy đồng thời | 20 mã duy nhất, đúng số items/total |
| DB07 | 20 request cùng key cùng intent | 1 booking, cùng ID/snapshot, replay flag đúng |
| DB08 | Cùng key khác intent | 409 qua API, DB không đổi booking cũ |
| DB09 | Lỗi child/FK/service inactive trong transaction | Không parent/customer mới mồ côi, không partial items |
| DB10 | Seq 999/1000/1001 và qua ngày VN | Không truncate/collision/reset sai ngày |
| DB11 | Customer cũ cùng phone, tên gửi khác | Master profile không đổi, snapshot booking giữ guest mới |
| DB12 | Giá đổi giữa quote và commit | Conflict, không booking giá âm thầm mới |
| DB13 | Timeout sau commit rồi retry | Cùng booking, không double insert |
| DB14 | Legacy key thiếu fingerprint | Policy rõ ràng, không accept payload tùy ý |

### Terra-2: API unit/integration

| ID | Tình huống | Expected |
| --- | --- | --- |
| API01 | JSON hỏng/null/array/body quá lớn | 400/413, 0 DB write/mail |
| API02 | Tên VI/EN/JP/KR/CN, dấu nháy; tên rỗng/control | Hợp lệ hoặc field error đúng |
| API03 | Phone VN local/+84, JP/KR; prefix lặp/chữ/quá dài | Normalize chuẩn, invalid reject, không đoán theo locale |
| API04 | Email thiếu/sai/newline, note HTML/control/over limit | 400 hoặc escape đúng, không header/HTML injection |
| API05 | Qty 1/20/0/-1/1.5/21/true/NaN-like string; aliases lệch | Chỉ contract hợp lệ qua, không clamp |
| API06 | focus string/object/null/[number]/unknown/duplicate/overlap | Không 500, enum/type validation đúng |
| API07 | Addon false/true/"false", inactive/missing service | Không Boolean-coerce string, không fallback price |
| API08 | Date leap/non-leap/31-02, opening/closing, past slot | Client/server contract trùng, ngày sai reject |
| API09 | Tampered price/status/branch/paid/bookingId | Không điều khiển giá/trạng thái/mã server |
| API10 | RPC missing/permission error/DB timeout | 503 hoặc mapped error, không direct fallback |
| API11 | Retry sau price change/deactivation/appointment time | Replay đúng snapshot của intent cũ, không double mail |
| API12 | Quote hết hạn/giá đổi/canonical total | 409 review trước insert; success đúng snapshot commit |
| API13 | SMTP fail, retry notification, BCC reception | Booking vẫn success; retry cùng ID, không gửi trùng |
| API14 | Caller/locale/country permutations | Tương thích toàn caller đang hoạt động |

### Luna-1: dịch thuật + admin + media

| ID | Tình huống | Expected |
| --- | --- | --- |
| CMS01 | 5 locale x mọi section/service/variant/field trong manifest | Đủ bản dịch, không EN fallback ẩn lỗi; exemption rõ |
| CMS02 | CMS field missing/null/empty/custom | Admin và public cùng effective value, empty không bị phục hồi |
| CMS03 | Mở admin chưa seed | Input/editor có nội dung default thật, không chỉ placeholder |
| CMS04 | Edit từng locale -> save -> refresh -> public | Chỉ locale/path đó đổi, giữ đủ 4 locale còn lại |
| CMS05 | Đổi row title, caption, privilege, closing, quote | Mọi field hiện đúng ở public, không riêng heading |
| CMS06 | Service description 14 NHP và catalog đang có | DB persist đúng locale, names/prices/IDs/duration không đổi |
| CMS07 | Hai tab/2 admin sửa cùng record | Conflict được phát hiện, không lost update |
| CMS08 | 401/403/500/timeout khi save | Không success giả, giữ draft, retry có kiểm soát |
| CMS09 | Seed chạy hai lần + record custom | Lần 2 không đổi, không overwrite custom/empty/media |
| CMS10 | CMS cũ body1/quote/media keys | Legacy render đúng, không mất ảnh khi đổi locale |
| CMS11 | Ảnh/video/crop/watermark, media lỗi/chậm/rỗng | Giữ cài đặt, không ảnh default nháy trước media thật |
| CMS12 | History từng chapter/scene, request .jpg cũ | Không 404 mới, giữ custom image hợp lệ |
| CMS13 | Browser locale switch, reload, back/forward | Toàn vùng content đổi locale, không mất dữ liệu admin |
| CMS14 | Paragraphs/list/long JP/KR/CN text | Không gom thành một đoạn, không cắt chữ/tràn container |

### Luna-2: user flow và thiết bị

| ID | Tình huống | Expected |
| --- | --- | --- |
| UI01 | UTC/VN/LA/Tokyo x gần nửa đêm/cùng clock | Cùng ngày/slot spa, 0 hydration/pageerror |
| UI02 | Mở tab lâu/qua slot/ngủ máy rồi focus | Slot quá hạn được xử lý, cart không mất |
| UI03 | Single-duration add/qty 1->2->1/remove/reopen | Counter đúng, saved rows giữ tách, Add another option có |
| UI04 | Multi-duration + hai custom options khác nhau | Đúng từng duration/option/price, không gộp nhầm |
| UI05 | Private room on/off/qty/replace/bulk edit/reload/reprice | Tổng VND/USD đúng catalog và không cộng phụ phí hai lần |
| UI06 | Catalog chậm/empty/500/inactive/price changed | Không Hook error/free service; review/empty/error state rõ |
| UI07 | Double click/retry 503/offline/timeout sau commit | Một intent/key, giữ form/cart; success chỉ clear sau confirm |
| UI08 | Đổi locale khi đã chọn country + có cart | Country không reset, giá/ID/options giữ nguyên |
| UI09 | Width 320/360/390/430/768/1024/1440/1920 | Logo/actions không overlap; document overflow = 0 |
| UI10 | Touch/keyboard/tab/Escape/modal nested/200% zoom | Focus trap/return, không click xuyên, controls dùng được |
| UI11 | Tablet Continue custom/default/{lang}/external/invalid | Action + QR đúng semantics, protocol nguy hiểm reject |
| UI12 | QR TRANSFER và các phương thức khác | Chỉ xem, không popup/prepayment |
| UI13 | Demo direct URL + mọi internal caller/sitemap | Demo nghỉ hoạt động, production Journey vẫn 200/CTA đúng |
| UI14 | Admin logout/back/direct protected URL | Không sidebar/data lộ, redirect login |

### Kiểm thử tích hợp sau merge

- 5 locale x 3 viewport đại diện (390/820/1440) cho Pure, checkout, History và admin editor; screenshot + console + failed requests.
- Chromium và WebKit; Safari/iOS thật nếu có thiết bị. Không có thì ghi chưa test, không thay bằng một browser rồi đánh dấu mọi nền tảng PASS.
- E2E01: Admin sửa JP description + media caption -> public JP thấy đúng -> add cart -> đổi duration/options -> quote -> submit staging -> DB snapshot -> mail mock đúng nội dung/giá.
- E2E02: 20 concurrent requests cùng key qua API thật trên staging -> một booking, không trùng mail; khác key -> mã riêng.
- E2E03: Admin đổi giá/disable service sau khi khách mở cart -> 409, không insert, khách review và xác nhận lại.
- E2E04: API response mất sau commit -> retry -> cùng ID; profile customer cũ không đổi.
- E2E05: Admin CN save conflict/lỗi -> draft còn, public không nhận snapshot nửa chừng; reload không mất locale khác.
- E2E06: Production-like build không secret trong HTML/RSC/public APIs; reception chỉ server; negative role tests trên staging.

## 10. Bằng chứng và điều kiện nghiệm thu

Mỗi agent bàn giao:

```text
Agent / baseline SHA / final commit (nếu đã được phép commit)
Files changed / contracts changed / migrations or seeds needed
Test ID / environment / command / expected / actual / PASS-FAIL-NOT RUN
Screenshot + console/network logs cho UI
DB before-after counts và ACL results (đã ẩn PII/secret)
Known risks / blockers / next owner
```

Không dùng dấu PASS từ static grep/TypeScript để thay DB concurrency, authenticated CMS save hoặc browser interaction.
Build/lint/tsc chạy theo thứ tự trong từng worktree; không build và dev cùng ghi `.next`.
Lỗi/warning có sẵn phải ghi baseline, không sửa lan man để làm sạch report.
Không agent nào được push/deploy production độc lập trong đợt song song.

## 11. Thứ tự release và rollback

1. Bốn worker hoàn thành code/test riêng; người điều phối review diff/contract, merge tuần tự, nối shared helpers và dependency được duyệt.
2. Chạy build, lint, typecheck, toàn bộ test module. Preview dùng staging, mail mock.
3. Terra-1 apply migration staging, Luna-1 seed staging sau review, chạy suite integration ở trên. Các mục P0/P1 FAIL là NO-GO.
4. Kiểm tra đầy đủ 5 locale + admin round-trip. Chưa dịch đủ hoặc admin chưa lưu được thì P2 chưa DONE, không ghi báo cáo đã hoàn thành.
5. Xác nhận environment đích, DB backup, migration/seed exact files, reception mailbox/env và giờ nhận lịch. Phê duyệt production là bước riêng.
6. Nếu writer cũ không an toàn, đóng nhận booking trong cửa sổ cutover; migration hardened + ACL trước, deploy nhánh `vercel` sau. Không chạy migration nguy hiểm cũ rồi mới revoke ở file sau.
7. Seed production chỉ missing content đã review; verify row/path diff. Không chạy seed toàn bảng hoặc ghi đè content người dùng chỉnh trong lúc test.
8. Smoke production read-only trước; booking/email kiểm soát chỉ khi được phép, đánh dấu rõ test record và xử lý theo quy trình vận hành.
9. Theo dõi 400/409/503, SQL conflict/duplicate, SMTP, client errors và asset404; phân biệt validation hợp lệ với regression.
10. Rollback app về bản tương thích an toàn, giữ migration additive/dữ liệu booking; không quay lại fallback max+1. Rollback content chỉ path đã đổi và chỉ khi giá trị hiện tại vẫn là giá trị seed của run đó, không restore snapshot đè sửa mới.

GO khi: DB integration/ACL/concurrency PASS; API/customer privacy PASS; calendar/currency PASS; 5-locale CMS/public parity PASS; demo/asset/mobile/CTA fix được chứng minh trên deployment đích.
Thiếu chứng cứ thì NOT VERIFIED, không gọi là DONE.
