# Admin dispatch contract handoff

Source: `/Users/charlotte/Downloads/admin_dispatch_contract_audit.md`  
Audit time: 2026-09-09 16:40 +07:00  
Environment: local read-only audit of the separate operations project.

## Confirmed

- Operations admin generates its own `billCode` as `NNN-DDMMYYYY` and its own `id` as `BK-11NDK-NNN-DDMMYYYY`.
- Website `WB-DDMMYYYY-NNN` is a separate namespace. Admin does not generate or expect `WB-*` itself.
- Admin receives `Bookings` Realtime INSERT events for `status = NEW` and web sources, including `WEB_BOOKING`.
- Website contract is compatible with `status = NEW`, item status `WAITING`, `customerId`, and `idLegacy`.
- Admin does not require `Bookings.id = Bookings.billCode`.
- `create_booking_atomic`, `webbooking_allocate_booking_number`, and `webbooking_submit_booking` are absent in the audited DB.

## Release blocker

The admin subscribes to `Bookings` INSERT but not `BookingItems` INSERT. With the established separate parent/child insert path, the parent can be received before its items and render as a booking with an empty service list. This is a real static integration risk; it is not a live concurrency proof.

## Required decision

The operations project must implement or explicitly accept a receiving-side mitigation, such as refetching/hydrating `BookingItems` after a parent INSERT and showing a short loading state until items are present. This repository must not introduce `webbooking_submit_booking` or another booking writer under the counter-only contract.

## Scope conclusion

The allocator SQL is namespace-compatible and does not need to alter `Bookings`, `BookingItems`, status values, prices, customer linkage, or the operations dispatch RPCs. Full go-live remains blocked only by the parent/child receiving behavior plus live preflight/postflight and canary evidence.
