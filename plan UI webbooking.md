# 🔧 Responsive Overhaul — Toàn bộ Website ORIA SPA

> **Mục tiêu:** Sửa toàn bộ lỗi responsive trên Mobile (320px–430px), Tablet (768px–1024px), Desktop (1280px+).
>
> **Chiến lược thực hiện:** 2 phase song song → 2 phase → 2 phase
> ```
> ┌─────────────────────────┐
> │ Phase 1 + Phase 2       │  ← Critical + High (song song)
> │ ~22 files               │
> └────────┬────────────────┘
>          ▼
> ┌─────────────────────────┐
> │ Phase 3 + Phase 4       │  ← Medium + Low (song song)
> │ ~12 files               │
> └────────┬────────────────┘
>          ▼
> ┌─────────────────────────┐
> │ Phase 5 + Phase 6       │  ← Polish + Infra (song song)
> │ ~4 files                │
> └─────────────────────────┘
> ```

---

## Decisions Confirmed

| # | Quyết định | Chi tiết |
|---|-----------|----------|
| 1 | **GoogleReviewWidget** | **(B)** Thu nhỏ thành mini badge trên mobile (chỉ icon G + sao), full size trên desktop |
| 2 | **CartDrawer** | **Giữ cả 2** — Header cart (sáng, slide phải, dùng ở navbar) + Menu cart (tối, bottom sheet, dùng trong flow booking). Fix responsive cho cả 2. |
| 3 | **Hero video swipe** | **Có** — Thêm touch/swipe gesture để chuyển video trên mobile |
| 4 | **Z-Index token** | **Thực hiện** — Tạo hệ thống z-index tập trung, cập nhật ~12 files |
| 5 | **Body padding 120px** | **Xoá** — FloatingWidgets đã tự quản vị trí bằng `bottom-24`, padding thừa gây khoảng trống chết |

---

## Proposed Changes

---

### Phase 1: CRITICAL (P0) — Z-Index System & Widget Collisions

> 🎯 Sửa các bug khiến user không thể thao tác (widget đè modal, component chồng nhau)

---

#### 1.1 Z-Index Token System

#### [NEW] `src/lib/zIndex.ts`
Tạo file chứa hệ thống z-index tập trung:

```ts
// Centralized z-index scale — import from here, never hardcode z values
export const Z = {
  BASE:           10,   // sticky footers, nav bars trong page
  STICKY:         20,   // sticky headers within page content
  HEADER:         30,   // site header (.site-header)
  DRAWER_OVERLAY: 40,   // drawer/bottom-sheet backdrops
  DRAWER:         50,   // drawers, bottom sheets (CartDrawer, PaymentModal)
  MODAL:          60,   // modals (OrderConfirmModal, CustomForYou)
  MODAL_NESTED:   70,   // nested popover inside modal (PaymentMethods info)
  ALERT:          80,   // alert dialogs
  FLOATING:       90,   // floating widgets (FloatingWidgets, GoogleReview)
  FLOATING_CHAT:  92,   // AI ChatBot popup (above floating widgets)
  FLOATING_TRIGGER: 94, // AI ChatBot trigger button
  SPLASH:        100,   // splash screen
} as const;
```

#### [MODIFY] Files cần cập nhật z-index:

| File | Hiện tại | Mới |
|------|----------|-----|
| [CartDrawer.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/Menu/Standard/Sheets/CartDrawer.tsx) | `z-40` / `z-50` | `Z.DRAWER_OVERLAY` / `Z.DRAWER` |
| [OrderConfirmModal.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/Checkout/OrderConfirmModal.tsx) | `z-[120]` / `z-[130]` | `Z.MODAL` / `Z.MODAL_NESTED` |
| [CustomForYou/index.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/CustomForYou/index.tsx) | `z-[100]` | `Z.MODAL` |
| [FloatingWidgets.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/FloatingWidgets/FloatingWidgets.tsx) | `z-[985]` / `z-[990]` | `Z.FLOATING` |
| [AIChatBot.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/AIChatBot/AIChatBot.tsx) + [ai-chatbot.css](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/styles/ai-chatbot.css) | `z-999` / `z-1000` / `z-1001` | `Z.FLOATING` / `Z.FLOATING_CHAT` / `Z.FLOATING_TRIGGER` |
| [GoogleReviewWidget.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/GoogleReviewWidget/GoogleReviewWidget.tsx) | `z-[990]` | `Z.FLOATING` |
| [Header.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/Header/Header.tsx) + [header.css](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/styles/header.css) | `z-9999` / `z-[10000]` / `z-[10001]` | `Z.HEADER` / `Z.DRAWER_OVERLAY` / `Z.DRAWER` |
| [SplashScreen.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/SplashScreen/SplashScreen.tsx) | `z-99999` | `Z.SPLASH` |
| [PaymentMethods.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/Checkout/PaymentMethods.tsx) | `z-[130]` | `Z.MODAL_NESTED` |
| [BookingCheckout.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/BookingCheckout/BookingCheckout.tsx) | `z-50` / `z-[120]` | `Z.DRAWER` / `Z.MODAL` |
| [PaymentModal.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/Checkout/PaymentModal.tsx) | `z-50` / `z-[140]` | `Z.DRAWER` / `Z.MODAL_NESTED` |

**Quan trọng:** FloatingWidgets ẩn tự động khi modal mở — thêm CSS rule:
```css
body.modal-open .floating-widgets,
body.modal-open .google-review-widget { display: none !important; }
```
Các modal component sẽ toggle `document.body.classList.add/remove('modal-open')`.

---

#### 1.2 GoogleReviewWidget → Mini Badge trên Mobile

#### [MODIFY] [GoogleReviewWidget.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/GoogleReviewWidget/GoogleReviewWidget.tsx)
- Desktop (≥768px): giữ nguyên full widget (icon G + điểm số + "reviews")
- Mobile (<768px): thu nhỏ thành mini badge tròn chỉ hiện icon G + sao (khoảng 40px), bấm vào mở link Google Maps reviews
- Dời vị trí mobile: `bottom-36 left-4` (cao hơn FloatingWidgets 48px, tránh va chạm)

---

#### 1.3 FloatingWidgets Greeting Bubble Overflow

#### [MODIFY] [FloatingWidgets.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/FloatingWidgets/FloatingWidgets.tsx)
- Greeting bubble: `max-w-[350px]` → `max-w-[calc(100vw-2rem)] sm:max-w-[350px]`
- Thêm nút dismiss "×" cho greeting bubble
- Thêm class `floating-widgets` để CSS rule `body.modal-open` control được

---

#### 1.4 SplashScreen Logo Overflow

#### [MODIFY] [SplashScreen.module.css](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/SplashScreen/SplashScreen.module.css)
- `.logo { width: 350px; }` → `.logo { width: min(350px, 85vw); }`

---

#### 1.5 Global Body Padding Fix

#### [MODIFY] [globals.css](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/app/globals.css)
- **Xoá** `padding-bottom: max(env(safe-area-inset-bottom), 120px) !important;` trên `html, body, :root`
- Không cần thay thế — FloatingWidgets đã có `bottom-24 md:bottom-6`, các page tự quản padding qua `pb-safe` hoặc `pb-24`

---

### Phase 2: HIGH (P1) — Mobile Layout Breaks
*(Chạy song song với Phase 1)*

> 🎯 Sửa các vấn đề khiến giao diện bị vỡ/tràn trên mobile thông thường (360px–430px)

---

#### 2.1 Header Logo Collision (<390px)

#### [MODIFY] [Header.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/Header/Header.tsx)
- Logo height: `h-14 md:h-[68px]` → `h-10 sm:h-14 md:h-[68px]`
- Right controls: giảm gap `gap-1 sm:gap-2` và icon size trên nhỏ
- Fix duplicate X button: khi mobile menu mở, ẩn `.nav-fullscreen-close` hoặc ẩn toggle icon, không hiện cả 2

#### [MODIFY] [header.css](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/styles/header.css)
- `.site-header`: `z-index: 9999` → `z-index: 30` (dùng token `Z.HEADER`)
- Header cart drawer: `z-[10000]/z-[10001]` → `Z.DRAWER_OVERLAY`/`Z.DRAWER`

---

#### 2.2 Hero Section Mobile Fixes + Swipe Gesture

#### [MODIFY] [Hero.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/Hero/Hero.tsx)
- SmartLogo: `w-[300px]` → `w-[min(300px,calc(100vw-48px))]`
- Section: `min-height: 100vh` → `min-height: 100dvh`
- **Thêm swipe gesture:** Sử dụng touch event listeners (`touchstart`/`touchend`) hoặc Framer Motion `drag="x"` để detect swipe left/right → gọi `goToSlide(prev/next)`

#### [MODIFY] [hero.css](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/styles/hero.css)
- Thêm `@media (max-width: 768px)` rule:
  - `.hero-content`: `padding: 100px 24px 60px;` (giảm từ 170px top)
  - `.hero-section--cinematic .hero-content`: `transform: translateY(clamp(20px, 4vh, 50px));` (giảm offset)
- `.hero-cinematic-sub`: thêm `flex-wrap: wrap;` cho text dài đa ngôn ngữ
- Pagination dots: tăng hit-box lên `min-height: 44px; padding: 20px 8px;`

---

#### 2.3 Pure Relaxation — Orphaned `.hero` Selector Bug

#### [MODIFY] [PureRelaxationPage.module.css](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/PureRelaxation/PureRelaxationPage.module.css)

**Bug:** CSS dùng `.hero` nhưng JSX render `.topPanel`. Responsive padding không bao giờ được áp dụng!

| Media Query | Fix |
|-------------|-----|
| `@media (max-width: 1180px)` | `.hero` → `.topPanel` |
| `@media (max-width: 900px)` | `.hero` → `.topPanel` |
| `@media (max-width: 620px)` | `.hero` → `.topPanel` |

Thêm fixes:
- `.sectionNav`: `justify-content: center` → `justify-content: flex-start` (fix flex center-clipping overflow)
- `.topPanel h1`: `font-size: 3.5rem` ở ≤620px → `font-size: clamp(2.5rem, 10vw, 3.5rem)`

---

#### 2.4 OrderConfirmModal Mobile UX

#### [MODIFY] [OrderConfirmModal.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/Checkout/OrderConfirmModal.tsx)
- Thêm nút close "×" ở top-right header (hiện không có, user phải cuộn xuống tận cùng)
- Footer buttons ("Hủy bỏ" & "Xác nhận"): `sticky bottom-0 bg-black/90 backdrop-blur-md` thay vì cuộn mất
- `max-h-[92vh]` → `max-h-[92dvh]`
- `z-[120]` → inline style `zIndex: Z.MODAL`
- Toggle `body.modal-open` khi mở/đóng

---

#### 2.5 CartDrawer (Tối) — Desktop Stretch + Tailwind Bug

#### [MODIFY] [CartDrawer.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/Menu/Standard/Sheets/CartDrawer.tsx)
- **Tailwind interpolation bug** (class không compile):
  - `rounded-t-[${CONFIG.BORDER_RADIUS}]` → `rounded-t-[30px]`
  - `duration-${CONFIG.ANIMATION_DURATION}` → `duration-300`
- Thêm responsive: `md:max-w-lg md:mx-auto md:rounded-[30px]`
- Dual currency overflow: `text-xl` → `text-base sm:text-xl` + `break-words`
- `z-40/z-50` → inline style `zIndex: Z.DRAWER_OVERLAY/Z.DRAWER`

---

#### 2.6 iOS Input Auto-Zoom Fix

#### [MODIFY] [BookingCheckout.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/BookingCheckout/BookingCheckout.tsx)
- Tất cả `<input>`: `text-sm` (14px) → `text-base` (16px) để tránh iOS Safari auto-zoom
- Thêm desktop constraint: `md:max-w-2xl md:mx-auto`
- Time slots: `grid-cols-4` → `grid-cols-3 sm:grid-cols-4`

#### [MODIFY] [CustomerInfo.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/Checkout/CustomerInfo.tsx)
- Gender dropdown: `w-[100px]` → `w-[80px] sm:w-[100px]`

---

#### 2.7 MenuTypeSelector Inline Style Override

#### [MODIFY] [MenuTypeSelector/index.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/MenuTypeSelector/index.tsx)
- **Xoá** inline style `{ width: "155px", height: "195px" }` để CSS media query hoạt động lại
- Thêm `overflow-y: auto` cho container (fix landscape clipping)
- Header logo: `260px` → `min(260px, 70vw)`

---

### Phase 3: MEDIUM (P2) — UX Improvements
*(Chạy song song với Phase 4)*

---

#### 3.1 AIChatBot Mobile Keyboard + Border Fix

#### [MODIFY] [AIChatBot.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/AIChatBot/AIChatBot.tsx)
- Xoá `border-[3px] border-white` (xung đột với CSS `border-bottom: none` trên mobile)
- Thêm `pb-[env(safe-area-inset-bottom)]` cho input bar

#### [MODIFY] [ai-chatbot.css](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/styles/ai-chatbot.css)
- `max-height: 85vh` → `max-height: 85dvh`
- Z-index values: `999/1000/1001` → `90/92/94` (tokens)

---

#### 3.2 CustomForYou BodyMap Touch Target Fix

#### [MODIFY] [BodyMap.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/CustomForYou/BodyMap.tsx)
- `min-h-[500px]` → `min-h-[380px] sm:min-h-[500px]`
- Column split: tăng SVG column, giảm label column padding
- Body part labels: xoá `truncate`, dùng `text-[10px] sm:text-[12px] leading-tight`

#### [MODIFY] [CustomForYou/index.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/CustomForYou/index.tsx)
- `h-[90vh]` → `h-[90dvh]`

---

#### 3.3 Space Page Hero Min-Height

#### [MODIFY] [SpacePage.module.css](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/Space/SpacePage.module.css)
- `.hero` ở `≤600px`: `min-height: 700px` → `min-height: 100svh`
- `.gallerySide div` → `.gallerySide > div` (tránh ảnh hưởng watermark)

---

#### 3.4 DesignYourJourney CTA Overflow

#### [MODIFY] [DesignYourJourneyPage.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/DesignYourJourney/DesignYourJourneyPage.tsx)
- CTA inline style: thêm `flexWrap: 'wrap'`

---

#### 3.5 Footer Vertical Whitespace Reduction

#### [MODIFY] [Footer.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/Footer/Footer.tsx)
- `py-24` → `py-12 md:py-24`
- `gap-y-16` → `gap-y-8 md:gap-y-16`
- `py-20` → `py-12 md:py-20`
- Touch targets: thêm `py-2` cho link items

---

### Phase 4: LOW (P3) — Article & Supplementary Pages
*(Chạy song song với Phase 3)*

---

#### 4.1 SaigonCoffeeArticle Missing Small Breakpoints

#### [MODIFY] [SaigonCoffeeArticle.module.css](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/Blogs/SaigonCoffeeArticle.module.css)
- Thêm `@media (max-width: 480px)`:
  - `.heroTitle`: `font-size: clamp(36px, 10vw, 58px)` (giảm từ min 58px)
  - Giảm hero padding, stack side panels

---

#### 4.2 ShowcaseLanding Mobile Nav

#### [MODIFY] [ShowcaseLanding.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/ShowcaseLanding/ShowcaseLanding.tsx)
- Thêm hamburger toggle khi `< 1024px` (nav links bị ẩn hoàn toàn, user mất navigation)

#### [MODIFY] [showcase.css](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/styles/showcase.css)
- `.sc-floating-cta`: `bottom: calc(20px + env(safe-area-inset-bottom))`

---

#### 4.3 History Year Nav Touch Fix

#### [MODIFY] [History.module.css](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/History/History.module.css)
- Mobile `.yearNav`: thêm `pointer-events: auto` (bị kế thừa `none` từ desktop)

---

### Phase 5: POLISH — Performance & Safety
*(Chạy song song với Phase 6)*

---

#### 5.1 Menu Header DOM Bloat

#### [MODIFY] [Menu/Standard/Header.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/Menu/Standard/Header.tsx)
- Category replicated 14x (~100 buttons) → giảm xuống 3x hoặc dùng CSS `animation: scroll` infinite

---

#### 5.2 ServiceItem Text Clipping

#### [MODIFY] [ServiceItem.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/components/Menu/Standard/ServiceItem.tsx)
- `h-20` (80px cứng) → `min-h-[5rem]` (cho phép mở rộng)
- `paddingRight: '70px'` → `pr-12` (48px, vẫn đủ chỗ cho button 36px)

---

#### 5.3 Layout.tsx Hero Font Override Safety

#### [MODIFY] [layout.tsx](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/app/layout.tsx)
- Wrap injected font-size trong media query:
  ```css
  @media (min-width: 768px) {
    .hero-title { font-size: ${heroHeadingSize} !important; }
  }
  ```

---

### Phase 6: INFRASTRUCTURE
*(Chạy song song với Phase 5)*

---

#### 6.1 Tailwind `xs:` Breakpoint

#### [MODIFY] [globals.css](file:///Users/charlotte/Desktop/NGÂN%20HÀ/CTY%20TechGalaxy%20Group/NganHa-WebBooking/src/app/globals.css)
- Trong `@theme` block, thêm:
  ```css
  @theme {
    --breakpoint-xs: 480px;
  }
  ```

---

## Verification Plan

### Automated
```bash
npm run build          # Full build check
npx tsc --noEmit       # Type check
```

### Manual — Device Matrix

| Viewport | Kiểm tra |
|----------|----------|
| **320px** (iPhone SE) | Hero logo fit, SplashScreen logo fit, widgets không chồng |
| **360px** (Android) | GoogleReview mini badge, greeting bubble không tràn |
| **390px** (iPhone 14) | Header logo không đè icons, modals có nút close |
| **430px** (iPhone 15 Pro Max) | Full mobile layout clean |
| **768px** (iPad Mini) | 2-column grids, CartDrawer max-width |
| **1024px** (iPad Pro) | Tablet layouts, ShowcaseLanding nav |
| **1280px+** (Desktop) | BookingCheckout max-width, CartDrawer centered |

### Checklist theo Phase

**Phase 1+2:**
- [ ] FloatingWidgets ẩn khi OrderConfirmModal mở
- [ ] GoogleReview mini badge trên mobile, full trên desktop
- [ ] SplashScreen logo không tràn trên 320px
- [ ] Body không có khoảng trống 120px dưới footer
- [ ] Header logo không đè icons trên 360px
- [ ] Hero video swipe hoạt động trên mobile
- [ ] Pure Relaxation heading responsive
- [ ] OrderConfirmModal có nút close + sticky footer
- [ ] CartDrawer rounded trên mobile, max-width trên desktop
- [ ] Input fields 16px (không iOS zoom)

**Phase 3+4:**
- [ ] ChatBot input bar có safe-area padding
- [ ] BodyMap labels không bị truncate trên nhỏ
- [ ] Space hero không vượt quá màn hình mobile
- [ ] Footer compact hơn trên mobile
- [ ] Article headlines responsive trên 320px
- [ ] ShowcaseLanding có mobile menu

**Phase 5+6:**
- [ ] Menu Header DOM nhẹ hơn
- [ ] ServiceItem text không bị cắt
- [ ] Hero font override an toàn trên mobile
- [ ] `xs:` breakpoint khả dụng
