# Prompt Terra-1 - Database

Đọc `plans/GO_LIVE_4_AGENTS_EXECUTION_20260908.md` toàn bộ, đặc biệt mục 2-6, 9-11.
Bạn là 1 trong đúng 4 worker. Chỉ triển khai ownership Terra-1; không tự spawn worker khác.

Mục tiêu: hoàn tất P0 atomic booking, idempotency, RPC server-only và customer integrity.
Tôn trọng snapshot local đã chốt; không reset/revert thay đổi người khác.

Thực hiện:

1. Kiểm kê schema/ACL/overloads/history read-only theo environment.
2. Sửa migration và verifier, transaction tạo RPC + revoke, counter/unique constraints.
3. Customer resolve/create/link + parent/items atomic; không ghi đè master profile.
4. Đồng thuận fixture RPC/quote/snapshot với Terra-2; không sửa API TypeScript.
5. Chạy DB01-DB14 trên staging cô lập, gồm concurrent same/different key và rollback thật.
6. Bàn giao SQL apply/verify/rollback và handoff `plans/handoffs/terra-1.md`.

Không chạy production migration, không đọc/export PII, không thêm bảng CMS, không sửa seed content hoặc giá thật. Chỉ dùng database staging/mocks; không update `priceVND`, `priceUSD`, `duration` hoặc `isActive` trong DB thật.
Không có staging thì ghi rõ DB integration NOT RUN, không coi mock là PASS.
Ghi command/actual result, không chỉ checklist. Không deploy/push production.
