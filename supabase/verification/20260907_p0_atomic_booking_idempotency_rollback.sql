-- Non-destructive rollback for 20260907_p0_atomic_booking_idempotency.sql.
--
-- This disables the privileged writer while retaining idempotency columns,
-- booking rows, child rows, customer rows, and the daily counter history.
-- Do not drop the additive objects: doing so would lose booking/counter data or
-- force an unsafe max+1 writer during an application rollback.
BEGIN;

REVOKE ALL ON FUNCTION public.create_booking_atomic(JSONB, JSONB, TEXT, TEXT)
    FROM PUBLIC, anon, authenticated, service_role;

COMMIT;

-- Re-enable only after the compatible application and migration are reviewed:
-- GRANT EXECUTE ON FUNCTION public.create_booking_atomic(JSONB, JSONB, TEXT, TEXT)
--     TO service_role;
