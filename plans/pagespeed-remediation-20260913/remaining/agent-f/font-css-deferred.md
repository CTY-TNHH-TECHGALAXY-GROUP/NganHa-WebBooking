# Agent F handoff — fonts/CSS/legacy JavaScript

Status: DEFERRED pending controlled coverage; no font or global CSS code changed.

The baseline shows a Google Fonts Cinzel `@import` request and multiple font requests, but no request-chain timing, family/weight consumer map, license-safe Abramo conversion, or route coverage. The PageSpeed minify/unused audits were marked Error/NO_LCP, so they cannot identify a removable stylesheet or script. The legacy JavaScript estimate is only about 11 KiB and has no browser-support matrix.

Required next run: capture CSS/font request waterfall and coverage across homepage, History, menu, checkout, chat/QR, all five locales, hover/focus and animation states. Identify actual Cinzel/Abramo/CMS font consumers and weights, verify license before WOFF2 conversion, then choose `next/font` or local declarations without changing branding or glyph coverage. Test font swap/FOUC/CLS and CJK/Vietnamese glyphs. Only remove polyfills after an explicit Safari/iOS support decision.

Gate: no duplicate critical font request, no missing glyph/typeface/CLS regression, and every retained or removed CSS/JS asset has coverage evidence. An audit Error must remain documented as unresolved rather than converted to a false PASS.
