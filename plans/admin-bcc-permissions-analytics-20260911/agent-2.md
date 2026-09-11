# Agent 2 Report: Admin Capabilities

Date: 2026-09-11

## Scope and outcome

Implemented the shared capability contract, request-time server enforcement, editor capability management API/UI, permission revision/audit behavior, and focused authorization tests. No commit, push, deploy, production SQL execution, mailer/BCC implementation, booking-flow change, analytics implementation, SEO/AEO implementation, or shared admin-layout change was performed by this agent.

## Schema assumptions and findings

- `src/lib/auth/adminAuth.ts` is the source of truth for the current application role union: `owner`, `admin`, `editor`, and `reception`.
- The checked-in `20260906_webbooking_cms_foundation.sql` role check only lists `owner`, `editor`, and `reception`. This is an application/schema mismatch, not proof of the live constraint. Runtime membership validation now rejects unknown roles instead of using an unsafe cast. The draft migration widens the role check only after a live preflight review.
- Admin API access uses the server-only Supabase service-role client after the request cookie is authenticated. Capability grants are therefore never trusted from client state.
- The capability storage contract is `WebbookingAdminCapabilityGrants`, keyed by `(user_id, capability, scope)`, with `is_active`, `granted_by`, timestamps, and `*` or exact scope matching.
- `WebbookingAdminPermissionRevisions` provides optimistic concurrency for editor grant replacement. `WebbookingAdminAuditLog` stores actor, target, before/after change, resource, and revision metadata.
- The editor/reception baseline is intentionally empty and fail-closed until existing editor access is audited. Owner/admin receive the role baseline for all registered capabilities. This avoids silently granting existing editors broader access during rollout.
- `lost_found.*` is included as a separate restricted capability family because the existing admin route handles claimant/customer data. It is not part of the editor baseline.

SQL is only drafted in `agent-2-migration.sql`; it was not run. The draft creates the grant, revision, and audit tables and an atomic `webbooking_replace_editor_capabilities` RPC. Review the live role constraint and existing rows before applying it.

The audit found direct browser uploads to the `media-uploads` storage bucket in legacy admin pages. The draft also replaces the older active-admin-only storage mutation policies with `media.upload`/`media.delete` checks. Until that draft is reviewed and applied, those legacy direct storage calls are a known migration dependency; the server API routes are capability-gated now.

## Capability contract

Registered capabilities:

```text
content.read              content.write              content.publish
media.read                media.upload               media.delete
services.read             services.write
analytics.read
notification_settings.manage
editor_permissions.manage
seo.read                  seo.write                  seo.publish
aeo.read                  aeo.write                  aeo.publish
lost_found.read           lost_found.write            lost_found.delete
```

Server callers should use:

```ts
import { withCapability } from '@/lib/api/withAuth';

export const GET = withCapability(handler, 'analytics.read');
export const POST = withCapability(handler, 'content.write', {
  scope: 'blogs',
  mutation: true,
});
```

For an existing `withAuth` handler that needs a second capability check, use `authorizeCapability(access, capability, options)`. `requireCapability` and `requireCapabilities` in `src/lib/api/requireAdmin.ts` resolve the current cookie session first; `withCapability` and `withCapabilities` map denials to the existing API response format. `withCapabilities` is all-of authorization.

`AdminAccess.hasCapability(capability)` is an async, request-time bridge for capability-aware modules that already receive `AdminAccess` (including the SEO/AEO helper). It does not cache grants. A role deactivation or grant revocation is therefore observed on the next protected request.

Owner/admin-only capabilities are `notification_settings.manage` and `editor_permissions.manage`. The runtime authorizer denies these for editor/reception even if a malformed grant is inserted directly. The editor permissions endpoint additionally rejects self-targets, owner/admin/reception targets, inactive editor targets, protected capabilities, unknown capabilities, and stale revisions.

## Files and enforcement touchpoints

Shared authorization and tests:

- `src/lib/auth/adminAuth.ts`: strict runtime role validation and request-time capability bridge.
- `src/lib/auth/adminCapabilities.ts`: capability registry, role baseline, grant lookup, scope matching, validation, authorization, and audit writer.
- `src/lib/auth/index.ts`: exports the shared capability module.
- `src/lib/api/requireAdmin.ts`: `requireCapability` and `requireCapabilities`.
- `src/lib/api/withAuth.ts`: `withCapability` and `withCapabilities` wrappers.
- `src/lib/auth/__tests__/adminCapabilities.test.ts`: allow/deny, role baseline, revoke, malformed input, self-grant, protected capability, and normalization cases.
- `scripts/test-admin-permissions.cjs`: TypeScript test harness usable without a database.
- `plans/admin-bcc-permissions-analytics-20260911/agent-2-migration.sql`: draft-only grant/revision/audit/RPC and capability-aware storage policy changes; not executed.
- `src/app/api/admin/system-settings/route.ts`: content read/write/publish gates, with `receptionEmail` redacted unless notification management is authorized.

Editor management:

- `src/app/api/admin/editor-permissions/route.ts`: owner/admin-only editor listing and atomic revision-checked replacement.
- `src/app/admin/editor-permissions/page.tsx`: capability checkbox panel with inactive-state handling, reload, save, and revision conflict feedback. It is intentionally not added to shared admin navigation.

Capability gates were applied to existing admin content/media/services/lost-and-found routes and to the generic system-settings route, without changing their underlying content behavior. Content mutations require `content.write`; direct publish/live mutations also require `content.publish`. Media read/upload/delete, services writes, and lost-and-found read/write/delete use their dedicated capabilities. Existing video/flipbook handlers received auth gates only; video/flipbook behavior was not redesigned.

The notification settings endpoint already uses `notification_settings.manage` in the Agent 1 surface; no mailer code was changed. The analytics endpoint uses `analytics.read` in the Agent 3 surface. The existing SEO/AEO endpoint checks `seo.*`/`aeo.*` through the `AdminAccess.hasCapability` bridge; no SEO/AEO implementation file was changed here.

## Route/action matrix

| Surface | Read | Mutation / publish |
| --- | --- | --- |
| Generic content | `content.read` | `content.write` + `content.publish` for direct live content |
| System settings | `content.read`; `receptionEmail` is redacted without notification access | content fields: `content.write` + `content.publish`; `receptionEmail`: `notification_settings.manage` |
| Blogs | `content.read` scope `blogs` | draft: `content.write`; non-draft/delete: also `content.publish` |
| History | `content.read` scope `history` | `content.write` + `content.publish` scope `history` |
| Hero videos / flipbook | `content.read` by module scope | `content.write` + `content.publish` by module scope |
| Media library/storage | `media.read` | upload: `media.upload`; delete: `media.delete` |
| Services editor | N/A for the current `[id]` mutation route | `services.write` scope `services` |
| Lost and Found | `lost_found.read` | create/update: `lost_found.write`; delete: `lost_found.delete` |
| Notification settings | `notification_settings.manage` | `notification_settings.manage` |
| Analytics dashboard | `analytics.read` | read-only |
| SEO / AEO | corresponding `seo.read` or `aeo.read` | corresponding `write`; published status also requires `publish` |
| Editor permissions | `editor_permissions.manage` | `editor_permissions.manage` plus RPC restrictions |

Role-only routes remain intentionally narrow: email diagnostics is owner-only, while current booking admin handlers are stubs returning 404 and do not expose customer data. No booking-flow authorization was changed.

## Audit, concurrency, and revocation

- Every protected request revalidates active membership before capability evaluation.
- Non-baseline roles read active grants from Supabase on every request; there is no process or client grant cache.
- Editor grant replacement locks the target revision in the SQL RPC, rejects stale `expected_revision`, replaces the complete normalized set, increments the revision, and writes an atomic before/after audit record.
- Permission conflicts return `409 PERMISSION_CONFLICT`; unavailable grant tables/RPC return `503 CAPABILITY_SCHEMA_UNAVAILABLE` rather than silently allowing a mutation.
- Audit values are bounded and redact keys matching secrets, tokens, credentials, SMTP, cookies, and sessions.

## Tests and results

- `node scripts/test-admin-permissions.cjs`: PASS.
  - Covers owner/admin baseline allow, editor default deny, explicit grant allow, revoke on the next authorization call, forged protected grant denial, unknown capability, invalid editor payload, self-escalation, protected capability, duplicate normalization, and role mismatch rejection.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS with the repository's existing warning set, including warnings in unrelated files.
- `git diff --check`: PASS.
- No Supabase database, production migration, SMTP transport, commit, push, or deploy was run.
- Live RLS/storage-policy behavior was not testable without a configured database; the direct storage dependency is called out above.

## Integration points for Agents 1, 3, and 4

- Agent 1: keep `notification_settings.manage` on both notification GET and PATCH. Do not rely on generic settings UI visibility; the server gate and private response are authoritative. The BCC/mail path remains outside this agent's scope.
- Agent 3: protect every dashboard read with `analytics.read` (or `requireCapability('analytics.read')`). Conversion helpers must continue to run server-side after verified booking commit; do not use client analytics authorization as a substitute.
- Agent 4: use `access.hasCapability('seo.*'/'aeo.*')` or `authorizeCapability` and preserve the separate read/write/publish checks. Do not treat `withAuth` or menu visibility alone as SEO/AEO authorization.
- Integrator: deploy the capability tables and RPC before enabling the editor UI. Add a capability-aware navigation entry separately if desired; the UI route is functional without modifying shared layout. Verify the live `WebbookingAdminUsers` role constraint, current roles, owner rows, RLS, and service-role privileges before applying the draft migration.
- Integrator: before enabling legacy admin upload pages for non-owner/admin users, apply and verify the draft storage policies or route those uploads through `/api/admin/media` with `media.upload`. Verify existing storage policy names before dropping/replacing them.
