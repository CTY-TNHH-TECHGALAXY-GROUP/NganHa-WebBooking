# Agent 1 Handoff

## Scope

Added a standalone website transaction writer and read-only verification SQL. No live SQL was applied. Existing counter SQL, route, checkout UI, business schema, Customers, and admin source were not edited.

## Files

- `supabase/GO_LIVE_WEBSITE_ATOMIC_WRITER_READY_TO_PASTE.sql`
- `supabase/verification/20260909_website_atomic_writer_preflight_read_only.sql`
- `supabase/verification/20260909_website_atomic_writer_postflight_read_only.sql`

Contract: `public.webbooking_commit_booking(p_booking JSONB, p_items JSONB) RETURNS JSONB`.

## Behavior

The writer uses fixed `pg_catalog, public` search path, `SECURITY DEFINER`, per-`idLegacy` transaction locking, explicit parent/item allowlists, server-owned `WEB_BOOKING` and `NEW`/`WAITING`, active Services prices, customerId/idLegacy preservation, and one parent plus all children in one transaction. It does not write Customers or call dispatch functions. Access-token and timestamp defaults remain database-owned by omitting those columns.

Replay now excludes the newly allocated billCode and compares normalized parent intent plus normalized item service, quantity, canonical price, and options. Generated/persisted item IDs, timestamps, and mutable status/source/notes/focus fields are excluded. Both item arrays use the same deterministic JSON sort while retaining duplicate lines. Existing-key replay does not read current Services, so price/inactive catalog changes do not break a valid replay. An existing parent with no children returns explicit `BOOKING_IN_PROGRESS`; a complete but different request raises `IDEMPOTENCY_KEY_REUSED`.

The route supplies the appointment as a validated local wall-time string for the existing timestamp-without-time-zone booking column; the writer stores that timestamp directly, avoiding session-timezone drift. It preserves supplied item IDs, locks catalog rows before canonical pricing, and inserts the validated price snapshot in original input order. Route-supplied `createdAt`/`updatedAt` are retained, with database-time fallback. Quantity and payload type checks fail closed, including SQL NULL via `IS DISTINCT FROM`.

## Verification

Static checks performed: inspected README, DEVELOPMENT_NOTES, final plan, counter SQL, booking route payload/item helpers, schema SQL, historical writer SQL, and existing read-only counter verification. The disposable PostgreSQL runtime suite is now available and has been run locally; no live SQL was applied.

## Blockers / risks

- Confirm actual deployed defaults, enum types, timestamp interpretation, and exact catalog price type with Agent 2/operator preflight. The writer deliberately omits accessToken so its database default remains authoritative.
- The SQL should not be pasted until preflight confirms the signature is absent or intentionally replaced and confirms `service_role` ACL behavior.
- Latest main disposable PostgreSQL runtime suite: 16/16 PASS, including multiservice order normalization, SQL NULL/type handling, and replay after catalog deactivation. This replaces the previous no-runtime blocker. The fixture schema is not evidence of live database defaults; operator preflight must still verify deployed column types/defaults, enum compatibility, timestamp rendering, ownership, and ACLs before paste.
- Agent 2 integration is complete: the route calls this RPC and has no direct parent/child insert fallback. Live deployment preflight and production acceptance remain outstanding.
