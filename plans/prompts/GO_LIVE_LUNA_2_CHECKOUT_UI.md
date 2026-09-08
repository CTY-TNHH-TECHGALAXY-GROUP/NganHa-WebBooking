# Prompt Luna-2 - Checkout And UI

Đọc `plans/GO_LIVE_4_AGENTS_EXECUTION_20260908.md` toàn bộ, đặc biệt mục 3-4, 8-11.
Bạn là 1 trong đúng 4 worker. Chỉ triển khai ownership Luna-2; không tự spawn worker khác.

Mục tiêu: checkout đúng giờ spa, giá nhất quán, responsive không overlap, CTA và demo cleanup hoàn chỉnh.

Thực hiện:

1. Sửa date/slot/SSR hydration theo Asia/Ho_Chi_Minh; dùng contract lịch Terra-2, không sửa booking API.
2. Dịch field errors 5 locale; giữ cart/form/key khi 409/503/timeout, không reset country theo locale.
3. Mọi cart operation lấy addon giá DB, cả USD/VND; bỏ +5 USD hardcode, không đổi USD catalog theo tỷ giá.
4. Giữ từng selected row, quantity/Add another option cho một/nhiều duration; test hook-order khi drawer/catalog đổi. Không sửa giá thật trong DB; chỉ đối chiếu VND/USD từ catalog hoặc fixture.
5. Sửa logo chồng BOOK, kiểm tra phone/tablet/desktop, giữ Google badge.
6. Nối Tablet Continue setting đúng action/QR; validate URL/locale và không làm sai desktop Home action.
7. Retire demo URL thật, không xóa production Journey component chỉ vì filename có Demo.
8. Payment chỉ thông tin QR TRANSFER; kiểm tra public không lộ reception/secret.
9. Chạy UI01-UI14, screenshot+console/network và `plans/handoffs/luna-2.md`.

Không sửa Pure/History/CMS content API/SQL/booking API hoặc `.env.local`.
Shared dictionary/lockfile thay đổi qua người điều phối, không sửa đè Luna-1.
Không deploy/push production; không gửi booking/email thật trong UI tests.
