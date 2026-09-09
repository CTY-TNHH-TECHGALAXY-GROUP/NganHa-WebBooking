# Nghiem thu customer flow local - 09/09/2026

## Ket luan: BLOCKED, chua du dieu kien nghiem thu

Target: http://localhost:3109/en/new-user/standard/checkout
Source local hien tai, ket noi DB/SMTP tu .env.local.
Email nhan du kien: nghik22@gmail.com.
Thao tac bang trinh duyet, khong mock booking/reprice, khong goi API thay cho click Submit.

## Ket qua da thuc hien

Ca 01: Mo checkout -> Open Add services -> VIP PACKAGE -> Add Combo King -> Select 120 mins -> Custom for you (Medium, Random) -> Save.
Gio hien Combo King x1, 120 mins, 1.575.000 VND / 66 USD.
Nhap QA Local 01, email nhan test, so test nguoi dung cung cap, chon Vietnam +84.
Chon 10/09/2026 luc 14:00 -> Confirm order.
Reprice tra 200; modal Confirm Booking hien dung dich vu, gia va email.
Sau khi nguoi dung xac nhan dieu khoan: tick checkbox -> SUBMIT that.
Server log: POST /api/bookings 503 in 2970ms.
UI: "The booking system is temporarily unavailable. Your details and cart are kept; please try again."
Khong co ma don thanh cong. Chua toi nhanh gui email xac nhan. Khong gui email bao cao thay cho email booking.

## Blocker da kiem tra

Doc metadata Supabase cua cau hinh local, HTTP 200:
- Bookings.idempotency_key: khong co.
- Bookings.idempotency_fingerprint: khong co.
- /rpc/create_booking_atomic: khong co.

src/app/api/bookings/route.ts goi create_booking_atomic truoc khi gui email.
Can lien ket lai voi contract tiep nhan don dang ton tai cua he thong dieu phoi, hoac co phuong an tich hop duoc owner he thong chap thuan.
Khong tu chay migration cu, sua enum/status, doi gia hay chen don truc tiep de lam test pass.

## 10 truong hop nghiem thu

| Ca | Lua chon/thao tac | Trang thai |
| --- | --- | --- |
| 01 | Combo King 120 phut x1, Medium, Random; submit | FAIL: API 503, khong den buoc email |
| 02 | Body care, Aroma 60 phut x1 | NOT RUN: blocker tao don chung |
| 03 | Aroma x2, kiem tra tong gia va so luong trong mail | NOT RUN |
| 04 | Cung dich vu Aroma, 2 duration khac nhau, giu 2 dong | NOT RUN |
| 05 | Body care + Private Room, kiem tra gia add-on | NOT RUN |
| 06 | Foot care, chon therapist/strength neu catalog cho phep | NOT RUN |
| 07 | Ear clean, dich vu don le | NOT RUN |
| 08 | Barber + Foot care, 2 dich vu khac nhom | NOT RUN |
| 09 | Them dich vu, sua option/duration, xoa mot dong truoc submit | NOT RUN |
| 10 | Menu premium, tuy chon duoc catalog ho tro, submit | NOT RUN |

Ca 02-10 la ke hoach, chua phai ket qua test. Khi mo lai can chon theo catalog thuc te.
Moi ca chi PASS end-to-end khi co ma don, du lieu dung va email booking tu dong duoc xac minh.
Inbox nguoi nhan chua duoc truy cap. SMTP accepted (neu co) khong dong nghia inbox da nhan.

## Quan sat phu

Header hien "Cart, 0 services selected" trong khi invoice co Combo King x1: can kiem tra dong bo badge.
Mot so thao tac dien input qua automation khong phan anh gia tri trong AX/DOM snapshot; screenshot va modal Confirm Booking da xac nhan lien he dung. Khong ket luan day la loi input cua website.
Server 3004 timeout; server rieng 3109 da khoi dong va compile thanh cong.
