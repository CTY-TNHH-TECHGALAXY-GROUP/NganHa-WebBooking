# Agent 4 Report: SEO / AEO

Date: 2026-09-11

## Scope delivered

- Extended the existing `/admin/seo` screen and `/api/admin/seo` route; no duplicate SEO surface was created.
- Added typed SEO/AEO config normalization with legacy `seo_config` compatibility, per-route/per-locale fields, and `draft` / `published` versions.
- Added server metadata resolution for title, description, keywords compatibility, Open Graph, Twitter, canonical, robots, and locale alternates.
- Added Next metadata routes for `/robots.txt` and `/sitemap.xml`.
- Added safe JSON-LD generation for `BeautySalon` (LocalBusiness subtype), `WebSite`, `BreadcrumbList`, `Article`, `Service`, and visible `FAQPage` content where the corresponding facts are present.
- Added visible answer-ready homepage content in all five supported locales using business and booking facts already present in the repository. No hidden search-only text, `llms.txt`, reviews, ratings, medical outcomes, or ranking/citation promises were added.
- No migration was required for the SEO payload: it uses the existing `SystemConfigs` row and `WebbookingContentRevisions`. Agent 2's capability migration remains draft-only and was not edited or run.

## Files changed

SEO/AEO implementation:

- `src/lib/seo/types.ts`
- `src/lib/seo/config.ts`
- `src/lib/seo/validation.ts`
- `src/lib/seo/capabilities.ts`
- `src/lib/seo/metadata.ts`
- `src/lib/seo/jsonLd.ts`
- `src/lib/seo/routes.ts`
- `src/components/Seo/JsonLd.tsx`
- `src/components/Seo/AeoAnswerContent.tsx`
- `src/components/Seo/SeoStructuredData.tsx`
- `src/app/robots.ts`
- `src/app/sitemap.ts`
- `src/lib/seo/__tests__/seo.test.ts`

Existing route integration:

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/[lang]/page.tsx`
- `src/app/[lang]/local-tour/[packageSlug]/page.tsx`
- `src/app/local-tour/[packageSlug]/page.tsx`
- `src/app/[lang]/oriahome/page.tsx`
- `src/app/oriahome/page.tsx`
- `src/app/[lang]/oriafarm-retreat/page.tsx`
- `src/app/oriafarm-retreat/page.tsx`
- `src/app/[lang]/pure-relaxation/page.tsx`
- `src/app/pure-relaxation/page.tsx`
- `src/app/[lang]/lost-and-found/page.tsx`
- `src/app/space/page.tsx`
- `src/app/blogs/page.tsx`
- `src/app/design-your-journey/page.tsx`

Admin surface:

- `src/app/admin/seo/page.tsx`
- `src/app/api/admin/seo/route.ts`

The root layout already contained an unrelated AnalyticsRuntime change from another agent; it was preserved.

## Route contracts

### Admin API

`GET /api/admin/seo?section=seo|aeo`

- Requires the authenticated active admin session plus `seo.read` or `aeo.read` respectively.
- Returns only the requested SEO or AEO section; private system settings are not included.

`POST /api/admin/seo`

```json
{
  "section": "seo",
  "routeKey": "home",
  "locale": "vi",
  "status": "draft",
  "data": {}
}
```

- `seo.write` / `aeo.write` is required for drafts.
- `seo.publish` / `aeo.publish` is additionally required for `status: "published"`.
- Supported locales are `vi`, `en`, `cn`, `jp`, `kr`.
- Canonical overrides accept internal paths only. Metadata/AEO text rejects markup, controls, overlong values, malformed URLs, and invalid FAQ shapes.
- `expectedRevision` is accepted for optimistic conflict detection and returns `409 SEO_CONTENT_CONFLICT` when stale.
- Successful writes record a revision with actor, section, route, locale, and status, then revalidate the affected public route and sitemap.
- The old `{ title, description, keywords, ogImage }` POST shape remains accepted as a compatibility path for global Vietnamese published SEO, but it still passes through capability and validation gates.

### Public indexing

- `/robots.txt` disallows `/admin`, `/api`, `/booking`, `/checkout`, `/order`, and every localized `/{lang}/new-user/` flow.
- `/sitemap.xml` contains the public homepage, public content/landing routes, localized homepage and public landing equivalents, and the three repository-backed local-tour package slugs.
- Checkout, cart/menu state, admin, API, order, and other private/transactional paths are not added to the sitemap.
- Sitemap entries are filtered through published `indexable`; drafts are never read by the public metadata resolver.

### Server metadata and structured data

- `getPageMetadata()` is the shared resolver used by the root layout and integrated route pages.
- Locale hreflang mapping is explicit: `vi`, `en`, `zh-CN` from `cn`, `ja` from `jp`, and `ko` from `kr`.
- `x-default` is emitted only for routes with a real unlocalized default destination.
- Homepage visible answer content and JSON-LD share the same resolved AEO facts. Local-tour detail pages add visible-content-backed `Article` and `BreadcrumbList` data.
- JSON-LD is serialized with `<`, `>`, and `&` escaped. The admin never accepts executable schema snippets.

## Agent 2 integration point

`src/lib/seo/capabilities.ts` consumes `AdminAccess.hasCapability()` supplied by Agent 2's request-time capability contract. It does not change `adminAuth.ts`, `withAuth.ts`, or the shared capability helper.

- Owner/admin use the existing role baseline.
- Editor/reception access fails closed unless Agent 2's active grants authorize the requested `seo.*` or `aeo.*` key.
- The API keeps read, write, and publish checks separate, so an editor with write but no publish grant can save a draft but cannot publish it.
- Capability keys match Agent 2's registry: `seo.read`, `seo.write`, `seo.publish`, `aeo.read`, `aeo.write`, `aeo.publish`.
- The editor page loads SEO and AEO independently so a user granted only one namespace does not receive the other namespace's response.

## Tests and results

- `npx tsc --noEmit`: **PASS**.
- `npm run lint`: **PASS** with the repository's existing warning set; no lint errors.
- Scoped ESLint for SEO/AEO implementation files: **PASS**, no errors.
- `src/lib/seo/__tests__/seo.test.ts`: covers locale path mapping, canonical/hreflang filtering, noindex behavior, invalid markup/list/canonical rejection, answer-visible AEO validation, JSON-LD escaping and origin entity linking, capability deny/allow behavior, and sitemap/robots exclusion contracts. The repository has no configured test runner, so the exported test function is typechecked but not executed by an npm test command.
- Dev server start was attempted on port `3003` and succeeded after local permission approval. The separate sandbox could not connect to that approved process for curl smoke checks; the server was stopped and no process was left running.
- `git diff --check`: SEO/AEO files are clean. The repository-wide check still reports pre-existing trailing whitespace at `src/app/[lang]/new-user/[menuType]/checkout/page.tsx:373`, an unrelated file that was intentionally not changed.
- No production build, production database migration, commit, push, or deploy was run.

## Open issues

1. Confirm and set the approved production `NEXT_PUBLIC_SITE_URL` before release. Existing repository references disagree between the Vercel README URL, `nganhaspa.vn`, and `oria-spa.vercel.app`; the resolver uses the environment value and only falls back to the README's current Vercel URL.
2. The sitemap currently uses the checked-in `DEFAULT_LOCAL_TOUR_CONFIG` package list. A future integration should read the published local-tour config and its truthful `updatedAt` values so newly published/renamed packages are included without emitting drafts.
3. Agent 2's capability tables/RPC remain draft-only. Editor/reception SEO/AEO access will correctly fail closed until the reviewed capability migration is applied and existing editor grants are audited.
4. Search Console, Bing AI Performance, and provider citation reporting are not implemented in this pass. The admin surface does not invent zeros or promise ranking or AI citation outcomes.
5. Live HTTP metadata, robots, sitemap, and database-backed publish smoke tests still need to run in an environment where the configured Supabase credentials and local browser/network process are available.
