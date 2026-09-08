# Go-live: kết quả tích hợp và kịch bản nghiệm thu

> Kết quả test dưới đây được giữ làm bằng chứng lịch sử. Dùng [plan hiện hành](./GO_LIVE_FINAL_STEPS_20260908.md) cho bước tiếp theo: không apply migration booking; kiểm tra lại dependency RPC của bản local theo contract hệ thống điều phối riêng. Chưa có bằng chứng deployment live đang chạy đúng SHA local này.

Ngày: 08/09/2026. Baseline: `5888652` và các thay đổi local đang có.
Phạm vi: kiểm tra bàn giao bốn agent, sửa lỗi tích hợp, test trước release.

## 1. Quyết định hiện tại

**NO-GO cho nhận booking production.** Không đồng nghĩa website đang crash toàn bộ.

Kiểm tra Supabase chỉ đọc trong lượt này xác nhận:

- `Bookings.idempotency_key`: chưa tồn tại, lỗi `42703`.
- `WebbookingBookingDailyCounters`: chưa thấy trong schema cache, `PGRST205`.
- RPC `create_booking_atomic`: không được expose trong OpenAPI với service role.
- Chưa chạy migration, seed, tạo booking hoặc cập nhật giá trên DB thật.
- Chưa commit/push/deploy trong lượt tích hợp này. Đích deploy sau phê duyệt là `vercel`.

Không coi việc bốn agent báo DONE là bằng chứng đủ để bật booking production.

## 2. Đã sửa khi tích hợp

1. Lỗi thiếu schema/ACL/RPC trả `503`, không bị phân loại nhầm thành lỗi dịch vụ `409`.
2. Đối chiếu snapshot catalog trong transaction, khóa service theo thứ tự ID; giá VND/USD, thời lượng hoặc trạng thái đổi thì trả `PRICE_CHANGED`, không âm thầm chốt giá mới.
3. Bọc migration trong transaction; sửa ngày replay theo `Asia/Ho_Chi_Minh`.
4. Sửa SQL verifier bị lỗi `name[] = text[]`, đối chiếu đúng predicate index.
5. Nối quote vào checkout và hai form booking còn lại. Booking mới thiếu quote bị từ chối; replay vẫn đọc trước kiểm tra quote/thời gian/catalog.
6. Reprice `409/503` không còn được coi là hợp lệ và không xóa lựa chọn khách. Đồng bộ thay đổi riêng giá USD/thời lượng.
7. SMTP lỗi hoặc cập nhật trạng thái email lỗi không biến booking đã commit thành thất bại.
8. Lưu tên/thời lượng/USD/options theo dòng trong snapshot; replay dựng dịch vụ từ item đã lưu, không trả danh sách dịch vụ rỗng hoặc lấy giá catalog mới.
9. Checkout không tự giữ/chọn lại slot quá hạn; kiểm tra giờ thực tại khi xác nhận, cập nhật clock khi trở lại tab. Tách logo checkout khỏi thanh điều hướng.
10. Chấp nhận duration `0` được DB cấu hình cho Barber/Additional; vẫn từ chối duration thiếu, âm hoặc không hợp lệ. Không tự gán thời lượng hay sửa DB.
11. Chuẩn bị seed 42 mô tả JP/KR/CN còn thiếu cho 14 dịch vụ VIP. VI/EN giữ nguyên; chỉ điền khi nguồn vẫn khớp bản đã review. Không đè chuỗi rỗng hoặc bản dịch đã có.
12. Build output riêng `.next-go-live`, không sử dụng chung output với dev server của người dùng.
13. Sửa click thông báo lỗi lan lên backdrop làm đóng hộp xác nhận khi retry; hiện qty bên cạnh từng dòng cart/confirm.

## 3. Bằng chứng đã chạy

| Nhóm | Kết quả | Giới hạn bằng chứng |
| --- | --- | --- |
| TypeScript | PASS | `npx tsc --noEmit --incremental false` |
| Production build cuối | PASS, 62 trang static | Không đồng nghĩa đã deploy; build bỏ lint theo config hiện hữu |
| PostgreSQL tạm | PASS 16/16 nhóm | PostgreSQL 18 trên máy, schema fixture tối thiểu, không phải clone production |
| Handler booking thật, DB/SMTP mock | PASS 9/9 nhóm | Có chạy POST handler, không chỉ tìm chuỗi source; không phải HTTP/PostgREST staging |
| Contract/mail của Terra-2 | PASS 14/14 nhóm + mailer assertions | Một số assertion của agent là kiểm tra source; mail transport mock |
| Giỏ hàng | PASS | 409/503, USD-only, quote, response malformed; storage trong bộ nhớ |
| CMS Luna-1 | PASS mock CMS01-CMS14 | Chưa chứng minh authenticated CRUD trên Supabase |
| Browser smoke | 60 lượt trang + 4 route auth/demo | 390/768/1440px, VI/EN/JP/KR/CN; không thay thế test toàn bộ nội dung/scroll/CRUD |
| Checkout tương tác cuối | PASS 3 viewport/timezone | Clock VN, hai dòng duration riêng qty 2/1, quote outage/recovery, submit 503 rồi retry cùng key/quote; booking request mock |
| Supabase đang cấu hình | FAIL release gate | Read-only `limit=0` và OpenAPI, không đọc thông tin khách |

Các test DB gồm: migration chạy lại, verifier, ACL anon/authenticated, counter private,
giá/status canonical, liên kết customer, 20 request cùng key chỉ tạo một booking,
30 key khác nhau không trùng mã, intent conflict, rollback toàn transaction,
không ghi đè hồ sơ khách, vượt 999, UTC/VN qua ngày, quote stale và race giá,
legacy key cần review, seed không đổi giá và chạy lại không đổi dữ liệu.

Browser smoke có 60 lượt trang HTTP 200, không pageerror/tràn ngang/ảnh hỏng trong
phạm vi quan sát; hai URL demo trả 404 đúng yêu cầu, admin protected về login và
không còn sidebar. Sau lần smoke này, bản sửa click retry/nhãn qty được build lại
PASS và chạy lại ba flow checkout, kiểm tra modal thực sự nằm trong viewport.

Bản smoke đầu không có pageerror/tràn ngang/ảnh hỏng nhìn thấy, nhưng xem screenshot
vẫn phát hiện logo và giờ chọn cũ. Hai lỗi này đã sửa. Không dùng “scrollWidth đúng”
để khẳng định toàn bộ layout đã đạt.

## 4. Các bước bắt buộc còn lại

### P0: dữ liệu và booking production

1. Chỉ định một staging Supabase độc lập và đúng version/schema của production. Không trỏ test ghi dữ liệu vào `.env.local` đang dùng DB thật.
2. Chạy `supabase/verification/20260907_p0_atomic_booking_idempotency_preflight_read_only.sql` trên staging và production. Lưu schema/index/ACL và số lượng duplicate/orphan, không xuất PII.
3. Nếu duplicate phone/email/billCode, orphan hoặc schema khác fixture: DỪNG. Không tự xóa/gộp hồ sơ, không tự sửa dữ liệu để migration pass.
4. Apply migration đã review trên staging trước. Chạy SQL verifier và test HTTP thực từ API đến RPC. Test anon/authenticated phải bị từ chối khi gọi RPC trực tiếp.
5. Đối chiếu snapshot giá `Services` trước/sau. Cả VND và USD phải không đổi; không tính USD từ VND theo tỷ giá tự đặt.
6. Chỉ khi staging PASS và chủ web phê duyệt mới apply production, verify, deploy nhánh `vercel`, rồi mở booking.
7. Với app/browser phiên bản cũ chưa có quote, yêu cầu reload. Không bật writer max+1 hoặc bỏ kiểm tra quote để hỗ trợ bản cũ.

### P1: quyết định và tích hợp cần xác nhận

- **Giờ nhận lịch:** đã thống nhất 09:00-22:30, cách nhau 30 phút. UI/API đã chặn mọi slot sau 22:30; đây là giờ bắt đầu nhận lịch, không phải giờ kết thúc liệu trình.
- **Phone:** parser agent hiện tự normalize, chưa dùng thư viện metadata số điện thoại quốc tế như yêu cầu plan. Cần test số hợp lệ/không hợp lệ từng quốc gia; không tuyên bố đã xác minh danh tính vì chưa có OTP.
- **Email:** local có SMTP và reception env; chưa kiểm tra cấu hình Vercel production, chưa gửi email thật trong lượt này. Cần test một thông báo staging có kiểm soát đến `nghik22@gmail.com`, không BCC người khác. Không gửi email trong test concurrency/retry.
- **Replay:** cần HTTP staging timeout sau commit, reload/back/đổi locale, đối chiếu cùng intent/cùng key không tạo đơn mới và không gửi lại email.
- **Giới hạn vận hành:** không có bằng chứng giữ chỗ phòng/KTV realtime. Không quảng bá slot hiển thị là năng lực đã được giữ; xác nhận quy trình tiếp nhận `NEW` với lễ tân.

### P2: nội dung/admin

- Apply seed nội dung trên staging sau review; chưa apply production. File bổ sung: `supabase/seeds/go_live_vip_descriptions_20260908.sql`.
- Admin mở sẵn nội dung hiệu lực cho đủ VI/EN/JP/KR/CN. Test save/refresh/public read-back bằng tài khoản admin trên staging.
- Kiểm tra toàn bộ paragraph, bullet, service description, caption, tag, CTA, loading/error; không chỉ heading hoặc số lượng key.
- Kiểm tra hai tab admin sửa cùng bản ghi: tab cũ phải conflict, không đè bản mới.
- Ảnh/video/watermark/crop/order và giá không được đổi khi chỉ sửa dịch. Test draft không hiện public; publish mới hiện đúng locale.
- Kiểm tra tương phản header trên nền sáng của Pure Relaxation và các phần dưới fold; smoke viewport đầu chưa phải visual approval toàn trang.
- Kiểm tra locale của tiêu đề/nút trong các AlertModal, không chỉ nội dung lỗi.

## 5. Ma trận nghiệm thu thao tác thực tế

Chạy desktop 1440x900, tablet 768x1024, mobile 390x844; thêm 320px và Safari iPhone
trước phát hành. Locale nội bộ: `vi/en/jp/kr/cn`. Timezone: Việt Nam, UTC, Los Angeles.

| ID | Thao tác | Kết quả bắt buộc |
| --- | --- | --- |
| FLOW01 | Thêm dịch vụ một duration, tăng 1→2, giảm về 1 | Qty/giá VND/USD đồng bộ; lựa chọn không mất |
| FLOW02 | Cùng service chọn hai duration/options khác nhau | Mỗi dòng riêng trong selected services, không gộp sai |
| FLOW03 | Mở “Add another option”, sửa một dòng | Chỉ dòng đang sửa đổi; cancel giữ dữ liệu |
| FLOW04 | Bật phòng riêng, qty 2; tắt rồi bật lại | Phụ phí NHS0900 từ DB đúng một lần mỗi đơn vị; không cộng lặp |
| FLOW05 | Dịch vụ Barber duration 0 | Không lỗi 503 do duration; giá nguyên DB |
| FLOW06 | Reprice 409/503, offline, response lỗi | Chặn xác nhận, thông báo rõ, giữ cart; phục hồi mạng retry được |
| FLOW07 | Đổi giá/catalog staging sau quote trước commit | 409, chưa tạo booking; hiển thị giá mới và yêu cầu xác nhận lại |
| FLOW08 | Sửa request giá/status/paid/id ở DevTools | Server dùng giá DB, NEW/WAITING; không tin giá hoặc trạng thái client |
| FLOW09 | Bấm xác nhận hai lần, timeout rồi retry | Một booking và một bộ item; không email lần hai |
| FLOW10 | Cùng key nhưng sửa khách/options/qty/date | 409, không trả thông tin booking của intent khác |
| FLOW11 | Replay sau khi catalog đổi hoặc giờ hẹn trôi qua | Trả snapshot cũ, không lấy giá mới, không tạo record mới |
| FLOW12 | SMTP down và cập nhật marker down sau commit | Booking vẫn success; không khuyến khích khách đặt lại |
| TIME01 | Browser UTC/VN/LA, cùng thời điểm thực | Ngày/slot theo VN; không hydration warning |
| TIME02 | 08:59, phút qua slot, sát giờ đóng cửa, qua nửa đêm | Không giữ slot quá hạn; không tự đổi giờ của khách |
| TIME03 | Để tab nền rồi quay lại, nhấn xác nhận | Clock refresh và validate giờ hiện tại trước submit |
| VAL01 | Tên VI/JP/KR/CN, dấu nháy; control chars; quá dài | Tên Unicode đúng được nhận; input xấu báo field error |
| VAL02 | Số VN/US/JP/KR/CN với country code và + quốc tế | Không ghép prefix hai lần; số sai bị từ chối rõ ràng |
| VAL03 | Email sai, CRLF header, HTML/script trong note | Không header injection/XSS; không log PII |
| VAL04 | Qty 0/-1/1.5/bool/>20; aliases mâu thuẫn | 400; không ghi DB |
| VAL05 | Focus/avoid giao nhau, enum lạ, tùy chọn bị service tắt | 400/409; không âm thầm bỏ lựa chọn khách |
| AUTH01 | Chưa login mở admin/API admin | Redirect login hoặc 401/403; không thấy sidebar/dữ liệu riêng |
| AUTH02 | Login bằng `admin `, logout, back/reload/direct URL | Alias hợp lệ; logout xóa session, không còn sidebar hay quyền API |
| CMS01 | Sửa một paragraph JP, save, refresh admin/public | Đúng đoạn JP; bốn locale khác không đổi |
| CMS02 | Thêm ảnh/video, mô tả, reorder và watermark từng khung | Preview/public nhất quán; không mất key/crop/format |
| CMS03 | Daily blog draft→publish với ảnh ngang/video | Nằm dưới nội dung cũ, giữ paragraph spacing, không Read note |
| CMS04 | Lost & Found gửi liên hệ | Validate thông tin, public không lộ claim/PII; admin xem đúng |
| NAV01 | Hotline/Google Map/LINE/WeChat/Tablet Continue | URL cấu hình admin đúng; không 404, không javascript URL |
| NAV02 | Trang demo và menu selector đã bỏ | Demo 404; không có link người dùng dẫn vào demo/selector cũ |
| UI01 | Scroll toàn trang + mở mọi drawer/modal | Không chồng logo/BOOK/badge/chat, không tràn; đóng bằng X/Escape |
| UI02 | VND/USD ở catalog→cart→confirm→snapshot | So sánh hai giá DB độc lập, không tỷ giá fallback sai |

Mỗi case lưu: run ID, commit/build ID, môi trường, timezone/viewport/locale, bước
tái hiện, expected/actual, ảnh hoặc trace, HTTP code, booking test ID. Không lưu secret,
cookie, authorization header hoặc dữ liệu khách thật trong artifact.

## 6. Phân công QA không giẫm nhau

| Người chạy | Phạm vi | Quyền ghi |
| --- | --- | --- |
| QA-DB | Migration/ACL/concurrency/rollback | DB test riêng; không CMS |
| QA-API | Validation/quote/replay/mail | Mock hoặc staging booking prefix run riêng |
| QA-UI | Responsive/timezone/qty/options/currency | Browser request booking mock; không seed |
| QA-CMS | 5 locale/admin/media/daily blog/Lost & Found | CMS staging riêng; không giá/catalog nghiệp vụ |

Một người điều phối duy nhất apply production và deploy. Không chạy build/dev dùng
chung `.next`. Không chạy các script booking cũ tự đọc `.env.local` để load test.

## 7. Chạy lại test an toàn

```sh
npx tsc --noEmit --incremental false
node --experimental-strip-types scripts/test-terra-2-booking-api.mjs
node --experimental-strip-types scripts/test-mailer-hardening.ts
node --experimental-strip-types scripts/test-go-live-api.mjs
node scripts/test-go-live-cart.mjs
node scripts/test-booking-route-control-flow.mjs
node scripts/test-luna-1-cms.mjs
node scripts/test-go-live-db.mjs
NEXT_DIST_DIR=.next-go-live npm run build
NEXT_DIST_DIR=.next-go-live npm run start -- --port 3108 --hostname 127.0.0.1
node scripts/test-go-live-browser.mjs
node scripts/test-go-live-checkout.mjs
```

DB runner dùng `embedded-postgres` cài riêng tại `/private/tmp/oria-go-live-pg`, không
thêm dependency vào app, không đọc `.env` và không nhận remote DB URL. Có thể chỉ định
đường dẫn module bằng `TEST_PG_MODULE`. Port DB loopback 55489; data mới mỗi run;
server DB được dừng trong `finally`. Máy khác cần cài gói test tương ứng trước.

Artifacts browser: `/private/tmp/oria-go-live-browser/` và
`/private/tmp/oria-go-live-checkout/`. Chỉ là dữ liệu QA, không đưa build/cache lên Git.

## 8. Điều kiện ký GO

- P0 staging và production verifier PASS; DB schema đúng, không writer cũ bypass.
- FLOW/TIME/VAL được nghiệm thu trên đường HTTP thật của staging, không chỉ mock.
- Giờ nhận lịch thống nhất; reception production được xác nhận; một email test được nhận.
- Nội dung 5 locale và admin read-back PASS; giá/media không đổi ngoài ý định.
- Zero crash/unhandled error, không P0/P1 mở; mobile/Safari được kiểm tra.
- Có người theo dõi lỗi, booking mới và email pending sau phát hành.

Nếu cần rollback: dừng nhận booking bằng phản hồi 503 có thông báo trước; giữ nguyên
booking/item/customer/counter đã commit. Không DROP bảng/cột mới và không rollback
sang writer max+1 thiếu atomic. Sửa forward rồi nghiệm thu lại trước khi mở.

Tài liệu kỹ thuật đã đối chiếu: [Next.js 15 distDir](https://nextjs.org/docs/15/app/api-reference/config/next-config-js/distDir),
[embedded-postgres](https://github.com/leinelissen/embedded-postgres). Thư mục docs Next cục bộ không có trong bản cài này.
