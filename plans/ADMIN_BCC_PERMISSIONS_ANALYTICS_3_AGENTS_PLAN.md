# Admin BCC, editor permissions, customer journey analytics, SEO and AEO

Status: implementation plan only. No agents launched and no production changes performed.

## 1. Objective and boundaries

Provide these website admin capabilities:
- Manage recipients who receive a BCC copy of the website booking receipt.
- Configure each editor's access by module and action.
- View anonymous customer journeys, meaningful clicks, engagement time, and booking conversion.
- Manage multilingual SEO and answer-focused content (AEO), with controlled publishing and measurable search performance.

Preserve the current receipt-versus-confirmation distinction. The website acknowledges receipt; dispatch confirms appointments. Do not change dispatch admin, internal booking status, existing booking identifiers, or the atomic booking transaction.

## 2. Verified starting points

- src/lib/mailer.ts already sends customer TO and one reception BCC; resolveReceptionEmail supports payload, environment, and a default address.
- src/app/api/bookings/route.ts reads configured receptionEmail and supplies it to the mailer after commit.
- src/app/api/admin/system-settings/route.ts already validates receptionEmail. Audit its UI and authorization before extending it.
- src/lib/auth/adminAuth.ts uses WebbookingAdminUsers and recognizes owner/admin/editor/reception.
- The original CMS foundation migration only permits owner/editor/reception. This is evidence of a schema/code mismatch to investigate, not proof of the current production constraint.
- withAuth accepts optional allowed roles. Inventory actual route permissions; do not assume all authenticated roles should access all modules.
- No customer-journey analytics implementation was located in the targeted source search. Confirm external scripts/integrations before adding another collector.

## 3. Product decisions for the first release

### BCC configuration

- Add an Email Notifications area to website admin settings.
- List up to 5 validated recipient addresses, with add/remove, enabled toggle, save, and save result.
- This is a website-wide notification list, not an automatic BCC to every admin login email.
- Admin/owner can edit. Editors and reception cannot view or change this configuration by default.
- Use a dedicated private server-side configuration key. Never expose it through public site-content, public settings, HTML, or booking responses.
- Absent new config preserves the existing reception behavior. An explicitly disabled list means no BCC and must not silently reactivate through env fallback.
- Distinguish config-read failure from an intentionally empty list. Preserve customer sending, emit operational diagnostics; define approved legacy fallback before implementation.
- Deduplicate recipients case-insensitively, reject malformed addresses and CR/LF injection, exclude customer TO from BCC.
- Changes affect subsequent submissions; do not resend historic receipts automatically.
- A saved address is not proof of mailbox delivery. Any explicit test-mail action is authenticated, rate limited, clearly labeled, and invoked by the admin.
- Report customer SMTP acceptance separately from BCC acceptance/rejection. SMTP acceptance is not inbox delivery.
- BCC failure never turns a committed booking into a booking failure. Preserve existing idempotency behavior.
- Keep SMTP credentials server-side; this feature edits recipients only.

### Editor permissions

Recommended model: role baseline plus explicit per-editor capability grants. Owner/admin manage editor grants; owner role management remains owner-only.

Capabilities to inventory and implement consistently:
- content.read / content.write / content.publish
- media.read / media.upload / media.delete
- services.read / services.write
- analytics.read
- notification_settings.manage (owner/admin only)
- editor_permissions.manage (owner/admin only)

Split content permissions further by module where current API boundaries support it: homepage, blogs, hero videos, local tour, SEO. Do not invent a visual checkbox that the backend cannot enforce.

Default editor proposal: read/write assigned content and upload media; publishing, deletion, analytics, recipient settings, customer data, and user management not granted unless explicitly permitted. Existing editor effective access must be audited and mapped before rollout to avoid unexpected lockout.

- Enforce capabilities in server route handlers/actions, not just menu visibility.
- Reject self-escalation, modifications to owner/admin accounts through the editor endpoint, unknown permissions, and inactive memberships.
- Prevent removal of the final active owner if role/account lifecycle management is in scope.
- A permission revocation applies on the next protected request. Do not trust stale client role or long-lived cached grants.
- Settings writes must use concurrency checks and an audit entry with actor, target, change, timestamp, and revision.
- Shared media deletion requires checking references and ownership; a content grant does not authorize deleting arbitrary media.

### Analytics dashboard

Views:
- Overview: sessions, engaged time, top pages/actions, conversion, and recent trend.
- Funnel: landing -> service view -> cart -> checkout -> booking received.
- Journeys: pseudonymous session timeline with page, action, relative timestamp, language, and device category.
- Content performance: most clicked services/buttons, most engaged pages, and exit points.
- Filters: date, language, device category, entry page, campaign allowlist; exclude TEST/admin traffic by default.

Definitions:
- Session expires after 30 minutes without activity; anonymous sessions do not identify a named person or unify different devices.
- Engaged time accrues only while visible and recently active. Stop after 60 seconds without meaningful interaction; resume on activity.
- Send bounded deltas about every 15 seconds plus visibility/pagehide flush; use event IDs and server caps to avoid double counting and unreasonable durations.
- Track page navigation once per actual route transition, including SPA navigation. Strip query strings except approved campaign fields.
- Count meaningful clicks with explicit event targets, not arbitrary DOM text or every mouse movement.
- Conversion is emitted by server only after verified booking commit. Deduplicate retries/idempotent submissions by opaque conversion key. Client success-page visits are not authoritative bookings.
- Analytics delivery is best effort and must never block checkout, SMTP, or navigation. Measure missing server events rather than claiming complete coverage.
- Display active time as an estimate. Closing tabs, offline browsers, blocked telemetry, or declined consent can reduce coverage.

Initial event contract (versioned):
- page_view, service_view, service_option_select
- cart_add, cart_remove, cart_open, checkout_view
- booking_submit, booking_received, booking_failed (allowlisted reason only)
- contact_click (hotline/Zalo/WhatsApp/etc.), language_change
- hero_video_started, hero_video_failed
- engagement_delta

Event fields: event_id, schema_version, event_name, anonymous session_id, page_path, timestamp, language, device category, allowlisted service/action identifier, bounded duration where applicable. Add server received_at. No names, emails, phones, booking access tokens, form contents, free-text treatment notes, raw URLs, or keystrokes.

## 4. Storage, privacy, and performance

- Prefer isolated Webbooking-prefixed tables for editor grants, private notification config if existing private config storage is unsuitable, audit history, analytics events, and daily aggregates.
- Inspect actual schema/RLS first. Do not place private recipient settings into publicly returned SystemConfigs payloads.
- No anonymous direct table read/write. Public ingestion validates a small allowlisted schema and writes server-side; public event input remains untrusted.
- Protect collector with batch/body size limits, per-session/network rate limiting, timestamp bounds, origin checks, and event deduplication. Origin alone is not authentication.
- Propose raw retention 30 days and aggregate retention 12 months, configurable after business review; scheduled pruning must actually be implemented and verified.
- Decide consent behavior before enabling production collection; honor the selected consent state and opt-out. Initial scope excludes session replay, fingerprinting, and customer identity linkage.
- No third-party analytics vendor assumed. Verify hosting cost and event volume before final storage choice.
- Batch small events; do not add a render-blocking analytics SDK or delay video startup. Limit ingestion payload to 16 KB / 20 events initially and tune from measurements.
- Measure load time with analytics on/off under the same build, cache, network, and device conditions. Target no more than 5% median regression over repeated runs; report absolute values too.
- Aggregate on indexed data; never run an unbounded raw-event scan for every dashboard refresh. Start dashboard refresh at 60 seconds.

## 5. Three-agent assignment

Integrator first: audit routes/schema, freeze capability keys and event/config contracts, capture baseline tests, agree file ownership. Agents start only after contracts are shared.

Agent 1: BCC configuration and mail behavior
- Own mailer, booking mail integration, private notification API/settings panel, and focused mail tests.
- Reuse existing reception behavior; implement configured recipient list with migration compatibility and explicit disabled semantics.
- Test actual mailOptions via mock transport, rejection/acceptance differences, deduplication, privacy, and idempotency.
- Deliver migration request to integrator; do not independently change shared auth helpers or admin layout.

Agent 2: editor authorization and account UI
- Own shared auth/capability helpers, editor permissions API, account permission panel, and authorization tests.
- Produce complete route/action matrix including current role-only defaults and direct Supabase paths.
- Provide requireCapability contract for Agents 1 and 3 early. Restrict grants, audit changes, and test revocation.
- Coordinate migration with integrator. Keep existing login/session behavior compatible.

Agent 3: analytics collector and dashboard
- Own analytics client/server modules, dashboard, aggregation/pruning, and instrumentation outside Agent 1 files.
- Supply a small server conversion helper contract; Agent 1/integrator calls it after verified booking commit.
- Instrument existing components narrowly. For iframe flows, reuse src/lib/flipbook and validate message source/origin; avoid duplicate parent/iframe counting.
- Deliver synthetic journey tests, counts and timing evidence, and on/off performance comparison.

Integrator owns shared migrations, admin navigation/layout, cross-agent file conflict resolution, full regression tests, and release report. No simultaneous edits to the same file. No production migrations or mail sends during local tests.

## 6. Execution order

1. Read-only baseline: inspect current schema, role constraint, public settings response, existing SMTP behavior, and all admin route grants.
2. Freeze contracts and permission matrix. Choose default editor access and recipient migration semantics.
3. Implement BCC and permissions in parallel; analytics builds against the shared capability contract.
4. Integrate additive migrations with RLS, indexes, private config, audit, and retention job.
5. Run mocked SMTP and role tests, then local browser dashboard/journey tests with TEST traffic.
6. Deploy preview and verify authenticated admin behavior, denied editor direct requests, production-like event volume, and performance.
7. Review migration preflight; apply additive migration, deploy application with analytics collection disabled initially, run postflight.
8. Enable analytics for a controlled test, verify TEST exclusions and conversions, then enable normal collection under the agreed consent policy.
9. User checks one receipt + BCC in the actual approved mailboxes. Record SMTP logs separately from mailbox confirmation.
10. Observe errors/event volume/latency, then sign acceptance. Rollback by disabling analytics and restoring previous recipient settings/grants; preserve committed bookings.

## 7. Acceptance scenarios

1. Admin adds/removes/disables BCC list; reload reflects saved values.
2. Invalid address/header injection rejected, duplicates removed, customer address never duplicated in BCC.
3. Customer receipt and configured BCC accepted; customer-facing response never exposes BCC.
4. One BCC rejected: correct diagnostic; committed booking stays successful; customer result not misreported.
5. Settings storage unavailable: documented fallback behavior, no duplicate booking or mail loop.
6. Editor cannot GET/PATCH notification config, via UI or forged direct API.
7. Editor can edit only granted modules; publish/delete denied when not granted.
8. Revoked grants fail on the next API request; inactive user cannot use old session privileges.
9. Forged grant/self-escalation/owner change rejected; audit identifies actor and before/after revisions.
10. Controlled journey produces one page view per navigation, correct clicks/cart events, and ordered timeline.
11. Background tab and idle period excluded from engagement time; return resumes counting.
12. Refresh, SPA back/forward, duplicate batch, and network retry do not double-count IDs.
13. Failed booking produces no server conversion; successful retry of the same booking produces one conversion.
14. TEST/admin/bot traffic excluded from customer dashboard defaults; filters show explicit sample sizes.
15. Consent denied/opt-out stops collection according to policy; no sensitive form data reaches telemetry.
16. Collector unavailable does not delay checkout or SMTP; video/network performance remains within measured budget.
17. Dashboard read denied without analytics.read; totals agree with controlled event fixtures and aggregate queries.
18. Retention job deletes only eligible analytics rows; booking/internal records unchanged.

## 8. User decisions and deliverables

Before production enablement: approve actual BCC addresses, editor module/action matrix, retention/consent policy, and which owner/admin accounts may manage editors. Development can proceed with test fixtures and the proposed defaults above.

Deliverables: migrations/preflight/postflight, capability matrix, API contracts, UI screens, three agent reports, test evidence, performance comparison, and rollback steps. Do not label the work complete until authorized user roles and real recipient mailboxes pass acceptance.

## 9. Added scope: SEO and AEO

### Starting point and audit

The existing /admin/seo page edits title, description, keywords and ogImage via /api/admin/seo. Extend this surface instead of creating a duplicate global SEO screen. Before edits, trace whether saved settings actually reach server-rendered metadata for each route; inventory layout metadata, canonical URLs, robots/sitemap files outside src, redirects, public domains, multilingual routes and existing JSON-LD.

Create a route matrix covering homepage, services, blogs, local tour/detail pages, contact/location and transactional/private routes. Record actual HTTP status, indexability, title, canonical, locale, visible content and structured data. Do not infer indexing from HTTP 200 alone.

### SEO admin controls

- Separate global defaults from per-page, per-language overrides across vi/en/cn/jp/kr.
- Provide title, description, share image/alt, slug where supported, indexability, preview, draft/publish status, revision history and validation.
- Show locale completion and missing/duplicate metadata reports. Preview is illustrative; search engines may rewrite snippets.
- Derive canonical from the approved production origin and route. Restrict arbitrary overrides; reject external/untrusted canonicals by default.
- Generate reciprocal hreflang for published equivalents only, using valid tags such as vi, en, zh-CN, ja and ko; map internal cn/jp/kr route codes explicitly. Include x-default only when a real default destination is defined.
- Sitemap includes only canonical, published, indexable URLs with truthful modification dates. Remove drafts, private routes, checkout and personalized order URLs.
- Admin/private/transactional pages must not enter the sitemap; authenticate private content. robots.txt is not access control and blocking crawl does not reliably remove an indexed URL.
- Return appropriate 404/410 for removed resources and use redirect mappings for changed published slugs. Avoid redirect loops and blanket redirects to the homepage.
- Do not treat the existing keywords field as a Google ranking control; retain compatibility if needed, but prioritize content and technical quality.
- Store settings in existing scoped CMS patterns where feasible. Publishing invalidates relevant page metadata/content caches; draft changes do not leak to public pages.

### AEO content and entities

- Add structured editorial fields for a concise service answer, who the service suits, duration, price, inclusions, location, opening hours, booking process and genuine FAQs.
- Present approved answers visibly on the page in the chosen language; never create hidden search-only text or unsupported claims.
- Explicitly explain receipt versus final appointment confirmation in booking FAQs.
- Reuse verified business facts as the source of truth for name, address, hotline, hours and official links; flag inconsistencies rather than silently overwriting business settings.
- Generate suitable schema.org JSON-LD from validated fields: a fitting LocalBusiness subtype, WebSite, BreadcrumbList, Service and Article only where applicable. Validate supported properties and escape JSON safely; do not accept executable editor snippets.
- Markup must agree with visible prices, currency, hours, service details and published content. Do not fabricate reviews, aggregate ratings, qualifications or medical outcomes.
- FAQs can help users without guaranteeing a Google FAQ rich result. Check current eligibility before selecting markup; no special AI schema or llms.txt is a required acceptance item.
- Keep substantive content and crawlable links available without waiting for hero video playback; ensure the loading screen does not become the only crawlable content.
- Review translations for factual consistency; do not index unreviewed machine-generated locale pages merely to increase page count.

### Permissions and workflow

Add seo.read, seo.write, seo.publish, aeo.read, aeo.write and aeo.publish to the shared capability contract before agents begin.
- Owner/admin can manage and publish. Editors require explicit grants.
- Editors may draft metadata/answers for authorized modules; publishing requires the corresponding publish capability.
- Production origin, broad robots controls and search-provider credentials remain owner/admin-only.
- Audit every publish, canonical/indexability change and rollback. Test direct API enforcement, including generic content/settings endpoints that could bypass the SEO screen.

### Measurement

- Dashboard SEO tab: impressions, clicks, CTR, average position, landing pages, locale and date from authorized Search Console data when connected. Show source, freshness, aggregation and missing data clearly.
- Dashboard AEO tab: identifiable AI referral sessions and resulting conversions from first-party analytics, plus provider citation metrics only when genuinely available through an approved integration or import.
- Referrer absence is unknown/direct, not proof of AI traffic. AI referral clicks and AI citations are distinct metrics; never infer one from the other.
- Bing Webmaster Tools provides AI Performance reporting; verify account availability and supported export/API before promising an embedded integration. A link/manual import is acceptable for phase one if no supported API exists.
- Search-provider tokens remain server-side. Missing account access must show not connected, never invented zeros or mock production charts.
- Capture a baseline, then review after 2-4 weeks and again after sufficient traffic. Ranking/indexing/citation improvements are outcomes to measure, not deployment pass criteria or guarantees.

### Staffing and ordering amendment

Recommended: retain Agents 1-3 for BCC, permissions and analytics; add Agent 4 for SEO/AEO because it has its own metadata/content scope. This section supersedes the original three-report deliverable with four reports if the fourth agent is used. No agent is launched by this plan update.

Agent 4 owns SEO API/UI, metadata resolver, sitemap/robots as justified by audit, JSON-LD generation and answer-content editor/display modules. Coordinate page/layout changes through integrator and analytics metrics contract with Agent 3. Agent 2 alone owns shared authorization helpers; Agent 4 consumes them. No concurrent edits to shared page/layout or content API files.

If limited to three agents, schedule SEO/AEO as a second wave after Agent 1 completes BCC; do not overload Agent 3 while it builds analytics. Implement technical SEO first, answer content second, provider reporting last.

### Added acceptance cases

19. Saved published metadata appears in server HTML for the correct page and locale; drafts remain private.
20. Valid production canonical, reciprocal language alternates, and sitemap agree; preview URLs are not emitted as canonical production URLs.
21. No private/order tokens, checkout routes or drafts appear in sitemap or analytics search exports.
22. AEO answer content and JSON-LD match visible service facts in each published locale; invalid markup rejected and script injection escaped.
23. An editor without publish permission cannot publish through SEO, generic content or settings APIs; admin rollback restores prior content and metadata.
24. Removing/renaming a page yields the expected status/redirect and sitemap update; no soft-404 or redirect loop.
25. Analytics differentiates organic search traffic, identifiable AI referrals and provider citation metrics; unavailable provider data is labeled.
26. Metadata and readable content remain available when video fails or browser JavaScript is disabled; no new render-blocking SEO/AEO script.
27. Check production robots/noindex and canonical after deployment; preview protection does not accidentally propagate to production.

### Official guidance consulted

- Google: SEO fundamentals remain relevant to AI search; special schema is not required: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Bing AI Performance reporting and its scope: https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview
- Bing guidelines: rankings and AI citations are not guaranteed: https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a

Before implementation, verify current provider documentation for metadata, structured-data eligibility and reporting APIs. Before external integrations, identify the canonical production domain and authorized Search Console/Bing properties; local engineering can proceed independently.
