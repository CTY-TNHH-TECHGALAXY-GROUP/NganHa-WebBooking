# Agent F — font/CSS delivery handoff

Date: 2026-09-14
Base: `e9ab1feee65afdf4032baed22c9a1578caf41cec`
Worktree: `/private/tmp/nganha-agent-f-final-20260914`
Branch: `codex/ps-final-f-20260914`

## Scope and change

The global stylesheet loaded the external Cinzel CSS2 stylesheet on every route even though the `.font-luxury` utility has consumers only in the booking and new-user menu flows. The patch moves the unchanged Cinzel import and `.font-luxury { font-family: 'Cinzel', serif; }` rule to `src/styles/luxury-font.css`, imported by:

- `src/app/[lang]/new-user/layout.tsx`, covering localized new-user menu/checkout routes.
- `src/app/booking/layout.tsx`, covering the standalone booking flow.

`src/app/globals.css` no longer imports Cinzel or defines `.font-luxury`. Abramo, the root font variables, CMS font link, all component styles, and all visual properties remain unchanged.

## Consumer, route, weight, locale map

| Consumer | CSS weight in component | Route owner/state | Locale coverage |
| --- | ---: | --- | --- |
| `src/components/Menu/Standard/ServiceItem.tsx` service name | 700 (`font-bold`) | `/[lang]/new-user/[menuType]/menu` after a category is opened | `vi`, `en`, `cn` (and supported locale params) |
| `src/components/Menu/Standard/Sheets/ReviewSheet.tsx` review name | 700 | Standard menu review sheet | Same new-user/booking locale context |
| `src/components/Menu/Standard/Sheets/MainSheet.tsx` selected group | 700 | Standard menu detail sheet | Same new-user/booking locale context |
| `src/components/BookingCheckout/BookingCheckout.tsx` success/step headings | 700 (`font-bold`) | `/booking` checkout phase | `vi` default booking flow |

The import path is route-scoped at the layout boundary, so all states that can render these consumers retain the same family and available Google weights (`400`, `500`, `600`, `700`). The localized checkout page shares the new-user layout; it has no current `.font-luxury` element but remains covered for future/shared menu states.

## Local asset and license map

| Asset | Size | SHA-256 | Consumers/evidence | Decision |
| --- | ---: | --- | --- | --- |
| `public/fonts/Abramo.ttf` | 101,284 B | `3b2b880737be3bda5f03554297b758516876157c88f9e3b3bae8fa1fc96a2c2c` | `public/flipmenu/{style.css,celestial-style.css,index.html,example/index.html}` and canvas engines use the family name `Abramo`; no `src` app consumer was found | Preserve. The file metadata identifies the embedded font as Prata; the filename/family alias is part of existing flipbook behavior. Verify provenance and visual output before any rename or delivery change. |
| `public/fonts/Futura.ttf` | 134,996 B | `6343b70971000b04c5d401c96ae08ce371086135e999d5e1e1413039c0213076` | Header CSS uses system fallback names (`SFU Futura`, `Futura`); no `@font-face` or direct asset consumer found | Preserve; no evidence-backed delivery change. |
| `public/fonts/UTM-French-Vanilla.ttf` | 1,776,724 B | `33cfecbc9948cf9eafe54dc9f36d19a03b393cf12221b20be235926d1ca1db61` | No source/CSS consumer found | Preserve; no evidence-backed delivery change. |
| Google Cinzel | Remote CSS2, weights 400/500/600/700 | Official metadata identifies OFL licensing | `.font-luxury` consumers above | Keep remote family and weight behavior unchanged; route-scope request. |

The local Abramo file contains Prata metadata and an OFL string. Official references used for the matching upstream font records are [Prata metadata](https://raw.githubusercontent.com/google/fonts/main/ofl/prata/METADATA.pb), [Prata OFL text](https://raw.githubusercontent.com/google/fonts/main/ofl/prata/OFL.txt), and [Cinzel metadata](https://raw.githubusercontent.com/google/fonts/main/ofl/cinzel/METADATA.pb). No local license files were present. This is an inventory finding, not a license conclusion for the renamed `Abramo.ttf` asset.

## Controlled evidence

The matrix used mobile `390x844` and desktop `1440x900` on `/`, `/vi`, `/vi/new-user/standard/menu`, `/vi/new-user/standard/checkout`, `/booking`, `/history`, `/en/new-user/standard/menu`, and `/cn/new-user/standard/menu`. It recorded network requests, response status/content type, `document.fonts`, CSS coverage, `PerformanceObserver` CLS, page errors, and screenshots.

Production baseline (before this branch) requested the Cinzel Google stylesheet on every sampled route, including `/`, `/vi`, and `/history`. The same trace showed the Cinzel faces as `unloaded` until a consumer state requested them.

Local isolated validation (after this patch, Next `15.5.14`, port `3142`):

- `/`, `/vi`, and `/history`: 0 Cinzel Google stylesheet requests at both viewports.
- `/vi/new-user/standard/menu`, `/vi/new-user/standard/checkout`, `/booking`, `/en/new-user/standard/menu`, and `/cn/new-user/standard/menu`: exactly 1 Cinzel stylesheet request at both viewports, HTTP 200.
- After clicking `Chăm Sóc Cơ Thể`, `/vi/new-user/standard/menu` and `/booking` rendered service names with computed family `Cinzel, serif`, weight `700`; `document.fonts.check('700 16px Cinzel')` returned `true`, with no failed requests or page errors.
- After the 2-second settle window, all 16 route/viewport samples reached `document.readyState === 'complete'`. No persistent FOUC was visible in the inspected menu screenshot; the interaction check confirms the intended face becomes ready when a consumer is rendered.
- CLS was unchanged for the tested existing states: mobile `/vi/new-user/standard/menu` `0.018717`, desktop `0.012078`; mobile `/vi/new-user/standard/checkout` `0.005261`, desktop `0.000726`; `/`, `/vi`, `/history`, and `/booking` were `0` in the sampled run. The localized menu routes matched their existing menu-state values.
- The captured menu screenshot retained the existing black/gold layout, service cards, badges, controls, and typography after opening the category state.

The committed runners are `font-css-coverage.mjs` for the 16-sample route matrix and `font-state-check.mjs` for the post-click consumer state. Both resolve Playwright from the repository and only use `/private/tmp` for output.

Measurement commands:

```text
FONT_COVERAGE_BASE_URL=https://oria-spa.vercel.app FONT_COVERAGE_OUTPUT=/private/tmp/font-css-coverage-production.json node plans/pagespeed-remediation-20260914/agent-f/font-css-coverage.mjs
FONT_COVERAGE_BASE_URL=http://127.0.0.1:3142 FONT_COVERAGE_OUTPUT=/private/tmp/font-css-coverage-after.json node plans/pagespeed-remediation-20260914/agent-f/font-css-coverage.mjs
FONT_COVERAGE_BASE_URL=http://127.0.0.1:3142 node plans/pagespeed-remediation-20260914/agent-f/font-state-check.mjs
npx tsc --noEmit
npm run lint
```

`npx tsc --noEmit` passed. `npm run lint` exited 0 with existing repository warnings, including warnings in the localized checkout page; no new lint error came from this patch. The installed package is Next `15.5.14`; the expected `node_modules/next/dist/docs/` directory was absent, so the local Next guide lookup could not be completed.

## Risk, rollback, and follow-up

Risk is limited to CSS bundle ownership and the timing of the Cinzel request. The family, weights, selectors, and route behavior are unchanged. Rollback is the single commit below, or restore the three modified files and remove `src/styles/luxury-font.css`.

No CMS font setting, font asset, branding, locale, Hero, History, Supabase, database, deployment, or runtime data was modified. A matched production before/after transfer measurement is still required after deployment before claiming byte savings.
