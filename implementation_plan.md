# Kế Hoạch Web Booking Spa Ngân Hà (Next.js + Supabase)

## Bối cảnh

Tạo **project Next.js mới** (App Router) cho web booking Spa Ngân Hà, dựa trên [website mẫu Canva](https://spanganhabycunyoung.my.canva.site/).

![Demo](C:\Users\ADMIN\.gemini\antigravity\brain\7f85c94f-2eb7-4ae1-aeb7-e2ea42592cd6\canva_website_review_1773890426368.webp)

> [!WARNING]
> **Project mới** sẽ tạo tại `NganHa-Project`. User cần **backup code Nuxt cũ** trước.

---

## Tech Stack & Decisions

| Layer | Công nghệ | Ghi chú |
|-------|-----------|---------|
| Framework | **Next.js 14+** App Router | TypeScript, Server Components mặc định |
| Database | **Supabase** | Dùng chung DB với web KH & quản trị |
| Styling | **Tailwind CSS** | Spa theme (gold/dark) |
| i18n | **5 ngôn ngữ** | VN, EN, CN, JP, KR |
| Payment P1 | **VietQR** | Tự tạo mã QR đúng giá + ghi chú bill |
| Payment P2 | **VNPay** | Thanh toán online (Phase 2) |
| Icons | `lucide-react` | |
| Animation | `framer-motion` | |

---

## Kiến trúc Project

```
📁 spa-ngan-ha/
├── 📁 app/
│   ├── layout.tsx                     # Root layout (fonts, metadata)
│   ├── page.tsx                       # Landing page (all sections)
│   ├── 📁 [locale]/                   # i18n routing (vi/en/cn/jp/kr)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── 📁 booking/
│   │   └── page.tsx                   # Booking form page
│   └── 📁 api/
│       ├── 📁 booking/
│       │   └── route.ts               # POST: create booking
│       └── 📁 vietqr/
│           └── route.ts               # GET: generate VietQR
├── 📁 components/
│   ├── 📁 Header/
│   │   ├── Header.tsx                 # Sticky nav, logo, lang switcher
│   │   ├── Header.logic.ts            # Mobile menu state, scroll detection
│   │   └── Header.i18n.ts             # Nav labels per language
│   ├── 📁 Hero/
│   │   ├── Hero.tsx                   # Fullscreen bg, 2 branches, CTAs
│   │   ├── Hero.animation.ts          # Entrance animations
│   │   └── Hero.i18n.ts
│   ├── 📁 ServiceCards/
│   │   ├── ServiceCards.tsx           # Grid of service packages
│   │   ├── ServiceCards.logic.ts      # Filter/sort, selection
│   │   └── ServiceCards.i18n.ts
│   ├── 📁 BookingForm/
│   │   ├── BookingForm.tsx            # 'use client' - form UI
│   │   ├── BookingForm.logic.ts       # Validation, submit, date/time
│   │   └── BookingForm.i18n.ts
│   ├── 📁 VietQRPayment/
│   │   ├── VietQRPayment.tsx          # QR code display + bill info
│   │   ├── VietQRPayment.logic.ts     # Generate QR, format amount
│   │   └── VietQRPayment.i18n.ts
│   ├── 📁 BranchInfo/
│   │   ├── BranchInfo.tsx
│   │   └── BranchInfo.i18n.ts
│   ├── 📁 Promotions/
│   │   ├── Promotions.tsx
│   │   └── Promotions.i18n.ts
│   ├── 📁 Footer/
│   │   ├── Footer.tsx
│   │   └── Footer.i18n.ts
│   └── 📁 FloatingWidgets/
│       └── FloatingWidgets.tsx        # Fixed Zalo/FB/Phone buttons
├── 📁 lib/
│   ├── supabase-client.ts             # Browser Supabase client
│   ├── supabase-server.ts             # Server Supabase client
│   ├── vietqr.ts                      # VietQR URL builder
│   └── constants.ts                   # UPPER_SNAKE_CASE
├── 📁 i18n/
│   ├── vi.ts                          # Vietnamese dictionary
│   ├── en.ts                          # English
│   ├── cn.ts                          # Chinese
│   ├── jp.ts                          # Japanese
│   └── kr.ts                          # Korean
├── 📁 data/
│   ├── services.ts                    # Service packages
│   └── branches.ts                    # Branch info
├── 📁 types/
│   └── index.ts                       # Interfaces
├── tailwind.config.ts
├── .env.local                         # Supabase keys (NEVER commit)
└── package.json
```

---

## VietQR Payment (Phase 1)

Sử dụng **VietQR Quick Link** (không cần API key):
```
https://img.vietqr.io/image/{bankCode}-{accountNo}-{template}.png
  ?amount={totalPrice}
  &addInfo={bookingNote}
  &accountName={accountName}
```

Flow:
1. Khách đặt lịch → Submit thành công → Tạo booking trên Supabase (status: `PENDING_PAYMENT`)
2. Hiển thị mã QR VietQR với **đúng tổng giá** và **ghi chú** (mã booking + tên KH)
3. Nhân viên xác nhận thanh toán → cập nhật status `CONFIRMED`

> [!NOTE]
> User cần cung cấp **số tài khoản ngân hàng** và **mã ngân hàng** để cấu hình VietQR trong `.env.local`.

---

## Dữ liệu

### Dịch vụ (từ website mẫu)
| Gói | Thời gian | VND | USD |
|-----|:---------:|----:|----:|
| Ear Clean Package 1 | 70' | 650,000 | $30 |
| Heel Skin Shave Package 1 | 70' | 600,000 | $27 |
| Hair Wash Package 4 | 90' | 770,000 | $35 |
| Facial Package 2 | 90' | 800,000 | $36 |
| Barbershop Package 6 | 120' | 800,000 | $39 |

### Chi nhánh
| Tên | Địa chỉ | Giờ |
|-----|---------|-----|
| Ngan Ha Barbershop | 11 Ngô Đức Kế, Q1 | 9am - 12am |
| Ngan Ha Spa | 6B Thi Sách, Q1 | 9am - 12am |

---

## Phases Triển khai

### Phase 1 ✨ (Hiện tại)
- [x] ~~Phân tích & lập kế hoạch~~
- [ ] Init Next.js project + Supabase + Tailwind theme
- [ ] Header + Hero Section
- [ ] Service Cards + Branch Info
- [ ] Booking Form (chọn dịch vụ, ngày, giờ, chi nhánh)
- [ ] **VietQR Payment** (mã QR tự tạo với đúng giá & ghi chú)
- [ ] i18n (5 ngôn ngữ)
- [ ] Footer + Floating Widgets
- [ ] Responsive + Polish

### Phase 2 - VNPay & Nâng cao (Tương lai)
- [ ] **VNPay Payment Gateway** - thanh toán online qua thẻ ATM/Visa/MasterCard/QR
  - `app/api/vnpay/create-payment/route.ts` → tạo payment URL
  - `app/api/vnpay/callback/route.ts` → xử lý IPN (Instant Payment Notification)
  - `app/payment/return/page.tsx` → trang kết quả thanh toán
  - Env vars: `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_URL`
- [ ] Customer accounts (đăng nhập, lịch sử đặt lịch)
- [ ] Promotions system (mã giảm giá)
- [ ] Shop (bán tinh dầu, đặt phòng xông hơi)

---

## Verification Plan

- `npm run build` → no errors
- Browser test: tất cả sections + booking flow + VietQR display
- Responsive test: 375px, 768px, 1024px, 1440px
- User review giao diện so với website mẫu
