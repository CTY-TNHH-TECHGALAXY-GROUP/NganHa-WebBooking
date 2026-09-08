# Plan điều chỉnh go-live cho GPT Luna và GPT Terra

> Phạm vi đã được thay thế: dùng [plan hiện hành](./GO_LIVE_FINAL_STEPS_20260908.md). Các bước thêm schema/enum/index/counter/RPC và workflow điều phối không thuộc release web này. Tài liệu dưới đây là lịch sử, không phải lệnh triển khai.

Ngày đối chiếu: 2026-09-07. Baseline source: `05fce62` tại thời điểm rà soát.
Website đối chiếu: https://oria-spa.vercel.app. Branch triển khai theo repo: `vercel`.
Trạng thái tài liệu: P0 booking đã được harden ở source local; chưa chạy SQL production, chưa ghi CMS/DB production và chưa deploy.

## 1. Các quyết định mới của chủ website

Các quyết định dưới đây thay thế các đề xuất trái ngược trong báo cáo go-live cũ.

| Phản hồi | Phạm vi đã chốt |
| --- | --- |
| Không sử dụng màn hình hai sách menu | Loại bỏ màn hình chọn hai sách cũ khỏi luồng người dùng. Không tạo lại `menu-standard.webp` hoặc `menu-premium.webp`. Xử lý route và caller trước khi xóa component. |
| Ảnh ứng viên đã private | Đã đọc lại Supabase: `recruitment_images.public = false`. Đóng finding bucket public. Chỉ smoke test upload và khả năng xem bằng quyền được cấp; không đổi lại public. |
| Thanh toán chỉ để xem | Không yêu cầu trả trước, không triển khai cổng thanh toán, không tạo VietQR ngân hàng động. Đổi nhãn thành đúng `QR TRANSFER`, không mở popup thanh toán. |
| Cần validate booking chi tiết | Đồng bộ client/server theo mục 4, giữ booking là yêu cầu đặt lịch với trạng thái `NEW`. |
| Cần nhập URL CTA trong admin | Bổ sung quản lý URL theo vị trí nút, điền sẵn URL hợp lệ. Không biến mọi URL 404 đã thử thành một finding CTA. |
| Chatbot chưa gấp | Hoãn sửa chatbot khỏi các phase này. |
| Cần reception email khi go-live | Hoàn thiện cấu hình nhận thông báo trên production; tái sử dụng key `system_settings.receptionEmail`, không tạo bảng mới. |
| Pure Relaxation phải dùng DB | Giữ bảng `Services` là nguồn tên, mô tả, giá và thời lượng. Chỉ sửa mapping/render hoặc phần nội dung thật sự thiếu; không viết lại toàn bộ catalog bằng dữ liệu cứng. |

Không thêm chức năng chọn hai chi nhánh trong phạm vi này. Báo cáo trước đã mô tả một chức năng không có trong checkout; đó không phải yêu cầu sản phẩm mới của chủ website.

## 2. Kết quả kiểm tra lại nguồn dữ liệu

### 2.1 Pure Relaxation: điều chỉnh lại kết luận cũ

Luồng hiện tại thực sự có liên kết DB:

1. `src/app/api/services/route.ts` đọc bảng `Services`, lọc `isActive = true`.
2. API map `nameVN/nameEN/nameCN/nameJP/nameKR` thành `names.vi/en/cn/jp/kr`.
3. API map JSON `description` thành `descriptions` theo ngôn ngữ.
4. `PureRelaxationPage.tsx` lấy `/api/services`; tên/mô tả trên panel và tên option ưu tiên dữ liệu API. Giá mỗi duration cũng lấy lại theo service ID.
5. Nội dung biên tập và media đọc `WebBookingContent`, key `pure_relaxation_media`, qua `/api/public/site-content`.

Đọc API live ngày kiểm tra:

| Dữ liệu | Kết quả |
| --- | --- |
| Dịch vụ active | 80 records |
| Tên VI/EN/CN/JP/KR | Không thiếu giá trị ở cả 80 records |
| Mô tả 66 dịch vụ NHS | Không thiếu giá trị ở cả 5 ngôn ngữ |
| Mô tả 14 dịch vụ NHP | Có VI/EN; thiếu CN/JP/KR ở `NHP0001` đến `NHP0014` |
| Narrative đã lưu 5 ngôn ngữ | `package`, `ear-clean`, `foot-care`, `vip-package` |
| Narrative chưa có trong key CMS đã đọc | `body-care`, `barber` |

Đây là kiểm tra độ phủ trường dữ liệu, chưa phải đánh giá chất lượng dịch thuật. Không quy thiếu mô tả NHP thành thiếu mô tả NHS/Pure Relaxation khi NHP chưa được render trong luồng đó.

Lỗi còn có bằng chứng trong source:

- `PureRelaxationPage.tsx:355` tạo `finalSectionContent` có admin override, nhưng nhánh Body Care ở khoảng dòng 817 vẫn render `sectionContent`. Nội dung Body Care chỉnh ở admin có thể không hiện ra web.
- Admin Body Care lưu `quote/body1/body2`, trong khi frontend Body Care dùng `pullQuote/rows`. Chỉ đổi tên biến JSX không đủ; phải map schema cũ sang schema render hoặc thống nhất schema có tương thích ngược.
- Các đoạn `closing`, `signature`, `rows`, `pullSign`, `finalBig`, `finalSmall` không tự được dịch chỉ vì CMS đã có headline/lead. Audit theo từng trường được render.
- Media caption dùng `media.tag` từ cấu hình mặc định; toast `Added to cart`, `Updated cart`, `Removed from cart` còn cứng bằng tiếng Anh.
- Duration price lấy DB, nhưng label thời lượng trong cấu trúc Pure vẫn lấy từ mapping tĩnh. Phải đối chiếu với `timeValue` của service ID đang chọn.
- Admin Pure đang lấy service list từ `getPureRelaxationSections()` và lookup media theo tên. Không đổi khóa media theo tên dịch hiển thị vì sẽ làm mất liên kết với dữ liệu đã lưu.
- `/api/services` map mô tả tiếng Việt từ `vn/VN`, chưa nhận `vi`. Hiện dữ liệu NHS vẫn đầy đủ; chỉ bổ sung tương thích key khi có test, không rewrite dữ liệu hiện có.
- `ServiceSection` return sớm khi không có `selectedService`, phía dưới còn hooks. Cần test lúc API trả rỗng/lỗi hoặc mọi ID trong section bị inactive; sửa thứ tự hooks nếu tái hiện lỗi.

### 2.2 CTA: trang nào, nút nào?

| Nguồn | Nút/vị trí | URL hiện tại | Kết luận |
| --- | --- | --- | --- |
| `/space`, section CTA cuối trang trên live | `Explore treatments` | `/menu` | CTA lỗi đã xác định; `/menu` trả 404 trong lần audit. Local source đã đổi sang `/pure-relaxation`, cần triển khai và cho admin sửa URL. |
| `/space`, cùng section | `Book your visit` | `/booking` | Route tồn tại; cần đưa vào quản lý URL theo yêu cầu, không gọi đây là 404. |
| Homepage `/`, Our Story, phần đặc sản | `Đặt Lịch Trải Nghiệm Ngay` | `https://oria-spa.vercel.app/en/new-user/standard/checkout` | Đang lưu trong `about_story_content.specialtySection.ctaLink`, route hợp lệ. Link cố định EN cần chế độ theo ngôn ngữ nếu chủ web chọn. |
| Header trên các trang đã kiểm tra | `Đặt lịch` | `/vi/new-user/standard/checkout` trong SSR VI | Hợp lệ; không phải finding 404. |
| Màn hình xác nhận checkout, chỉ tablet | QR tiếp tục trên điện thoại | `/{lang}` | Đây là QR điều hướng website, không phải VietQR. Các route `/en`, `/vi` đã 404 ở live cũ. Test sau khi deploy route locale; không gọi nó là nút thanh toán. |
| `ServiceBook.tsx`, sự kiện menu-back | Điều hướng quay lại màn hình chọn sách | `/{lang}/new-user/select-menu` | Route tồn tại nhưng dẫn đến màn hình chủ web yêu cầu bỏ. Chuyển hướng caller và route cũ. |
| `/select-menu`, `/academy` | URL được kiểm tra trong audit cũ | URL ngắn | HTTP 404 không chứng minh có CTA đang trỏ tới. Chỉ sửa CTA nếu crawler/click trace tìm được nguồn; không tạo alias hàng loạt vì báo cáo cũ. |

HTML live đã đọc cho `/`, `/space`, `/history`, `/design-your-journey`, `/blogs`, `/academy/understand-yourself`. Các tương tác client-only cần click test bổ sung, không suy diễn từ HTTP 200 hoặc HTML ban đầu.

### 2.3 Thanh toán và reception mail

- Danh sách phương thức trong `OrderConfirmModal` hiện render bằng `div` thông tin. `activeMethodId` vẫn có code popup nhưng tìm kiếm hiện tại chỉ thấy setter về `null`, nên cần trace usage trước khi tuyên bố popup đang mở trên luồng này.
- `PaymentMethods.tsx` có hàm click mở modal; kiểm tra import/caller đang dùng rồi loại bỏ popup trên bề mặt còn hoạt động. Không gỡ nhầm modal xác nhận booking.
- Các field `paymentMethod/amountPaid/changeDenominations` chưa lưu không còn là blocker khi phương thức chỉ để tham khảo. Backend phải không coi payload này là bằng chứng đã thanh toán.
- Admin system settings và mailer local đã có `receptionEmail`; production `SystemConfigs.system_settings` chưa có giá trị.
- Bản code local đã lọc `receptionEmail` khỏi public site-content allowlist. Phải kiểm tra cả HTML/RSC, public API và quyền đọc trực tiếp `SystemConfigs` trước khi seed email nội bộ.

## 3. Phân công để tránh xung đột

Chỉ chạy **4 worker song song: Luna-1, Luna-2, Terra-1, Terra-2**. Mỗi worker có worktree từ cùng commit đã chốt, nhánh `plan/luna-1`, `plan/luna-2`, `plan/terra-1`, `plan/terra-2`. Không dùng chung `.next`, port dev hoặc database test bị reset. Người điều phối merge tuần tự sau cùng, không phải worker thứ năm.

| Agent | Sở hữu file/phạm vi |
| --- | --- |
| Luna-1 | L1: Pure Relaxation frontend/defaults/admin Pure; `/api/services` adapter; test catalog/CMS/i18n. Không sửa checkout/global settings. |
| Luna-2 | L2–L3: checkout, `OrderConfirmModal`/`PaymentMethods`, CTA components/routes, `SystemSettingsProvider`, admin system-settings UI/API, public sanitizer, helper URL; test UI/config. |
| Terra-1 | T1 phần API/validation; T2 reception/mailer; `/api/bookings`, `/api/bookings/reprice`, validation helper, SQL seed reception riêng; test API/mail. Không sửa SQL atomic. |
| Terra-2 | T1 phần database và toàn bộ mục 10: migration atomic/idempotency, SQL preflight/verify, test SQL/concurrency/quyền trên staging. Không sửa API TypeScript hoặc seed reception. |

Các file dễ đụng nhau đã có một chủ duy nhất:

- `checkout/page.tsx`: Luna-2; Terra-1 không sửa file này.
- `/api/admin/system-settings/route.ts`, `SystemSettingsProvider`, `siteContentSanitizer.ts`: Luna-2, gồm cả reception email và ctaLinks.
- `src/lib/mailer.ts` và `/api/bookings`: Terra-1, gồm cả notification.
- `/api/services`: Luna-1; Terra-1 giữ nguyên response contract catalog.
- File dịch thuật dùng chung: worker bàn giao patch key riêng; người điều phối áp dụng tuần tự nếu nhiều worker cần cùng file. Không ghi đè bản dịch của nhau.
- `.env.local`: giữ nguyên để test. `.env.example`/package/lockfile: agent tích hợp sở hữu nếu có thay đổi cần thiết.

Thứ tự triển khai:

1. Cả 4 bắt đầu theo contract mục 4 và 10. Luna-2 mock API; Terra-1 mock RPC/mail; Terra-2 dùng fixture SQL độc lập. Không chờ code nhau để phát triển/unit test.
2. Không import helper chưa tồn tại ở nhánh khác. Khi tích hợp, người điều phối nối helper và cập nhật dependency chung nếu cần. Mọi thay đổi contract phải thông báo bên gọi/bên nhận.
3. Mỗi worker chỉ commit file sở hữu, không ghi CMS/DB production. Bàn giao commit, file list, test thực và vấn đề còn lại.
4. Merge 4 nhánh tuần tự rồi test API–DB thật trên staging. Mock PASS không thay thế integration PASS. Phụ thuộc lúc release vẫn tồn tại; không deploy riêng các phần booking chưa tích hợp.

## 4. Contract booking validation chi tiết

Thực hiện server validation trước mọi thao tác tạo/cập nhật Customer, Booking, BookingItems hoặc gửi email. Client dùng cùng nguyên tắc để báo lỗi sớm; server vẫn bắt buộc kiểm tra lại.

| Trường | Quy tắc triển khai | Test bắt buộc |
| --- | --- | --- |
| JSON body | Phải là object, đúng kiểu từng trường; đề xuất giới hạn body 64 KiB và tối đa 100 dòng request để chống payload quá lớn; agent kiểm tra tương thích giỏ hiện tại trước khi chốt các giới hạn kỹ thuật này. | JSON hỏng, null, array, body quá lớn trả 400/413, không ghi DB. |
| `name` | Trim; đề xuất 1–120 ký tự Unicode; cho phép tên một chữ, dấu nháy, dấu gạch nối, tên Nhật/Hàn/Trung. Chặn control characters; không giới hạn ASCII. | Tên trống, chỉ khoảng trắng bị từ chối; `O'Neil`, `Nguyễn An`, tên JP/KR/CN hợp lệ. |
| `phone` | Bắt buộc theo UI hiện tại. Parse với country code từ UI; normalize một lần sang dạng quốc tế, không nhân đôi `+84`, không tự suy đoán quốc tịch từ ngôn ngữ sau khi khách đã chọn mã nước. Kiểm tra số hợp lệ theo metadata quốc gia bằng parser đã kiểm thử, không chỉ đếm >=8 chữ số. | Số VN dạng `09...` và `+849...` cùng kết quả khi country=VN; `+81/+82` hợp lệ; toàn chữ, dấu `+` lặp, số quá dài bị từ chối. Không tuyên bố xác minh chủ thuê bao vì chưa có OTP. |
| `email` | Checkout hiện bắt buộc cả email và phone; giữ yêu cầu này cho đến khi chủ web đổi riêng. Trim, giới hạn 254 ký tự, kiểm tra cú pháp; chỉ lowercase domain. Quy tắc Lost & Found nhập một trong hai không tự áp dụng cho booking. | Thiếu email, có khoảng trắng trong địa chỉ, domain lỗi trả field error. Notification service vẫn hỗ trợ record cũ không có email. |
| `date/time` | Bắt buộc ngày hợp lệ `YYYY-MM-DD`, giờ `HH:mm`; tính bằng `Asia/Ho_Chi_Minh`; chặn ngày/giờ đã qua, chặn 31/02 và giờ ngoài khung nhận lịch. | Khách ở timezone khác vẫn đặt cùng giờ spa; giờ đã hết trong lúc điền form bị từ chối lúc submit; giờ mở cửa/cuối ngày được test. |
| Khung giờ | Hiện `buildTimeSlots()` và constants có giờ kết thúc khác nhau. Chọn một nguồn theo cấu hình vận hành được chốt; không parse văn bản `hours` tùy ý thành lịch. Mốc 30 phút theo UI hiện hành. Không tự đổi giờ nhận khách theo suy đoán. | Client và API cho cùng tập slot; không có slot ngoài khung được server chấp nhận. |
| Availability | `getBusySlots()` hiện trả `[]`; chưa có kiểm tra năng lực phục vụ thật. Gọi đây là giờ khách mong muốn và lễ tân xác nhận, không cam kết slot trống. Chức năng realtime staff/room availability nằm ngoài phase này. | Đơn mới là `NEW`, không tự `CONFIRMED`, không tuyên bố đã giữ KTV/phòng. |
| Service IDs | Xác thực từng ID tồn tại, active trong `Services`. Chuẩn hóa alias `id/serviceId/variantId`; nếu nhiều alias có giá trị khác nhau thì trả lỗi. | ID lạ/inactive trả 409 `CART_REQUIRES_REVIEW`; không bỏ qua dòng lỗi. |
| Quantity | Số nguyên 1–20 theo giới hạn hiện có. Nếu nhận numeric string từ caller cũ, parse nghiêm ngặt; từ chối 0, âm, lẻ, NaN, Infinity, >20. Không clamp âm/thập phân thành dịch vụ khác số lượng khách chọn. | 0, -1, 1.5, 21 bị từ chối; 1 và 20 hợp lệ; conflict `qty/quantity` bị từ chối. |
| Giá/thời lượng | Lấy từ `Services`, cộng add-on theo catalog đang active. Bỏ qua giá client; nếu giá thay đổi phải trả dữ liệu canonical để khách xác nhận lại trước khi ghi booking. Tránh reprice đúng nhưng submit âm thầm nhận giá mới. | Sửa giá về 0 không đổi giá server; catalog đổi giữa reprice và submit trả 409 review, không tạo đơn. |
| Options | Allowlist strength/therapist/body-part enums; dedupe focus/avoid; không cho cùng vùng vừa focus vừa avoid; validate boolean tags và add-on. Tôn trọng flags hỗ trợ dịch vụ đang có. | Option không tồn tại, sai kiểu, private-room không khả dụng trả field error; các option hợp lệ round-trip giữ nguyên. |
| Notes | Optional string, đề xuất tối đa 2.000 ký tự cho mỗi ghi chú; giữ dấu/ngắt dòng. Escape khi render email; không chèn raw input vào HTML. | `<a>`, `<img>` và dấu nháy được hiển thị như text, không tạo link/markup trong email. |
| Guest/branch/status | Giữ luồng hiện tại; không thêm field chọn chi nhánh hoặc số khách mới. Nếu nhận `guests` từ caller cũ, phải là số nguyên dương với giới hạn vận hành đã chốt. Branch/status/source/tip được server xác định; không cho payload tự ghi `PAID` hoặc đổi chi nhánh tùy ý. | Client gửi `status=PAID`, `amountPaid` giả không tạo trạng thái đã trả tiền. |
| Idempotency | Một key cho một lần xác nhận cùng payload; retry/network timeout dùng lại key. Payload thay đổi tạo key mới. Server lưu/so sánh fingerprint canonical; cùng key khác payload trả 409. Không log key hoặc PII đầy đủ. | 20 request cùng key tạo đúng 1 booking; 20 key khác tạo 20 booking; timeout sau commit rồi retry trả cùng mã. |
| Transaction | Customer và Booking/BookingItems cần consistency rõ ràng; ưu tiên trong cùng transaction. Không update tên customer hiện có chỉ vì người lạ nhập đúng số điện thoại. Chặn anonymous RPC bypass. | Lỗi child insert không để lại booking cha hoặc customer mới mồ côi; hồ sơ customer cũ không bị ghi đè tùy tiện. |

Giới hạn ký tự/payload ở trên là đề xuất kỹ thuật, không phải khẳng định đã tồn tại trong hệ thống. Tận dụng helper sẵn có; nếu cần thư viện parse phone, chỉ agent tích hợp thêm dependency sau khi kiểm tra công cụ đang dùng.

Response giữ tương thích `success/error/code`, có thể thêm `fieldErrors` map đường dẫn trường -> mã lỗi ổn định. Luna map mã lỗi sang 5 ngôn ngữ. Không trả SQL/raw stack trace. Ví dụ:

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "error": "Please check your booking details.",
  "fieldErrors": {
    "phone": "INVALID_PHONE",
    "selectedServices.0.quantity": "INVALID_QUANTITY"
  }
}
```

## 5. Luna-1 và Luna-2: các việc thực hiện

### L1. Luna-1: Pure Relaxation, DB, CMS và đủ ngôn ngữ

1. Giữ catalog NHS hiện có; inventory service ID -> field API -> field render -> field admin. Ghi riêng NHP thiếu bản dịch ngoài Pure để không sửa nhầm.
2. Map tên/mô tả và duration theo service ID, ưu tiên DB. Media dùng stable key hiện có và adapter tương thích; không chuyển khóa theo tên dịch.
3. Thống nhất dữ liệu Body Care: tạo adapter `body1/body2/quote` cũ -> `rows/pullQuote` khi cần, giữ row title/signature/finale và ngắt dòng. Admin và web cùng dùng dữ liệu resolved; admin lưu field nào phải thấy field đó trên web.
4. Bổ sung default JP/KR/CN cho Body Care/Barber và các trường giao diện/caption/closing thật sự thiếu. Không ghi đè 4 narrative đã được admin dịch.
5. Trường intentionally empty trong CMS phải được giữ trống. Fallback chỉ cho field absent; báo thiếu bản dịch trong admin thay vì âm thầm coi fallback EN là hoàn thành.
6. Sửa thứ tự hooks khi selected service biến mất; empty/error state localized, không lỗi React hoặc add-to-cart bằng ID giả lúc catalog lỗi.
7. Test 5 locale: heading/tên/mô tả/giá/thời lượng đúng ID; thêm sửa duration trong DB reflected; Body Care chỉnh lead/body/quote trong admin hiển thị ngay sau refresh; quantity/options không mất khi đổi ngôn ngữ; `selected services` vẫn tách từng item theo yêu cầu cũ.

### L2. Luna-2: Thanh toán thông tin và bỏ màn hình sách cũ

1. Đổi nhãn visible trên luồng hiện hành thành `QR TRANSFER` cho mọi locale theo yêu cầu chủ web. Giữ label phương thức còn lại theo ngôn ngữ hiện có.
2. Không mở popup phương thức, không tạo QR ngân hàng, không yêu cầu lựa chọn phương thức hay nhập số tiền để xác nhận booking. Giữ modal review/confirm booking.
3. Scan callers trước khi gỡ code modal dead; test mouse/Enter/Space không mở popup thanh toán. Không sửa các màn hình legacy chưa reachable chỉ để rename toàn repo.
4. QR tablet điều hướng website nếu vẫn cần phải đi URL hợp lệ; đây là tiện ích riêng, không gộp vào payment.
5. Redirect route cũ `/{lang}/new-user/select-menu` tới `/{lang}/pure-relaxation` (route locale đã có), cập nhật `ServiceBook` menu-back tương ứng khi đó là hành vi rời menu. Không can thiệp animation Galaxy -> open book -> closed book.
6. Sau khi hết import/caller, xóa `MenuTypeSelector` và CSS chỉ dùng riêng cho nó. Không tải ảnh bìa thay thế. Test bookmark cũ vẫn có đích đúng, cart được giữ, không redirect loop.

### L3. Luna-2: URL CTA trong admin và reception field

Tái sử dụng `SystemConfigs` key `system_settings`. Thêm object `ctaLinks`, không tạo table:

```json
{
  "ctaLinks": {
    "spaceExplore": "/pure-relaxation",
    "spaceBook": "/{lang}/new-user/standard/checkout",
    "tabletContinue": "/{lang}"
  },
  "receptionEmail": "info@techgalaxygroup.com"
}
```

Đây là contract dự kiến; giữ URL `/booking` hiện tại cho `spaceBook` nếu chưa chốt đổi sang checkout. Không thay đổi fallback đang hoạt động chỉ vì ví dụ trên. `/{lang}` chỉ dùng làm default tablet sau khi route locale đã deploy và smoke test pass; trước đó dùng `/` làm fallback hợp lệ.

Admin `/admin/system-settings` thêm nhóm URL với từng hàng có: trang/vị trí nút, nhãn hiện tại, ô paste URL, preview URL resolved theo 5 ngôn ngữ, mở xem trước, lưu và khôi phục mặc định. Dùng form, không hiện JSON để người dùng chỉnh.

- Homepage Our Story đã có `specialtySection.ctaLink`: giữ nguồn này; thêm trường/sự dẫn tới editor hiện tại nếu chưa hiển thị, không lưu bản thứ hai trong `ctaLinks`.
- Hotline/maps Design Your Journey tiếp tục lấy `phone/googleMaps`; tạo lối chỉnh ngay trong admin, không tạo bản sao phone trong URL config.
- Helper URL chấp nhận relative path bắt đầu `/` và HTTPS external; cho template `{lang}` giới hạn đúng 5 mã repo `vi/en/cn/jp/kr`. Label ZH/JA/KO không đồng nghĩa tự đổi mã DB/route.
- Từ chối `javascript:`, `data:`, protocol-relative `//...`, control character, backslash và URL malformed. `tel:` chỉ do helper hotline tạo từ số được normalize. Không cho nhập arbitrary template/expression.
- Kiểm tra URL theo loại: relative route qua crawler/preview build; external qua kiểm tra phù hợp. Không fetch arbitrary URL từ server admin để tránh SSRF.
- API validate cả URL lẫn email, merge theo từng key được sửa; request sửa một CTA không xóa hotline, receptionEmail hoặc CTA khác. Với hai tab admin stale, không dùng full object cũ ghi đè những field không sửa.
- Public sanitizer chỉ trả allowlisted CTA hợp lệ; receptionEmail giữ server/admin. Kiểm tra đường đọc trực tiếp DB và root serialization, không chỉ `/api/public/site-content`.
- Test lưu/reload, URL trống dùng default hợp lệ, template locale, invalid protocols, các nút live nhận thay đổi admin. Test không có input tên email hoặc dữ liệu nhạy cảm lọt ra public.

## 6. Terra-1 và Terra-2: các việc thực hiện

### T1. Terra-1: Booking API và validation

1. Thực hiện contract validation mục 4; so sánh mọi caller đang có trước khi bỏ aliases hoặc thay response shape.
2. Gọi RPC theo contract mục 10 bằng server client, không dùng browser client; mock RPC để Terra-1 chạy độc lập Terra-2.
3. Khi RPC/schema thiếu hoặc ACL sai, trả 503 `BOOKING_TEMPORARILY_UNAVAILABLE`; xóa fallback `max+1`, không insert parent/child riêng và không compensating DELETE.
4. Tính fingerprint canonical, map conflict 409 và giữ response replay tương thích. Customer lookup/create không chạy trước transaction booking.
5. Test concurrency ở cấp API bằng mock; chạy integration DB staging sau khi Terra-2 bàn giao migration/ACL.
6. Không đưa amountPaid/payment method vào logic yêu cầu trả trước. Trạng thái tiếp nhận booking vẫn `NEW`; method list là thông tin.
7. Không sửa migration atomic hoặc counter của Terra-2; bàn giao fixture payload/response và danh sách caller.
8. Không coi migration chưa chạy là đã pass database tests; không deploy API trước khi staging chứng minh RPC hoạt động.

### T2. Terra-1: Reception email sẵn sàng cho production

1. Dùng `system_settings.receptionEmail` -> env `RECEPTION_NOTIFICATION_EMAIL` -> default đã thỏa thuận `info@techgalaxygroup.com`. Phối hợp Luna về validation admin, không sửa file Luna sở hữu.
2. Chuẩn bị SQL seed chỉ merge field email vào JSONB của record `system_settings`; giữ mọi field khác và giữ email hợp lệ người dùng đã cấu hình. Không INSERT một object rỗng thay cả cấu hình.
3. Không tạo một mailbox SMTP mới: đây là địa chỉ nhận thông báo. Mailbox/Zoho phải có sẵn; Vercel Production cần đủ cấu hình SMTP server-side, kiểm tra presence không in giá trị secret.
4. Vì secret .env.local dùng test hiện tại, không xóa hoặc đổi file này. Agent tích hợp đặt cấu hình Vercel Production và seed đúng environment trong release step.
5. Khách có email: gửi khách và BCC lễ tân. Record/caller hợp lệ không có email: gửi lễ tân. Escape tất cả input đưa vào HTML, validate recipient, không log toàn bộ PII.
6. Không giả lập thành công dựa vào tên email có chữ `dummy` hoặc `synthetic`: có thể vô tình chặn khách thật. Dùng mail transport mock rõ ràng trong test; không bật gửi thật trong concurrency suite.
7. Email lỗi không làm booking đã commit biến thành thất bại để khách đặt trùng. Lưu/log trạng thái notification có thể tra cứu, bàn giao cách retry có kiểm soát bằng mã booking hiện hữu. Không tạo booking mới khi retry email.
8. Idempotent replay không gửi lại email hàng loạt. Kiểm tra mất response sau commit và lỗi SMTP bằng fake transport; việc gửi thử thật cần đúng mailbox được cho phép, không gửi hàng loạt tới lễ tân.

## 7. Test plan và tiêu chí nghiệm thu

| Bộ test | Người chạy | Điều kiện đạt |
| --- | --- | --- |
| Validation unit/API | Terra-1 | Các trường mục 4 có case hợp lệ/sai kiểu/boundary; invalid input không thay đổi DB. |
| Atomic integration, DB staging | Terra-2 + điều phối | 20 key khác -> 20 mã; 20 request cùng key -> 1 booking; child error rollback; payload mismatch 409; seq 999/1000/1001 hoạt động. |
| RPC permissions | Terra-2 | anon và user thường không gọi được RPC ghi booking; server role gọi được; không thử ghi dữ liệu production bằng anon. |
| Mail mock | Terra-1 | To/BCC/fallback đúng; replay không gửi thêm; SMTP fail không tạo duplicate; HTML input escaped. |
| Catalog/CMS round-trip | Luna-1 | 66 NHS lấy tên/mô tả/duration/giá DB; Body Care admin -> web đúng; các narrative có bản dịch đã lưu được giữ nguyên. |
| UI 5 locale | Luna-1 | Tất cả text rendered ở phạm vi Pure đã audit, bao gồm caption/toast/closing; empty/error state không lỗi hooks. |
| CTA | Luna-2 | Trace nguồn nút + resolved URL + final page; chỉnh admin và reload cập nhật; không coi status 200 của trang not-found là pass. |
| Payment info | Luna-2 | Nhãn `QR TRANSFER`; không popup payment, không bắt trả trước; review/confirm booking vẫn làm việc. |
| Retire selector | Luna-2 | Không request hai ảnh sách; route bookmark/back không lỗi/loop; homepage vẫn video hero; cart và animation book hiện tại không bị sửa lệch. |
| Responsive/accessibility | Luna-1 + Luna-2 | 390x844, 768x1024, 1440x900; thêm landscape; không overflow/che nút, kiểm tra keyboard và ảnh thật. |
| Reception production config | Terra-1 + điều phối | Email được lưu đúng DB/env, không lộ public, gửi thử kiểm soát đúng hộp thư sau khi được phép. |
| Recruitment private regression | Điều phối | Bucket vẫn private; application upload hoạt động; public URL không đọc ảnh; người được cấp quyền xem bằng signed URL. Không chỉnh policy khác trong phase này nếu chưa phát hiện lỗi. |

Test runner phải phân biệt PASS/FAIL/SKIP. `No tests configured`, `Found 0 schema files`, hoặc security scanner báo lỗi nhưng exit 0 không được ghi PASS. Ghi tên test, số assertion, môi trường, commit và kết quả thực tế. Không chạy concurrency script cũ trên production.

## 8. Release theo thứ tự

1. Đọc lại worktree/branch state; chọn một integration commit. Agent song song không push production trực tiếp.
2. Merge contract/backend/UI; resolve conflict bởi chủ file; chạy typecheck, lint scoped + ghi warning hiện hữu, test thực, production build.
3. Deploy Preview với DB staging và mail mock. Chạy toàn bộ acceptance; xác nhận CTA bằng click và nội dung trang đích, không chỉ HEAD request.
4. Kiểm tra migration mới so với schema production; backup và preflight constraint trước apply. Áp dụng migration atomic đã sửa quyền, không apply nguyên file cũ chưa sửa.
5. Deploy code đã kiểm thử từ branch `vercel`. Config public filtering phải có hiệu lực trước khi seed receptionEmail nếu đường public còn lộ record `system_settings`.
6. Seed receptionEmail bằng SQL merge đã review; bổ sung env Production nếu cần. Không xóa `.env.local`.
7. Smoke test production không ghi dữ liệu trước; sau đó một booking kiểm soát khi được phép, đối chiếu mã/line items/notification. Theo dõi lỗi và rollback app nếu regression.
8. Kết luận GO chỉ khi các test booking/CTA/Pure/reception bắt buộc pass. Chatbot, thanh toán trước và màn hình hai sách không nằm trong điều kiện nghiệm thu này.

## 9. Handoff prompt ngắn

### Gửi Luna-1

Đọc toàn bộ plan, chỉ thực hiện L1. Giữ catalog Services, sửa mapping admin Body Care -> frontend, đủ 5 ngôn ngữ và hooks/empty state. Không sửa checkout, global settings, API booking hoặc SQL. Bàn giao commit, file list, test CMS round-trip và screenshot 3 viewport. Không push production hoặc ghi CMS production.

### Gửi Luna-2

Đọc toàn bộ plan, thực hiện L2–L3 và client validation theo mục 4. QR TRANSFER chỉ xem, bỏ selector sách cũ, thêm ô URL CTA và reception field trong admin. Mock API để chạy độc lập; giữ giỏ khi API 503. Không sửa Pure, booking API/mailer hoặc SQL. Bàn giao commit, test UI/config và screenshot; không deploy production.

### Gửi Terra-1

Đọc toàn bộ plan, thực hiện API/validation của T1 và T2. Validation trước side effect, reprice theo DB, fingerprint canonical, gọi RPC theo mục 10; thiếu schema/RPC trả 503 không fallback ghi ngoài transaction. Mock RPC/mail để chạy độc lập. Sở hữu API, mailer và SQL seed reception riêng; không sửa migration atomic của Terra-2. Không gửi mail thật hoặc thay .env.local. Bàn giao contract fixtures, commit và test API/mail.

### Gửi Terra-2

Đọc toàn bộ plan, thực hiện database của T1 và mục 10. P0: column idempotency_key, atomic RPC, chống trùng mã và khóa quyền server-only. Không chạy migration cũ có GRANT anon/authenticated. Sở hữu migration/preflight/verify/tests SQL; không sửa API hoặc seed reception. Test trên staging độc lập, bàn giao SQL chính xác cần apply, ACL evidence, concurrency/rollback tests; không chạy production.

## 10. P0 bổ sung: thiếu schema/RPC và migration không an toàn

### 10.1 Trạng thái và điều kiện chặn go live

- Theo kết quả kiểm tra đã báo cáo: `Bookings.idempotency_key` và RPC `create_booking_atomic` chưa tồn tại. Đây là trạng thái lần kiểm tra trước, không phải xác nhận vừa query lại production; Terra-2 phải kiểm tra read-only và ghi timestamp/environment trước khi làm SQL.
- Production sinh mã ngoài transaction vẫn có nguy cơ collision khi nhiều request đồng thời. Chưa có test concurrency thật thì không đánh dấu đã giải quyết.
- Bản migration gốc từng có grant EXECUTE cho `anon` và `authenticated` trên RPC SECURITY DEFINER, cho phép bỏ qua API và truyền giá/trạng thái trực tiếp. Bản local hiện đã loại các grant này, khóa counter và chỉ cấp RPC cho `service_role`; vẫn phải chạy read-only verifier trước, sau đó apply đúng bản đã review, không chạy bản SQL cũ từ lịch sử.
- Thêm column/RPC nhưng giữ quyền nguy hiểm không phải bản sửa đạt yêu cầu. API và SQL phải cùng qua integration mới mở nhận booking thật.

### 10.2 Contract Terra-1 / Terra-2

- Giữ canonical signature `create_booking_atomic(p_booking_data JSONB, p_booking_items JSONB, p_idempotency_key TEXT, p_booking_id TEXT DEFAULT NULL)`. API hiện truyền 3 tham số đầu bằng tên; giữ tương thích. Không để hai overload cùng bộ tên tham số làm PostgREST resolve mơ hồ; kiểm kê caller trước bỏ overload.
- Giữ field JSON hiện có. Thêm `p_booking_data.requestFingerprint`: SHA-256 do API tính từ payload nghiệp vụ normalize, không gồm key/timestamp request, không tin hash browser. DB lưu fingerprint để so sánh; cùng key khác payload trả SQLSTATE `P0001`, message `IDEMPOTENCY_CONFLICT`; API map HTTP 409, không lộ raw SQL.
- RPC trả `booking_id`, `bill_code`, `idempotent`, `data` tương thích caller. Replay trả dữ liệu booking đã commit, không dựng lại từ payload retry. Terra-1 giữ response public checkout đang dùng.
- Customer dùng field `customerName/customerPhone/customerEmail/customerGender/customerId` đang có: API local hiện trì hoãn lookup/create/link sau booking RPC để tránh orphan khi schema thiếu. Nếu go-live yêu cầu customer và booking atomic tuyệt đối, Terra-2 phải bổ sung resolve/create trong transaction theo schema thực tế trước khi apply; không ghi đè hồ sơ cũ chỉ vì người gửi nhập đúng số điện thoại.
- API xác định giá/status/branch/source từ dữ liệu hợp lệ; không forward booking ID tùy ý của client. RPC chỉ server role được gọi, service-role key không xuất hiện trong client bundle.
- Thiếu RPC/schema: HTTP 503, `code=BOOKING_TEMPORARILY_UNAVAILABLE`, không partial write và không fallback `max+1`. Luna-2 giữ giỏ; retry cùng payload dùng lại key. Không gọi compensating DELETE là transaction.

### 10.3 Terra-2: trình tự sửa an toàn

1. Read-only inventory: column/index Bookings, RPC signatures/ACL, counter, duplicate mã/key, foreign keys. Không gọi RPC ghi production để thử quyền.
2. Migration additive: thêm `idempotency_key` nullable cho record cũ, unique index cho key có giá trị và field lưu fingerprint. Preflight duplicate; có trùng thì dừng báo, không tự xóa/sửa booking thật.
3. Nếu file chưa apply: sửa/review file trước khi chạy. Nếu đã apply ở environment nào: dùng migration tiến tới phù hợp lịch sử. Ghi rõ file superseded; không để pipeline chạy file nguy hiểm cũ rồi mới sửa quyền sau.
4. Tạo RPC và khóa ACL trong cùng transaction: revoke EXECUTE PUBLIC/anon/authenticated trên mọi overload; grant chỉ service_role cho API. Kiểm tra effective privileges cả quyền kế thừa; cố định search_path và qualify objects. Không cho anon/authenticated direct write counter.
5. Counter/upsert/row lock và unique constraints phải chống race. Seed từ mã hiện hữu an toàn với writer cũ; nếu không bảo đảm, tạm dừng nhận booking trong cửa sổ chuyển đổi. Không cắt số khi seq >=1000, không vòng retry vô hạn.
6. Resolve/create Customer, Booking và BookingItems trong cùng transaction; child insert lỗi rollback toàn bộ. Giữ foreign keys và dữ liệu lịch sử.
7. Serialize cùng idempotency key; request cạnh tranh phải chờ/replay, không generic 500 vì unique violation. Khác fingerprint conflict; record cũ thiếu fingerprint cần chính sách rõ ràng, không mặc định chấp nhận mọi payload.
8. Reuse counter đã có nếu phù hợp; bảng kỹ thuật mới nếu bắt buộc phải có prefix `Webbooking` và được review. Không thêm bảng nghiệp vụ hoặc thay 4 bảng content đã thống nhất.
9. Bàn giao SQL apply, verify read-only, fixture/tests staging và rollback không mất booking. Chạy lại migration trên staging phải an toàn. Không tự apply production.

### 10.4 Phân test và cổng release cho 4 worker

Các tên Luna/Terra ở bảng mục 7 là nhóm; người thực hiện cụ thể được chốt như sau:

| Worker | Bằng chứng bắt buộc |
| --- | --- |
| Luna-1 | Catalog/CMS round-trip, 5 locale Pure, hooks/empty state, responsive trong phạm vi Pure. |
| Luna-2 | CTA/config, payment chỉ xem, retire selector, client validation/503 giữ giỏ, responsive checkout/admin. |
| Terra-1 | Validation API, mock RPC lỗi/replay/conflict, mail To/BCC/escape/retry; không gửi lại mail khi replay. |
| Terra-2 | Schema/ACL, migration rerun, 20 key khác -> 20 booking/mã duy nhất; 20 request cùng key -> 1 booking; khác payload conflict; child error rollback; seq 999/1000/1001. |

Trên staging, kiểm thử role anon và authenticated thường đều bị từ chối RPC, service_role được phép; verify mọi overload bằng catalog privileges. Không thực hiện negative write test trên production. Test API–DB sau merge phải cover timeout sau commit rồi retry trả cùng mã, và schema thiếu trả 503 không ghi DB.

Thứ tự mục 8 vẫn áp dụng với 4 nhánh: merge -> build/test -> Preview + staging -> review SQL/backup/preflight -> migration an toàn -> deploy `vercel` -> smoke có kiểm soát. Nếu cần chặn writer cũ, mở cửa sổ bảo trì trước migration. Rollback app không được quay về bản fallback `max+1`; giữ schema additive và tạm đóng nhận booking nếu chưa có bản tương thích an toàn.

Chỉ đánh dấu P0 PASS khi column/index/RPC tồn tại đúng environment, ACL server-only đã chứng minh và concurrency/rollback tests thật đạt. Mock hoặc migration chưa chạy không phải bằng chứng DB đã được sửa.
