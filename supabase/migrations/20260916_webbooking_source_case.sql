-- WebBooking source contract
--
-- The website API sends the human-readable source value `WebBooking`. This
-- migration updates the already-reviewed website-only writer in place without
-- touching existing bookings or changing the shared operations writer.
-- Apply only to the staging/production database after the normal read-only
-- preflight and deployment review. It is intentionally not executed here.

BEGIN;

DO $$
DECLARE
  v_definition TEXT;
  v_occurrences INTEGER;
BEGIN
  SELECT pg_get_functiondef(p.oid)
    INTO v_definition
  FROM pg_proc p
  WHERE p.oid = to_regprocedure('public.webbooking_commit_booking(jsonb,jsonb)');

  IF v_definition IS NULL THEN
    RAISE EXCEPTION 'webbooking_commit_booking(jsonb,jsonb) is required before the source-case migration';
  END IF;

  -- The reviewed writer must contain exactly one source validation literal and
  -- one insert literal. Fail closed if a different function body is present.
  v_occurrences := (length(v_definition) - length(replace(v_definition, '''WEB_BOOKING''', ''))) / length('''WEB_BOOKING''');
  IF v_occurrences <> 2 THEN
    RAISE EXCEPTION 'Unexpected WEB_BOOKING literal count in webbooking_commit_booking: %', v_occurrences;
  END IF;

  v_definition := replace(v_definition, '''WEB_BOOKING''', '''WebBooking''');
  EXECUTE v_definition;
END $$;

REVOKE ALL ON FUNCTION public.webbooking_commit_booking(JSONB, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.webbooking_commit_booking(JSONB, JSONB) TO service_role;

COMMIT;
