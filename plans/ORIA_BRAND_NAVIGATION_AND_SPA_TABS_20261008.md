# Website brand navigation and Oria Spa content tabs

## Confirmed scope

- Work on `feat/oria-care`.
- Website navigation contains six brands: Oria Spa, Oria Home Care, OriaFarm Store, OriaFarm Retreat, Oria Tour, Oria Academy.
- Oria Tour uses the existing Sài Gòn Tour content and package flows.
- Oria Academy uses the existing Academy content and subpages.
- Oria Spa is the current homepage and keeps its video hero as the initial view.
- A horizontal tab bar immediately below the Oria Spa hero switches content in place: Space, Service, Lost & Found, Our Story, History, Blogs, Privileges.
- Admin navigation is organized by management function rather than mirroring the website brand menu.
- Replace Ngân Hà with Oria in the History finale paragraph, including its five language versions and saved finale text when loaded.

## Implementation sequence

1. Map current navigation, public routes, admin editors and content keys to the six brands. Preserve existing content, media and localized copy.
2. Update the website Header to show the six brand destinations. Preserve cart, language switching, booking actions and existing service discount badges.
3. Add one shared Oria Spa tab component below the Hero in both `/` and localized homepages. Reuse existing content components; avoid nesting page-level main elements or duplicating the homepage hero.
4. Use Our Story as the initial tab to preserve the current first content after the hero. Support direct tab links for existing homepage anchors and links to Space, History, Blogs and Lost & Found. Preserve old route access until redirect compatibility is verified.
5. Reuse the Service choices and their existing booking journeys. Keep Design Your Journey, Pure Relaxation and Deep Body Treament (the existing `/therapy` route), including their 50%, 30% and 20% badges, cart persistence and flipbook bridge.
6. Show the existing Lost & Found interactions and Blogs inside their tabs. Retain the current Privileges coming-soon content until real content is supplied.
7. Rename the tour and academy navigation labels to Oria Tour and Oria Academy while preserving their package, training, certification and admission routes.
8. Organize admin navigation into functional groups: content and media; services and bookings; customer support (including Lost & Found); analytics; system settings and access. Reuse the current editors, content keys and permission gates. Inventory existing screens before grouping; do not add new management features or remove operational tools.
9. Update relevant internal links, sitemap and SEO metadata after the final route mapping is established.

## Interaction and preservation requirements

- Tabs change the content panel without navigating away or resetting the video hero.
- The horizontal tabs are minimalist text navigation with generous spacing. No filled backgrounds, bordered boxes, pills, shadows or raised button effects. Indicate the active tab with a subtle text color change or thin underline; keep hover understated and keyboard focus visible.
- Accessible tabs support keyboard navigation, active state and panel relationships.
- On narrow screens, keep the tab bar horizontal with scrolling; avoid page overflow.
- Preserve entered Lost & Found form data when switching tabs, and avoid running hidden History animations or loading all heavy tab content at startup.
- Maintain the active language across all brands and tabs.
- Use local component styles; no broad CSS overrides or visual masks.
- Reuse `src/lib/bookingCartStorage.ts` and `src/lib/flipbook/` where needed.
- Preserve all existing content and assets; no database deletion or silent cleanup.

## Verification and delivery

- Read the relevant Next.js local guides before implementation; if unavailable, check documentation matching the installed version.
- Test desktop and mobile tabs, direct links, all five languages, service badges, cart and booking flows, tour packages and academy links.
- Check admin editor access and saves after regrouping.
- Audit every changed line before committing. Commit only this scope; unrelated worktree changes remain separate.
- The prior Oria Home Care merge was committed and pushed as `2067393`.

## Current status

- Implemented the six-brand website navigation, shared minimalist Oria Spa tabs and functional admin groups.
- Preserved existing public routes, tour packages, Academy subpages, editor tools, content keys and permission gates. The admin now also links directly to the existing Space editor.
- History finale wording uses Oria in all five locales, including saved finale copy when loaded.
- Added component behavior checks in `scripts/test-oria-brand-tabs.cjs`: brands, tab selection, five-language labels, configured badges, keyboard navigation, hashes, retained Lost & Found and complete admin groups.
- Scoped TypeScript checks pass. Existing Oria Home Care preservation checks pass.
- Local `/en` compiled and returned HTTP 200. Desktop browser inspection confirmed the text-only tab design and changing Service to Space in place.
- Full lint is blocked by a local `jsx-a11y` dependency read timeout (`ETIMEDOUT`). Mobile visual checks and authenticated admin save checks have not been completed.
- Follow-up implementation is ready for the authorized commit and push: transparent brand card and navigation header, header logo visible only after scrolling, editable navigation image, merged Home Care introduction, additional Care paragraph images, and unframed closing quotes.
- Image upload, placement, watermark and save-payload checks pass in `scripts/test-oria-care-inline-images.cjs`. Authenticated admin saves and mobile visual checks remain unverified; no deployment was performed.
