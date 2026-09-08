# Plan nghiệm thu: CMS sửa media và giữ customer flow

Ngày: 08/09/2026. Trạng thái: IMPLEMENTED (media-only boundary + CMS isolation); runtime browser/production acceptance vẫn cần chạy theo ma trận bên dưới.
Phạm vi tổng: [GO_LIVE_FINAL_STEPS_20260908.md](./GO_LIVE_FINAL_STEPS_20260908.md).

## 1. Quyền đã chốt

| Nội dung | Được xem | Được sửa trong admin web |
| --- | --- | --- |
| ID, tên và mô tả dịch vụ 5 ngôn ngữ | Có, từ catalog hiện hữu | Không |
| Giá VND/USD, thời lượng, category, active, tags và options nghiệp vụ | Có để đối chiếu dịch vụ | Không |
| Ảnh/video gắn đúng dịch vụ | Có và preview | Có |
| Crop/focal point, watermark, poster/thumbnail media | Có khi cấu hình hiện hữu hỗ trợ | Có trong storage media hiện hữu |
| Content trang, blog, Our Story, SEO, caption biên tập | Có | Có theo editor CMS và quyền hiện tại |
| Đơn/khách hàng/phòng/KTV/trạng thái/thanh toán | Thuộc Admin điều phối riêng | Không quản lý trong CMS web |

Quyền đọc dịch vụ không mở rộng thành quyền đọc danh sách khách/đơn. Trong đợt này, "không sửa dịch vụ" bao gồm tên/mô tả catalog; nội dung biên tập của trang vẫn chỉnh được. Bản dịch catalog thiếu là việc bàn giao cho hệ thống quản lý catalog, không tạo dữ liệu tên/giá thay thế ở web.
Mọi role CMS, kể cả owner/admin, đều tuân thủ giới hạn catalog này; không tạo ngoại lệ ghi nghiệp vụ chỉ vì có role cao hơn.

## 2. Những đường code phải xử lý trước nghiệm thu

| File | Hiện tại | Thay đổi cần làm |
| --- | --- | --- |
| src/app/admin/services/ServiceEditModal.tsx | Input tên/mô tả, giá, duration, category, active; PUT toàn form | Hiển thị thông tin dịch vụ chỉ đọc, đưa phần chọn ảnh/video phù hợp vào editor; payload chỉ gồm media |
| src/app/admin/services/pure/page.tsx | Đọc catalog, lưu media qua content API; PATCH tên/mô tả catalog riêng | Giữ catalog để nhận diện; bỏ hành vi lưu tên/mô tả catalog, giữ chỉnh media và nội dung biên tập |
| src/app/api/admin/services/[id]/route.ts | PUT ghi nhiều field catalog; PATCH ghi tên/mô tả | Đặt allowlist media rõ ràng; khóa đường PATCH catalog cũ, không để method thay thế bypass |
| src/app/api/services/route.ts | GET catalog và media; lọc active | Giữ contract public và cách lọc hiện hữu; không mở public dữ liệu nội bộ để phục vụ CMS |
| src/app/api/admin/content/route.ts và helper media | Lưu cấu hình theo key content | Xác minh media không cho chèn giá/ID/active rồi trở thành nguồn nghiệp vụ ở public renderer |
| src/app/admin/bookings, src/app/admin/customers, src/app/api/admin/bookings/** | Route điều phối dư vẫn tồn tại | Kiểm kê caller rồi vô hiệu hóa tại web; giữ /admin/history vì là lịch sử thương hiệu |

Khả năng xem dịch vụ inactive trong CMS nếu cần phải dùng đường đọc đã xác thực; không bỏ bộ lọc active của public API. Không thêm scope quản lý catalog.

## 3. Contract media cần chốt khi implement

1. Lập mapping mỗi khung: service ID hoặc khóa nội dung hiện hữu -> storage -> public consumer. Pure Relaxation đang dùng key pure_relaxation_media; service media có media_url/media_type. Xác minh precedence để lưu đúng nơi web thực sự đọc.
2. Dùng cơ chế định danh hiện hữu đã kiểm chứng; không dựa vào index list hoặc tự đổi khóa tên dịch vụ mà thiếu bước tương thích. Kiểm tra đổi ngôn ngữ không làm media nhảy sang dịch vụ khác.
3. Payload write chỉ có field media được hỗ trợ và metadata kiểm tra revision. Không gửi lại object dịch vụ đã đọc. Với endpoint dùng media_url/media_type, URL và type phải khớp; không bổ sung cột mới.
4. Request chứa field catalog bị cấm hoặc field lạ: trả 400 với code/field error ổn định và không cập nhật một phần, kể cả request gồm ảnh hợp lệ kèm priceVND. Chưa login trả 401; không có quyền CMS trả 403; ID không tồn tại trả 404.
5. PUT/PATCH cũ phải chặn payload catalog; method không hỗ trợ trả 405. Kiểm kê cả POST/DELETE/bulk/import/endpoint content để không còn đường tạo/xóa/sửa dịch vụ qua CMS.
6. Validate URL/protocol và kiểu media theo helper hiện có; cấm javascript URL. Upload kiểm tra MIME thực tế/size theo cấu hình storage đã kiểm kê; không tự cấp quyền bucket hay chuyển bucket private thành public. File sai/lỗi mạng không thay media đang lưu.
7. Update đúng các cột/key media cần đổi. Metadata hệ thống tự cập nhật bởi trigger hiện hữu phải được nhận diện riêng; không dùng full row replace làm mất catalog hoặc metadata khác.
8. Nếu hai tab sửa cùng media: dùng revision/compare-and-set hiện hữu hoặc điều kiện so sánh giá trị cũ. Tab cũ trả 409 và giữ draft. Không cần thêm schema chỉ để test conflict.
9. Cancel không ghi. Xóa liên kết media chỉ tác động khung được chọn; không xóa vật lý file dùng chung. Upload mới trước, xác nhận lưu xong mới đổi liên kết.
10. Audit read-only quyền Supabase của session CMS: API allowlist chưa đủ nếu session vẫn có thể update Services trực tiếp. Nếu quyền DB chung đang cho phép điều đó, ghi blocker và bàn giao owner hệ thống; không thay RLS chung trong đợt web này, không báo đã khóa tuyệt đối chỉ dựa trên UI.

## 4. Phase và điều kiện bắt đầu test

### Phase A: chuẩn bị baseline (Terra-1, chỉ đọc)

- Xác minh build/deployment SHA, version source, storage/key media và contract tiếp nhận booking đang chạy.
- Chọn fixture: dịch vụ một duration, nhiều duration, add-on, duration 0 hợp lệ, dịch vụ inactive. Có ID ổn định và giá VND/USD riêng.
- Ghi snapshot field catalog cần bảo toàn, media trước thay và cart mẫu. Dùng dữ liệu catalog/fixture, không xuất PII.
- Lập danh sách đường write CMS và quyền role/session. Môi trường write test dùng dữ liệu riêng; production chỉ đọc ở bước chuẩn bị.
- Output: baseline + mapping + dữ liệu test + blocker tích hợp. Nếu thiếu RPC hiện tại thì ghi đúng dependency, không chạy migration để test pass.

### Phase B: hoàn thiện quyền media và UI (Luna-1)

- Áp dụng mục 2-3, giữ thông tin dịch vụ đủ để nhận diện ảnh/video cần chỉnh.
- Hoàn thiện preview/loading/error/save/cancel, đồng bộ admin/public, khóa route điều phối dư.
- Có test server thực thi handler với DB mock, browser interaction và kiểm tra read-back ở môi trường riêng. Xong Phase B mới đánh dấu sẵn sàng nghiệm thu quyền CMS.

### Phase C: test song song (Terra-2 + Luna-2 + Luna-1)

- Terra-2 kiểm tra validation, tích hợp submit/retry/email theo contract cũ đã xác minh; không SQL nghiệp vụ mới.
- Luna-2 test responsive, giờ 22:30, qty/options, cart và media trên các trang public.
- Luna-1 test editor content/5 locale và permission media; sửa lỗi trong phạm vi sở hữu.
- Terra-1 đối chiếu dữ liệu trước/sau và evidence handoff; không ghi DB thật để load test.

### Phase D: nghiệm thu tích hợp và release (điều phối)

- Tích hợp tuần tự và review diff. Build output riêng, không cùng thư mục với dev server đang chạy.
- Chạy flow media -> public -> cart -> confirm -> hệ thống điều phối. Đơn/email kiểm soát dùng nghik22@gmail.com theo quyền đã cho phép, có người vận hành đối chiếu; không tự xóa đơn sau test.
- Chỉ đưa patch tương thích lên nhánh vercel. Không push/deploy hoặc chạy migration tự động từ worker.

## 5. Ma trận nghiệm thu

Tất cả case dưới đây bắt đầu là NOT RUN; PASS cần bằng chứng actual. Test tấn công payload, concurrency và lỗi ghi thực hiện trong mock/môi trường riêng, không trên catalog thật.

| ID | Kịch bản | Expected |
| --- | --- | --- |
| CAT01 | Mở danh sách/chọn dịch vụ, đổi locale | Đọc đúng ID/tên/giá/thời lượng/trạng thái; thông tin catalog chỉ đọc |
| CAT02 | Chọn hai duration cùng tên, đổi ảnh một khung | Media áp dụng đúng phạm vi khung đã định nghĩa; ID/duration không đổi |
| CAT03 | Request ảnh hợp lệ kèm priceVND/priceUSD/duration/isActive/category | 400, không ghi cả media lẫn catalog |
| CAT04 | PUT/PATCH tên/mô tả/tags/options, ID giả mạo và unknown fields | Bị từ chối; catalog giữ nguyên |
| CAT05 | POST/DELETE/bulk route hoặc content override giả giá | Không tạo/xóa dịch vụ, không thay nguồn giá/active của customer flow |
| CAT06 | Session owner/admin/editor và chưa login | Chỉ role CMS được sửa media; mọi role bị cấm ghi catalog, chưa login 401 |
| CAT07 | Kiểm tra quyền DB trực tiếp bằng metadata/môi trường riêng | Chứng minh có/không đường bypass; nếu có ghi BLOCKED, không sửa RLS chung |
| MED01 | Ảnh -> ảnh khác -> save -> refresh admin/public | Đúng ảnh mới, đúng khung, catalog trước/sau bằng nhau |
| MED02 | Ảnh -> video -> ảnh | Type/source đồng bộ, video tải được, poster/crop theo cấu hình, không overlay chồng |
| MED03 | Chọn ảnh/video rồi cancel | Media lưu hiện tại nguyên vẹn |
| MED04 | URL sai/protocol lạ, MIME/size sai, upload lỗi | Báo lỗi; không lưu nội dung sai, không mất media cũ |
| MED05 | Hai tab sửa cùng media | Lưu đầu thành công, tab cũ 409 giữ draft, không đè thay đổi mới |
| MED06 | Đổi crop/watermark/poster | Public khớp preview; chỉ thay metadata media cho phép |
| MED07 | Media được dùng ở nhiều khung; bỏ ở một khung | Các khung khác vẫn tải được; không xóa file chung |
| MED08 | Media lỗi/đang tải trên Pure Relaxation | Loading nền đen theo yêu cầu; không nháy ảnh demo mặc định |
| CMS01 | Content trang ở VI/EN/JP/KR/CN | Toàn đoạn, CTA và error đúng locale; tên/mô tả catalog vẫn từ nguồn |
| CMS02 | Save một locale, hai tab conflict | Bốn locale khác giữ nguyên; conflict giữ draft |
| CMS03 | Daily blog/Our Story/History/Journey/Lost & Found | Ảnh/video/caption/spacing/reorder đúng phạm vi editor; draft/publish đúng |
| CMS04 | Catalog thiếu bản dịch | Ghi nhận thiếu; không seed/write catalog hoặc báo đủ 5 ngôn ngữ khi còn fallback |
| AUTH01 | Direct route/API quản lý đơn dư bằng session CMS | Không đọc danh sách khách/đơn hay cập nhật status; Admin điều phối riêng nguyên vẹn |
| AUTH02 | Logout, back, reload; cart đang có | CMS mất quyền, không còn sidebar; cart khách không bị xóa ngoài ý định |
| FLOW01 | Chọn dịch vụ, qty 1->2, add another option | Dòng lựa chọn riêng, badge và tổng giá DB đúng |
| FLOW02 | Cart đã chọn, admin thay media, khách reload | Media cập nhật theo consumer; cart ID/qty/options/giá/duration không đổi |
| FLOW03 | VND/USD, add-on và duration 0 hợp lệ | Dùng giá DB, không tỷ giá tự tính hoặc giá fallback |
| FLOW04 | Slot 09:00/22:30, 08:30/22:31/23:00; tab qua giờ | Hợp lệ theo giờ VN, chặn giờ sai/quá hạn ở client/server |
| FLOW05 | Offline, quote lỗi, timeout sau commit và retry | Giữ lựa chọn; một đơn đầy đủ theo cơ chế đã xác minh; không báo thành công giả |
| FLOW06 | Booking handoff tới Admin điều phối riêng | Đúng ID, service lines/qty/options, tổng tiền, giờ, trạng thái theo contract hiện hữu |
| FLOW07 | Notification thành công/lỗi/retry | Đúng bên gửi và recipient; không email lặp, không đè ghi chú lễ tân |
| UI01 | 390/768/1440px, Safari mobile, 5 locale | Không crash/tràn ngang; media rõ; modal/CTA/Google badge/chat không chồng |
| UI02 | Homepage/flipbook/back, hotline/map, QR TRANSFER | Flow hiện hữu nguyên vẹn, CTA không 404; không popup yêu cầu trả trước |

## 6. Evidence và điều kiện GO

Mỗi case lưu: ID, môi trường/SHA, role, locale/viewport, expected/actual, HTTP code, screenshot/trace hoặc assertion, catalog field diff và người test. Artifact không chứa secret/cookie hoặc PII khách thật.

- P0/P1 mới chỉ được PASS sau khi test quyền write và handoff thật hoàn tất; test mock/build cũ không thay được các case mới.
- Snapshot giá/tên/mô tả/duration/options/active và liên kết ID trước/sau media phải không thay đổi; giải thích riêng metadata do trigger cập nhật nếu có.
- Không có đường CMS sửa đơn/catalog; GET dịch vụ vẫn hoạt động. Media và nội dung biên tập vẫn lưu/preview/read-back được.
- Các bản dịch catalog thiếu được liệt kê riêng. Mục tiêu đủ 5 ngôn ngữ chỉ hoàn tất khi nguồn quản lý catalog cũng đã cung cấp phần còn thiếu.
- Patch booking chỉ được phát hành khi tương thích đường tiếp nhận hiện có. RPC/cột thiếu là blocker phải giải quyết bằng tích hợp đã xác minh, không bằng SQL ngoài phạm vi.
- Release content/media có thể tách khỏi booking patch sau kiểm tra dependency và regression customer flow; không tự coi mọi thay đổi trong worktree là một release an toàn.

Không có bước tạo bảng/enum/RPC, đổi giá thật, sửa schema Admin điều phối hoặc xóa dữ liệu nghiệp vụ trong plan này.
