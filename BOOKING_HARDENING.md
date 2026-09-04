# BOOKING_HARDENING.md — Architecture & Security Reference

Tài liệu này mô tả chi tiết toàn bộ các giải pháp củng cố hệ thống đặt lịch (Booking Hardening) đã được triển khai trên repository `NganHa-WebBooking`.

---

## 1. Cart Storage Schema v2 & Cơ Chế TTL / Migration

### A. Schema Định dạng v2
Khóa lưu trữ mới: `nganha_booking_cart_v2`. Khóa cũ `nganha_booking_cart_v1` và các khóa legacy (`BOOKING_CART`, `booking_cart`) tự động được chuyển đổi và thu hồi.

```typescript
export interface CartStorageSchemaV2 {
  version: 2;
  createdAt: number;   // Timestamp khởi tạo giỏ
  updatedAt: number;   // Timestamp cập nhật gần nhất
  expiresAt: number;   // Timestamp hết hạn (TTL 7 ngày)
  items: CartItem[];   // Danh sách các dịch vụ trong giỏ
}
```

### B. Quy tắc hoạt động:
1. **Thời gian sống (TTL):** Khai báo hằng số `CART_TTL_MS = 7 * 24 * 60 * 60 * 1000` (7 ngày).
2. **Auto-Purge & Corrupt JSON Safety:**
   - Khi load giỏ hàng, nếu `Date.now() > expiresAt`, giỏ hàng sẽ tự động được dọn sạch (`clearBookingCart()`), không cho phép giữ giá quá hạn.
   - Nếu dữ liệu trong LocalStorage bị lỗi cú pháp JSON do can thiệp ngoài, hàm đọc giỏ sẽ bẫy lỗi và xóa dữ liệu hỏng, trả về `[]`, bảo đảm không bao giờ gây crash màn hình React.
3. **Migration mượt mà:**
   - Nếu phát hiện dữ liệu ở `v1`, hàm sẽ tự động đóng gói dữ liệu sang cấu trúc `v2`, cấp hạn sử dụng 7 ngày mới, lưu vào `v2` và xóa sạch khóa `v1`.
4. **Server Reprice Sync:**
   - Hàm `revalidateCartWithServer()` tự động gọi endpoint `/api/bookings/reprice` khi vào trang checkout để cập nhật giá canonical từ DB Supabase và loại bỏ các dịch vụ đã bị vô hiệu hóa (`isActive === false`).

---

## 2. Booking API Contract & Server-Authoritative Pricing

### A. Endpoint `POST /api/bookings/reprice`
Dùng để kiểm định và định giá giỏ hàng phía máy chủ trước hoặc trong khi checkout.

**Payload:**
```json
{
  "items": [
    {
      "id": "NHS1002",
      "quantity": 1,
      "options": {
        "addons": { "privateRoom": true }
      }
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "valid": true,
  "hasPriceChanged": false,
  "unavailableItems": [],
  "totalAmountVND": 895000,
  "totalAmountUSD": 38,
  "items": [
    {
      "id": "NHS1002",
      "quantity": 1,
      "basePriceVND": 790000,
      "priceVND": 895000,
      "duration": 90,
      "hasPrivateRoom": true
    }
  ]
}
```

### B. Endpoint `POST /api/bookings`
Nhận lệnh đặt lịch chính thức. **Không tin tưởng bất kỳ giá tiền hoặc thời lượng nào do client gửi lên.**

**Request Payload:**
```json
{
  "idempotencyKey": "idemp_1725510000_abc123",
  "name": "Nguyen Van A",
  "phone": "+84901234567",
  "email": "customer@example.com",
  "customerGender": "male",
  "note": "Khách thích uống trà ấm",
  "date": "2026-09-10",
  "time": "14:30",
  "branchName": "ORIA SPA",
  "guests": 2,
  "staffGender": "female",
  "lang": "vi",
  "selectedServices": [
    {
      "variantId": "NHS1002",
      "quantity": 2,
      "options": {
        "strength": "MEDIUM",
        "bodyParts": { "focus": ["HEAD", "NECK"], "avoid": [] },
        "addons": { "privateRoom": true }
      }
    }
  ],
  "paymentMethod": "cash_vnd"
}
```

**Server Validation Rules:**
1. Trích xuất danh sách service ID và truy vấn bảng `Services` trong Supabase.
2. Kiểm tra tồn tại và cờ `isActive === true`.
3. Giới hạn số lượng hợp lệ: `1 <= quantity <= 20`.
4. Tính toán giá gốc từ `Services.priceVND`. Nếu có add-on phòng riêng (`options.addons.privateRoom === true`), cộng thêm đơn giá phòng riêng từ DB (`NHS0900`: 105,000₫).
5. Tính tổng tiền `totalAmount = sum(canonicalPrice * quantity)`. Client gửi `priceVND: 0` hay bất kỳ giá nào đều bị bỏ qua hoàn toàn.

---

## 3. Error Codes & Frontend Handling

| HTTP Status | Error Code | Mô tả | Xử lý ở Frontend |
|---|---|---|---|
| `400` | `INVALID_PAYLOAD` | Thiếu tên hoặc không có dịch vụ. | Hiển thị alert lỗi nhập liệu. |
| `409` | `CART_REQUIRES_REVIEW` | Có dịch vụ không tồn tại hoặc đã ngừng hoạt động (`isActive: false`). | Kích hoạt `revalidateCartWithServer()`, làm mới giỏ hàng và thông báo cho người dùng kiểm tra lại giỏ. |
| `500` | `ROLLBACK_TRIGGERED` | Lỗi khi khởi tạo chi tiết dịch vụ `BookingItems`. | Hệ thống tự động hoàn tác xóa Booking mồ côi và thông báo thử lại. |

---

## 4. Race-Safe Collision-Free Booking IDs & Idempotency

### A. Cơ chế sinh mã đơn không dùng `count(*)`
Hàm `generateCollisionSafeBookingId()` kết hợp:
- Tiền tố: `WB`
- Ngày đặt lịch: `ddmmyyyy`
- Entropy thời gian (Base36): 4 ký tự
- Entropy ngẫu nhiên mật mã (`crypto.randomBytes(3)`): 6 ký tự Hex

*Ví dụ mã đơn:* `WB-05092026-1D4CFC5993`  
*Khả năng trùng lặp:* Triệt tiêu 100% nhờ kết hợp timestamp millisecond và 16.7 triệu hoán vị ngẫu nhiên trên từng mili-giây.

### B. Cơ chế Idempotency
- Client gửi `idempotencyKey` trong body hoặc qua header `Idempotency-Key`.
- Server kiểm tra trong bảng `Bookings` theo trường `idLegacy = 'idemp:' || idempotencyKey`.
- Nếu phát hiện đơn hàng đã được tạo trước đó với key này (do click đúp hoặc mạng lag gửi lại), server trả về ngay thông tin đơn cũ với cờ `idempotent: true`, tuyệt đối không tạo đơn trùng lặp trong cơ sở dữ liệu.

---

## 5. Atomic Creation & Compensation Rollback

1. **Transaction Flow:**
   - BƯỚC 1: Insert bản ghi `Bookings`.
   - BƯỚC 2: Insert toàn bộ các bản ghi `BookingItems` (dịch vụ chính và add-on `NHS0900`).
   - BƯỚC 3: Nếu BƯỚC 2 thất bại -> Kích hoạt lệnh Rollback bù trừ ngay lập tức:
     ```typescript
     await supabase.from('Bookings').delete().eq('id', bookingId);
     ```
     Đảm bảo **không bao giờ để lại đơn hàng ma (Ghost Booking)** không có chi tiết dịch vụ trong database.
   - BƯỚC 4: Chỉ gửi email xác nhận cho khách hàng (`sendBookingConfirmationEmail`) khi cả BƯỚC 1 và BƯỚC 2 đều thành công 100%.

2. **Migration SQL:**
   File migration được cung cấp tại `supabase/migrations/20260905_atomic_booking_system.sql`, bao gồm:
   - Index chống trùng lặp `idx_bookings_idlegacy_idempotency`
   - Unique Index `idx_bookings_billcode_unique`
   - Stored Procedure `create_booking_atomic(...)` hoàn chỉnh với khối giao dịch Postgres `BEGIN ... EXCEPTION ... ROLLBACK ... COMMIT`.

---

## 6. Customer Demographics Persistence

- **Cột cơ sở dữ liệu:** `Bookings.customerGender` và `Customers.gender`.
- **Ánh xạ chuẩn:** Thu thập danh xưng từ client (`genderKey`), chuẩn hóa thành `'male' | 'female' | 'other'`.
- **Bảo toàn dữ liệu cũ:** Khi cập nhật khách hàng cũ theo Số điện thoại hoặc Email, chỉ cập nhật `gender` nếu khách hàng đó chưa có thông tin trước đây, không bao giờ ghi đè giá trị rỗng/null lên dữ liệu đã có.

---

## 7. Checkout UX Improvements

1. **Empty Cart State:**
   - Thay thế nút bấm vô hiệu hóa bằng một Empty State Card thân thiện và đẹp mắt.
   - Bổ sung nút CTA chính: **"Khám phá Menu Dịch Vụ"** (`role="button"`, `tabIndex={0}`), tự động điều hướng người dùng quay lại menu (`/${lang}/new-user/${menuType}/menu`), khắc phục điểm nghẽn (dead end) của phễu đặt lịch.
2. **Private Room Add-on (`NHS0900`):**
   - Không hiển thị như một dịch vụ độc lập làm rối khách hàng.
   - Được gắn và gom nhóm trực quan ngay dưới dịch vụ cha (ví dụ `Add-on: Phòng riêng (+105K)`).
   - Khi xóa dịch vụ cha, add-on phòng riêng tự động được dọn dẹp theo và không bị tính trùng lặp giá.
