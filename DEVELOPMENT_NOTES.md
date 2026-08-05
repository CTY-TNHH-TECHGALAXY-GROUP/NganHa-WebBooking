# Development Notes

This file is for AI agents and developers joining the project mid-stream. The app has many UX-sensitive interactions, especially the 3D book, Galaxy menu, navigation cart, and checkout flow.

## Read First

- Follow `AGENTS.md` before touching Next.js code.
- This project currently targets the `vercel` branch for deployment. Do not assume `master` is the deploy branch.
- Prefer small, scoped changes. The worktree may contain user changes; do not revert unrelated files.
- Use existing helpers in `src/lib/bookingCartStorage.ts` and `src/lib/flipbook/` instead of duplicating cart or iframe bridge logic.

## Core Areas

### Homepage

- `src/app/page.tsx`
- `src/components/Hero/Hero.tsx`
- `public/videos/video1.mp4`
- `public/videos/0720.mp4`

Homepage should load at the video hero first. The video carousel supports manual slide navigation and also auto-plays through the video list in a loop.

### Service Menu / Galaxy

- `src/components/ServiceBook/ServiceBook.tsx`
- `public/flipmenu/index.html`
- `public/flipmenu/CelestialEngine.js`
- `public/flipmenu/FlipMenu.js`
- `public/flipmenu/style.css`
- `public/flipmenu/celestial-style.css`

The standalone flipbook/celestial app is embedded and controlled via `postMessage`. Keep parent app cart logic in React and keep celestial visual behavior inside `public/flipmenu`.

Expected back behavior:

1. Closed book opens softly.
2. User enters Galaxy.
3. Back from Galaxy returns to stable open book.
4. Back from open book only closes the cover/pages.
5. Closed book remains centered in the original resting position.

Do not add visual workarounds that hide a bad state. Reset stale transition state, timelines, classes, and wrapper transforms at the source.

### Flipbook Library

- `src/lib/flipbook/FlipbookFrame.tsx`
- `src/lib/flipbook/useFlipbookBridge.ts`
- `src/lib/flipbook/cartEffects.ts`
- `src/lib/flipbook/messages.ts`
- `src/lib/flipbook/types.ts`

Message contract currently includes:

- `flipmenu:galaxy-entered`
- `flipmenu:book-returned`
- `flipmenu:menu-back`
- `flipmenu:add-service-to-cart`
- `flipmenu:remove-service-from-cart`
- `flipmenu:book-now`
- `flipmenu:place-order`

### Cart

- `src/components/Header/Header.tsx`
- `src/styles/header.css`
- `src/lib/bookingCartStorage.ts`

Rules:

- Navigation cart is the source of visible cart UI.
- Cart must open even when empty.
- Empty state says no selected service in the active language.
- Place order is disabled/blurred while cart is empty.
- Cart badge shows selected service count in red.
- Cart list is compact and allows removing services.
- Add-service notification is a single small toast at the bottom right.
- Flower/flyer animation moves toward the navigation cart icon.

### Checkout / Payment Information

- `src/app/[lang]/new-user/[menuType]/checkout/page.tsx`
- `src/app/[lang]/new-user/[menuType]/checkout/checkout-demo.module.css`

Checkout should visually match the provided standalone HTML demo: dark spa background, transparent panels, subtle blur, gold accents, and no overflowing borders.

Rules:

- Back button returns to the service selection/Galaxy flow.
- Gender select must stay aligned and usable.
- Phone field includes country code by nation, for example Vietnam `+84`.
- Available times show 4 rows first, with a short `Xem thêm` button to expand.
- Keep only the spa note input; do not re-add a separate guests box.
- Add services from checkout via dashed inline box `Mở + Add service(s)`, not a separate standalone section.
- The add-services popup appears centered and filters services by category.

## Data & Environment

Service data can come from Supabase. Local development may use fallback/static services when Supabase env vars are missing.

Create `.env.local` from `.env.example`. Never commit real service keys, bank account secrets, or production-only credentials.

## Validation Checklist

Before handing off a change, run the checks that match the touched area:

```bash
npx tsc --noEmit
npm run lint
```

For local visual QA, use:

```bash
npm run dev -- --port 3002
```

Then inspect:

- `/`
- `/en/new-user/select-menu`
- `/en/new-user/standard/checkout`

Critical regressions to check manually:

- Homepage starts at video.
- Book does not fly away after Galaxy -> Back -> close book.
- Cart opens when empty.
- Add to cart updates badge, toast, and quantity.
- Checkout does not overflow on desktop width.
