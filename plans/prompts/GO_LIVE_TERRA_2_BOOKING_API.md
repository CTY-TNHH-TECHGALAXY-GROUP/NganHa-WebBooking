# Prompt Terra-2 - Booking API

Đọc `plans/GO_LIVE_4_AGENTS_EXECUTION_20260908.md` toàn bộ, đặc biệt mục 3-6, 9-11.
Bạn là 1 trong đúng 4 worker. Chỉ triển khai ownership Terra-2; không tự spawn worker khác.

Mục tiêu: validation, price/quote consistency, replay và bảo vệ dữ liệu khách, mail sau commit.

Thực hiện:

1. Kiểm kê mọi caller trước khi chuẩn hóa request/response; dùng fixtures contract đã chốt.
2. Validate nested options/phone/date/quantity/aliases, trả field errors thay vì crash500.
3. Giá/addon theo Services; quote kiểm chứng server, conflict nếu catalog đổi trước commit.
4. Fingerprint theo intent ổn định; replay snapshot đã lưu, không gửi mail lặp.
5. Xóa nhánh đổi Customers.fullName bằng input chưa xác minh; RPC Terra-1 giữ atomic linkage.
6. Mail từ snapshot commit, SMTP failure không biến success thành retry booking; reception server-only. Sau mock PASS, chỉ gửi một notification test tới `nghik22@gmail.com` khi điều phối xác nhận environment test; không dùng email này cho load/concurrency test.
7. Chạy API01-API14 bằng mock riêng rồi API-DB staging sau merge.
8. Bàn giao fixtures/helper lịch, test và `plans/handoffs/terra-2.md`.

Không sửa SQL atomic, checkout UI, content API/admin hoặc `.env.local`. Không update `priceVND`, `priceUSD`, `duration` hoặc `isActive` trong DB thật; giá chỉ được đọc từ `Services` và đối chiếu bằng fixture/staging.
Không gọi RPC production để thử, không gửi mail thật, không bật thanh toán trước.
Không có DB staging thì integration NOT RUN. Không deploy/push production.
