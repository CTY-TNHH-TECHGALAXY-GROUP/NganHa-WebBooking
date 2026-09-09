-- Webbooking daily counter and allocator only.
--
-- This file deliberately creates no booking writer and does not create or
-- modify rows in Bookings, BookingItems, Customers, or Services. It does not
-- alter those tables, their columns, status values, foreign keys, indexes,
-- RLS, or policies.
--
-- INTEGRATION CONTRACT:
-- The application calls webbooking_allocate_booking_number for the identifier
-- and then invokes the separately reviewed webbooking_commit_booking writer,
-- which atomically inserts into the existing Bookings and BookingItems tables.
-- This counter-only file intentionally creates neither booking writer and does
-- not change the existing business-table schema or dispatch contract.
--
-- Run `supabase/verification/20260909_counter_only_preflight_read_only.sql`
-- separately before any approved deployment. Do not run remote/production SQL
-- as part of local verification.

BEGIN;

CREATE TABLE IF NOT EXISTS public."WebbookingBookingDailyCounters" (
  date_key DATE PRIMARY KEY,
  last_seq BIGINT NOT NULL DEFAULT 0 CHECK (last_seq >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.webbooking_allocate_booking_number(
  p_booking_at TIMESTAMPTZ
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_date DATE;
  v_date_code TEXT;
  v_pattern TEXT;
  v_last_seq BIGINT;
  v_next_seq BIGINT;
  v_candidate TEXT;
BEGIN
  IF p_booking_at IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'BOOKING_DATE_REQUIRED';
  END IF;

  -- The booking date, rather than the database session date, owns the code.
  v_date := (p_booking_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE;
  v_date_code := to_char(v_date, 'DDMMYYYY');
  v_pattern := '^WB-' || v_date_code || '-([0-9]+)$';

  -- Serialize all allocator calls for one Ho Chi Minh calendar date.
  PERFORM pg_advisory_xact_lock(
    hashtext('webbooking-daily-counter:' || v_date::TEXT)
  );

  -- Seed once from existing IDs and bill codes. ON CONFLICT preserves a
  -- counter that has already advanced; it never resets or reduces it.
  INSERT INTO public."WebbookingBookingDailyCounters" (date_key, last_seq)
  SELECT
    v_date,
    COALESCE(MAX(code_seq), 0)
  FROM (
    SELECT ((regexp_match(b.id, v_pattern))[1])::BIGINT AS code_seq
    FROM public."Bookings" AS b
    WHERE b.id ~ v_pattern

    UNION ALL

    SELECT ((regexp_match(b."billCode"::TEXT, v_pattern))[1])::BIGINT AS code_seq
    FROM public."Bookings" AS b
    WHERE b."billCode" IS NOT NULL
      AND b."billCode"::TEXT ~ v_pattern
  ) AS existing_codes
  ON CONFLICT (date_key) DO NOTHING;

  -- The row lock protects the counter value even if this function is later
  -- called from a larger transaction that also performs the booking insert.
  SELECT c.last_seq
  INTO v_last_seq
  FROM public."WebbookingBookingDailyCounters" AS c
  WHERE c.date_key = v_date
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Webbooking counter row was not initialized for date %', v_date;
  END IF;

  LOOP
    IF v_last_seq = 9223372036854775807 THEN
      RAISE EXCEPTION 'Webbooking counter exhausted for date %', v_date;
    END IF;

    v_next_seq := v_last_seq + 1;

    UPDATE public."WebbookingBookingDailyCounters"
    SET last_seq = v_next_seq,
        updated_at = now()
    WHERE date_key = v_date;

    v_candidate := 'WB-' || v_date_code || '-' ||
      CASE
        WHEN v_next_seq < 1000 THEN lpad(v_next_seq::TEXT, 3, '0')
        ELSE v_next_seq::TEXT
      END;

    -- A consumed sequence is never reused, even when an old code already
    -- occupies the candidate in either existing identifier column.
    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public."Bookings" AS b
      WHERE b.id = v_candidate
         OR b."billCode"::TEXT = v_candidate
    );

    v_last_seq := v_next_seq;
  END LOOP;

  RETURN v_candidate;
END;
$$;

-- Keep the new counter private. The SECURITY DEFINER function owner performs
-- its table access; only the server-side service role may call the allocator.
ALTER TABLE public."WebbookingBookingDailyCounters" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."WebbookingBookingDailyCounters" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.webbooking_allocate_booking_number(TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.webbooking_allocate_booking_number(TIMESTAMPTZ) TO service_role;

COMMIT;
