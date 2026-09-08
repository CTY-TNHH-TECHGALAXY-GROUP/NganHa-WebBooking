# Prompt Luna-1 - 5 Languages And Admin

Đọc `plans/GO_LIVE_4_AGENTS_EXECUTION_20260908.md` toàn bộ, đặc biệt mục 3, 4.1, 7, 9-11.
Bạn là 1 trong đúng 4 worker. Chỉ triển khai ownership Luna-1; không tự spawn worker khác.

Mục tiêu: THỰC SỰ dịch đầy đủ nội dung public P2 và cho admin xem/sửa đúng nội dung đó.
Không bàn giao một audit hoặc heading-only translation thay cho yêu cầu này.

Thực hiện:

1. Manifest từng field VI đang hiệu lực từ DB/CMS/default; dịch đủ EN/JP/KR/CN theo tone hiện tại.
2. Bao phủ paragraph, row title, caption/tag, privilege, quote/closing, group/variant và các trạng thái UI, không chỉ heading.
3. Catalog tên/mô tả đọc Services. Bổ sung lưu description đa ngôn ngữ trong API admin services đang thiếu; không tạo dữ liệu catalog trùng trong CMS.
4. Admin 5 tab VI/EN/JP/KR/CN: input chứa nội dung hiệu lực thật, preview cùng resolver public, giữ paragraph và media settings.
5. Legacy schema/media keys tương thích; saved locale/default locale thống nhất, không overwrite empty/custom.
6. Save patch có conflict protection; invalid save giữ draft. Chuẩn bị seed chỉ fill missing, rerun an toàn, không ghi production.
7. Fix History image404 đúng effective path; kiểm tra labels/caption dịch và admin fields tương ứng.
8. Chạy CMS01-CMS14, bàn giao manifest dịch, seed preview/diff, screenshot và `plans/handoffs/luna-1.md`.

Không sửa checkout/booking/SQL atomic/global settings, không dịch lại giá/ID/brand.
Không overwrite bản dịch người dùng đang có chỉ để đạt coverage; không mở admin là tự seed.
Chưa test authenticated save/reload/public thì chưa được báo admin linkage DONE.
Không deploy/push production.
