# Ngan Ha Web Booking

Website dat lich cho Ngan Ha Barbershop & Spa, dang chay tren Next.js App Router voi homepage video, 3D Celestial/Galaxy service menu, cart dung chung tren navigation, va trang Payment Information.

## Quick Start

Yeu cau Node.js 20+ va npm.

```bash
npm install
npm run dev -- --port 3002
```

Mo local tai [http://localhost:3002](http://localhost:3002).

Neu dung cong 3000 mac dinh:

```bash
npm run dev
```

## Branch & Deploy

- Branch deploy can luu y: `vercel`.
- Website hien tai: [https://ngan-ha-web-booking.vercel.app/](https://ngan-ha-web-booking.vercel.app/)
- Truoc khi commit/push, luon kiem tra branch bang `git branch --show-current`.

## Main Routes

- `/`: homepage, mac dinh hien video hero truoc.
- `/en/new-user/select-menu`: trang chon menu/service flow.
- `/en/new-user/standard/checkout`: Payment Information.
- `/public/flipmenu/index.html`: standalone flipbook/celestial menu iframe source.

## Current Booking Flow

1. Khach vao homepage.
2. Khach vao service menu/Galaxy.
3. Chon category, xem danh sach services.
4. Bam `Book Now` de di thang sang Payment Information voi service da chon.
5. Bam icon cart tren service de them vao gio hang.
6. Cart tren navigation luon mo duoc, ke ca khi rong.
7. Cart rong hien "No selected service" theo ngon ngu hien tai va nut dat lich bi disabled/blur.
8. Cart co service thi hien tong tien, so luong, cho phep xoa service, va dat lich sang checkout.
9. Checkout cho phep chon ngay/gio, thong tin khach hang, phone country code, ghi chu spa, them service bang popup, va confirm order.

## Important UX Rules

- Homepage default phai la video, khong phai cuon sach.
- Book/flipbook back flow phai nhe nha concept spa:
  - Galaxy -> open book: restore book ve trang sach on dinh.
  - Open book -> closed book: chi gap cover/pages.
  - Khong translate, zoom out, fade out, rotate away, hoac lam book bay khoi viewport.
- Icon cart trong Galaxy da duoc bo; cart chinh nam tren navigation.
- Navigation cart phai tuong tac duoc khi chua co service.
- Toast them service chi la mot the nho goc phai duoi.
- Flower/flyer animation chay ve icon cart tren nav va hien badge so luong mau do.
- Payment Information UI can giu style dark, transparent, blur theo background nhu file HTML demo cua khach.

## Flipbook Library

Reusable flipbook bridge nam trong:

```text
src/lib/flipbook/
```

Dung `FlipbookFrame`, `useFlipbookBridge`, `showFlipbookToast`, va `animateFlipbookFlyerToTarget` thay vi viet lai iframe/postMessage logic trong tung component.

Tai lieu rieng:

```text
src/lib/flipbook/README.md
```

## Environment

Tao `.env.local` dua theo `.env.example`. Khong commit secret that.

Supabase env co fallback trong mot so API de local/dev khong bi crash khi chua cau hinh database, nhung production nen co day du bien.

## Useful Checks

```bash
npx tsc --noEmit
npm run lint
```

Khi test nhanh route:

```bash
curl -I http://localhost:3002/
curl -I http://localhost:3002/en/new-user/standard/checkout
```

## Project Notes

Doc handoff cho dev/agent khac nam tai:

```text
DEVELOPMENT_NOTES.md
AGENTS.md
```
