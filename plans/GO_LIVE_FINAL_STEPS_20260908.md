# Go-live web: CMS, media và customer flow hiện có

Cập nhật theo xác nhận của chủ web: admin trong repo này chỉ quản lý content, media và SEO. Hệ thống Admin điều phối đơn là hệ thống riêng, đang dùng DB nghiệp vụ chung.
Tài liệu này thay thế các chỉ dẫn triển khai DB/điều phối trong những plan trước.

Quyền dịch vụ đã chốt bổ sung: CMS được đọc thông tin để chọn đúng dịch vụ, chỉ chỉnh ảnh/video và cấu hình hiển thị media hiện có. Dữ liệu catalog dịch vụ chỉ đọc. Kịch bản nghiệm thu chi tiết: [CMS media và customer flow](./GO_LIVE_MEDIA_ACCEPTANCE_PLAN_20260908.md).

## 1. Ranh giới triển khai

- Giữ schema, enum, constraint, trigger, policy và nghiệp vụ của `Bookings`, `BookingItems`, `Customers`, phòng/KTV và thanh toán hiện tại.
- Không thêm `PENDING`, không đổi nghĩa `NEW`, không suy ra workflow từ thứ tự tên enum. `COMPLETED` có trong enum; không tự coi nó đồng nghĩa với `DONE`.
- Web tiếp tục gửi yêu cầu đặt lịch theo contract đang được hệ thống điều phối tiếp nhận. Quyền xác nhận, phân phòng/KTV, chuyển trạng thái và xử lý đơn thuộc hệ thống đó.
- Giữ nguyên service ID, giá VND/USD, duration, options và liên kết dòng dịch vụ. Giá đọc từ DB; không tự tính tỷ giá thay giá USD.
- Giờ bắt đầu nhận lịch trên web: 09:00-22:30, bước 30 phút, theo Asia/Ho_Chi_Minh. Không ép liệu trình kết thúc trước 22:30.
- CMS sửa nội dung qua storage hiện hữu đã được kiểm tra. Prefix Webbooking không tự bảo đảm dữ liệu độc lập với hệ thống nội bộ.

## 2. Bằng chứng và phần chưa được xác minh

Đã kiểm tra source local:

- `src/app/admin/layout.tsx` đã có sidebar content/media/SEO; không có mục điều phối đơn.
- Vẫn còn `/admin/bookings`, `/admin/customers` và `/api/admin/bookings/**`. PUT API dùng service role cập nhật trực tiếp `Bookings.status`, với auth CMS mặc định; ẩn sidebar chưa vô hiệu hóa quyền này.
- Lỗi lọc PENDING/CONFIRMED, tên cột created_at/bookingTime/totalPrice thuộc các route dư trong repo web. Chưa kiểm tra source của Admin điều phối riêng nên không quy lỗi này cho hệ thống đó.
- `src/app/api/bookings/route.ts` local đang bắt buộc RPC `create_booking_atomic`; hai truy vấn replay đều select `idempotency_fingerprint`.
- Lần đọc Supabase trước xác nhận thiếu idempotency_key, counter và không thấy RPC trong OpenAPI. Đây là bằng chứng dependency của bản local chưa sẵn sàng, không chứng minh website live hiện đang crash.
- Ref Git local `vercel` tại `05fce62` có fallback insert parent rồi items khi RPC thiếu. Đây không phải một transaction; chưa xác nhận ref này là SHA thật của deployment live.
- API booking local còn ghi EMAIL_SENT/EMAIL_PENDING vào `Bookings.reception_feedback`. Chưa xác minh cột này thuộc ai; cần tránh ghi đè ghi chú lễ tân.
- PUT `/api/admin/services/[id]` vẫn nhận priceVND, duration, category, isActive. PATCH dịch thuật chỉ sửa tên/mô tả. Cần giới hạn quyền theo mục tiêu CMS content/media.
- Các con số status đã báo trước chỉ là mẫu tối đa 1.000 dòng mỗi bảng, không phải tổng toàn bộ DB.
- Chưa chứng minh end-to-end: web gửi đơn -> Admin điều phối riêng hiển thị đúng -> vận hành xử lý bình thường.

## 3. Bỏ hoặc thay các bước cũ

| Bước cũ | Quyết định mới |
| --- | --- |
| Tạo WebbookingBookingDailyCounters | Bỏ khỏi release web này |
| ALTER Bookings thêm key/fingerprint, index, FK | Bỏ khỏi release web này |
| Thêm unique phone/email Customers, resolve/create customer theo RPC mới | Bỏ; giữ quy tắc khách hàng của hệ thống hiện hữu |
| Tạo/drop/replace RPC, đổi quyền hoặc trigger trên DB chung | Bỏ; không triển khai SQL atomic từ repo này |
| Thêm PENDING/CONFIRMED, tự thiết kế transition status | Bỏ |
| Sửa /admin/bookings thành màn điều phối hoàn chỉnh | Bỏ; xử lý route dư theo Phase 1 |
| Load test ghi booking/khách hàng lên DB thật, đổi giá thật để test | Bỏ; dùng fixture hoặc môi trường test được tách riêng |
| Bắt buộc migrate production rồi deploy web | Thay bằng kiểm tra tương thích tích hợp hiện có rồi deploy bản web đã nghiệm thu |
| Seed trực tiếp tên/mô tả Services vào DB dùng chung | Bỏ khỏi đợt này; ghi nhận bản dịch còn thiếu và chuyển cho nơi quản lý catalog |
| Dựng thêm workflow email, payment, phòng/KTV | Bỏ; xác minh bên nào đang sở hữu để web không thực hiện trùng |

Các file SQL atomic và file tên READY_TO_PASTE đã bị rút khỏi hướng dẫn triển khai hiện tại. Không chạy vì tên file hay vì chúng từng PASS trên fixture PostgreSQL.
Việc không chạy migration chưa đủ: cũng phải giải quyết dependency RPC/cột mới trong code local trước khi đưa booking changes lên live.

## 4. Phase 1: chốt phạm vi và tương thích trước release (P0)

### A. Dọn bề mặt điều phối dư trong CMS

- Kiểm kê caller của /admin/bookings, /admin/customers, /api/admin/bookings và /api/admin/bookings/[id], gồm link/bell còn import.
- Khi xác nhận là route dư của web: vô hiệu hóa UI và GET/PUT API tại ứng dụng web; truy cập trực tiếp bị từ chối hoặc 404. Không chỉ xóa menu.
- Không xóa bảng, hồ sơ hoặc thay quyền truy cập của Admin điều phối riêng.
- Giữ /admin/history vì đây là lịch sử thương hiệu, không phải lịch sử đơn.
- Test tài khoản editor CMS không đọc danh sách khách và không sửa status qua route dư.

### B. Chốt đường gửi booking đang được sử dụng

1. Xác định deployment live/SHA thật và đường submit đang chạy: API web ghi DB hay gọi API của hệ thống điều phối. Dùng log/code/request metadata; không tạo đơn thật chỉ để dò.
2. Đọc contract đã có: service IDs, từng dòng qty/duration/options, date/time, customer, source/status, mã đơn, response và xử lý retry.
3. Đối chiếu diff local với contract đó. Bản local hiện phụ thuộc RPC/cột mới nên chưa thể deploy nguyên bộ khi cấm migration.
4. Nếu có API tiếp nhận đơn hiện hữu của hệ thống điều phối: adapter server của web dùng endpoint/auth/contract đã xác minh; giữ response cho checkout.
5. Nếu web live đang ghi trực tiếp DB: giữ đường đó làm baseline để phân tích; xác minh cơ chế transaction/idempotency đã tồn tại trong hệ thống. Không mặc định fallback insert nhiều bước là an toàn và không tự thay bằng API chưa biết.
6. Nếu chưa có cơ chế tương thích đủ để bảo đảm đơn đầy đủ và chống gửi trùng: ghi rõ blocker của booking patch. Release content/media có thể tách ra, chỉ sau khi review dependency với API/checkout thực sự đang chạy; không deploy patch API cần migration.
7. Hai thành phần mới quote/replay phải được nối hoặc loại khỏi patch triển khai theo contract đã xác minh; không để client bắt buộc token mà server không nhận, hoặc server truy vấn cột chưa có.

Điều kiện hoàn tất: có tài liệu request/response và bằng chứng một booking test được Admin điều phối thật tiếp nhận đúng. Hiện chưa đủ thông tin để khẳng định chỉ sửa frontend là hết dependency.

## 5. Phase 2: hoàn thiện web và CMS (P1)

- Giữ GET thông tin dịch vụ để đối chiếu ID, tên, giá, thời lượng và trạng thái. PUT/PATCH chỉ cho cập nhật media đã xác minh; chặn đổi tên/mô tả catalog, giá, duration, options, category, isActive, tạo/xóa dịch vụ. Chi tiết trong plan nghiệm thu media.
- Dịch toàn bộ content web/CMS VI/EN/JP/KR/CN: body, bullet, caption, CTA, placeholder, loading/error và thông báo. Tên/mô tả/tags catalog đọc nguyên nguồn; phần thiếu được ghi nhận để hệ thống quản lý catalog bổ sung, không seed hoặc ghi đè qua CMS web.
- Hiển thị đúng nội dung hiệu lực trong admin; save -> refresh -> public read-back. Sửa một locale không đè bốn locale khác; hai tab sửa đồng thời phải giữ draft và báo conflict.
- Review storage media trước khi sửa: Pure Relaxation đang dùng pure_relaxation_media qua API content; đường service media có media_url/media_type. Tái sử dụng theo từng consumer, không nhân bản catalog hoặc tạo schema. Tên/mô tả Services chỉ đọc; loại caller PATCH chỉnh catalog đang có.
- Hoàn thiện Our Story/thước phim, History, Design Your Journey, Pure Relaxation, Daily Blog, Lost & Found bằng editor/media hiện hữu. Test ảnh/video/watermark từng khung, crop/order, paragraph spacing, draft/publish.
- Giữ quick-select qty, Add another option, từng dòng selected service riêng, cart persistence, back/reload và validation giờ 22:30.
- CTA hotline/map/LINE/WeChat dùng URL cấu hình hiện hữu; payment là thông tin QR TRANSFER, không popup thu tiền trước.
- Xác minh bên gửi email tiếp nhận/xác nhận hiện tại. Tránh gửi đôi; không dùng reception_feedback làm marker nếu chưa xác minh ownership. Đề xuất dùng log/notification mechanism đang có, không tự thêm bảng.
- Giữ .env.local để test; rà public API/bundle không lộ secret. CMS logout chỉ xử lý session liên quan, tránh xóa cart khách ngoài ý định.

## 6. Phase 3: nghiệm thu customer flow (P0 trước booking release)

| Case | Expected |
| --- | --- |
| 1 duration qty 1 -> 2; nhiều duration/options | Badge/tổng tiền đúng; dòng riêng không bị gộp; Admin điều phối nhận đúng từng dòng |
| DB VND/USD, add-on, duration 0 hợp lệ | Giá và ID giữ nguyên; không sửa catalog, không fallback giá cứng |
| 09:00/22:30 tương lai, 08:30/22:31/23:00, tab qua giờ | Nhận slot hợp lệ, chặn slot ngoài giờ/quá hạn, cùng kết quả ở VN/UTC/LA |
| Bấm 2 lần, timeout sau commit, reload rồi retry | Theo cơ chế idempotency đã xác minh: một đơn đầy đủ; không mất items/đổi mã/gửi mail lặp |
| Hệ thống tiếp nhận lỗi/offline | Giữ cart và thông tin khách; không hiển thị thành công giả |
| Đơn đã tiếp nhận | Admin điều phối riêng thấy đúng source, trạng thái theo contract, giờ VN, giá, qty, options; CMS không chuyển trạng thái |
| Content edit trong admin | Public đúng locale; giá và dữ liệu nghiệp vụ không đổi |
| Direct URL/API CMS sau logout/role editor | Không đọc khách hoặc cập nhật đơn qua route dư |
| 390/768/1440px và Safari mobile, đủ 5 locale | Không crash/tràn, modal đóng được, CTA không 404, homepage video/flipbook giữ flow |
| Notification | Đúng bên sở hữu gửi, đúng người nhận; lỗi mail không khiến khách tạo đơn lần hai |

Mock/unit/build đã PASS trước đây là bằng chứng giới hạn. Không thay được test handoff tới Admin điều phối riêng.
Email QA được cho phép: nghik22@gmail.com. Test load/concurrency dùng mock hoặc môi trường riêng; lần kiểm tra đơn/email thực cần nhận diện test và người vận hành theo dõi, không tự xóa record sau test.

## 7. Phân công 4 agent theo phạm vi mới

| Agent | Việc | File/ranh giới |
| --- | --- | --- |
| Terra-1 | Read-only audit đường tích hợp đang chạy, contract và nghiệm thu handoff | Tài liệu/bằng chứng/test fixture; không còn nhiệm vụ migration |
| Terra-2 | Tích hợp API web theo contract đã xác minh, retry/validation/notification | /api/bookings/**, helpers booking/mailer; không SQL hoặc hệ thống điều phối |
| Luna-1 | CMS 5 locale/media, khóa route điều phối dư và giới hạn service edit | admin/API admin/content components; không booking submit |
| Luna-2 | Customer flow/22:30/qty/options/currency/responsive/CTA | checkout/cart/header/UI; không server API hoặc SQL |

Terra-1 xác minh contract trước khi Terra-2 chốt adapter; các nhánh khác có thể làm song song với fixture. Một người điều phối review file chung và tích hợp tuần tự.
Không chạy lại toàn bộ nhiệm vụ DB của 4 agent cũ.

## 8. Thứ tự bàn giao

1. Đóng phạm vi migration/điều phối trong plan; giữ kết quả test cũ làm lịch sử.
2. Chốt contract tích hợp và xử lý dependency local chưa tương thích; khóa quyền CMS vượt phạm vi.
3. Hoàn thiện content/media/5 locale và customer flow; chạy test đúng các file thay đổi.
4. Nghiệm thu handoff booking trên môi trường phù hợp, kiểm tra giá và trạng thái trước/sau.
5. Review diff deployment nhánh vercel theo phạm vi này; không chạy SQL atomic hoặc seed chung tự động.
6. Deploy sau khi được chỉ định; kiểm tra web và một đơn kiểm soát, theo dõi lỗi submit/email.

Áp dụng ma trận và điều kiện GO trong [GO_LIVE_MEDIA_ACCEPTANCE_PLAN_20260908.md](./GO_LIVE_MEDIA_ACCEPTANCE_PLAN_20260908.md) khi bắt đầu nghiệm thu. Các mục mới là PLANNED/NOT RUN, không kế thừa PASS từ test trước khi giới hạn quyền media.

Trạng thái lượt cập nhật này: đã sửa plan và đánh dấu SQL cũ không còn áp dụng; chưa sửa runtime, chưa ghi DB, chưa deploy.
