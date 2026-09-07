-- ==============================================================================
-- Migration: 20260907_p0_atomic_booking_idempotency.sql
-- Phase: P0-C Atomic booking and idempotency
-- Description:
--   1. Database-owned daily counter table for collision-free sequential booking IDs
--   2. Forward-only idempotency_key column with UNIQUE index on public."Bookings"
--   3. Transaction-atomic create_booking_atomic RPC: parent and child items commit
--      or roll back together in ONE database transaction
--   4. Idempotent replay: return existing booking if called with existing key
-- ==============================================================================

-- 1. Ensure public."BookingStatus" enum type exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BookingStatus') THEN
        CREATE TYPE public."BookingStatus" AS ENUM ('NEW', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'PENDING_PAYMENT');
    END IF;
END $$;

-- 2. Add idempotency_key column to Bookings if not present
ALTER TABLE public."Bookings" ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT;

-- 3. Unique index on idempotency_key
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_idempotency_key
ON public."Bookings" ("idempotency_key")
WHERE "idempotency_key" IS NOT NULL;

-- Ensure billCode has a unique constraint / index
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_billcode_unique
ON public."Bookings" ("billCode");

-- Backward-compatible index on idLegacy for legacy idempotency keys
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_idlegacy_idempotency
ON public."Bookings" ("idLegacy")
WHERE "idLegacy" IS NOT NULL AND "idLegacy" LIKE 'idemp:%';

-- 4. Create database-owned daily counter table for collision-free booking numbers
CREATE TABLE IF NOT EXISTS public.booking_daily_counters (
    date_key VARCHAR(8) NOT NULL PRIMARY KEY, -- format: DDMMYYYY (e.g. 07092026)
    last_seq INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed counter with maximum sequence number from existing Bookings (if any)
INSERT INTO public.booking_daily_counters (date_key, last_seq, updated_at)
SELECT
    substring(id from 'WB-([0-9]{8})-') AS date_key,
    COALESCE(MAX(NULLIF(regexp_replace(substring(id from 'WB-[0-9]{8}-([0-9]+)'), '^0+', ''), '')::INTEGER), 0) AS last_seq,
    NOW()
FROM public."Bookings"
WHERE id ~ '^WB-[0-9]{8}-[0-9]+$'
GROUP BY 1
ON CONFLICT (date_key) DO UPDATE
SET last_seq = GREATEST(public.booking_daily_counters.last_seq, EXCLUDED.last_seq),
    updated_at = NOW();

-- 5. Atomic Booking Creation RPC
-- Drop previous versions to prevent signature conflicts
DROP FUNCTION IF EXISTS public.create_booking_atomic(TEXT, JSONB, JSONB, TEXT);
DROP FUNCTION IF EXISTS public.create_booking_atomic(JSONB, JSONB, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_booking_atomic(JSONB, JSONB, TEXT);

CREATE OR REPLACE FUNCTION public.create_booking_atomic(
    p_booking_data JSONB,
    p_booking_items JSONB,
    p_idempotency_key TEXT DEFAULT NULL,
    p_booking_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clean_idemp TEXT;
    v_existing RECORD;
    v_existing_items JSONB;
    v_raw_date TEXT;
    v_date_key TEXT;
    v_target_ts TIMESTAMPTZ;
    v_next_seq INTEGER;
    v_assigned_id TEXT;
    v_item JSONB;
    v_item_idx INTEGER := 0;
    v_item_id TEXT;
    v_item_svc_id TEXT;
    v_item_qty INTEGER;
    v_item_price NUMERIC;
BEGIN
    -- Step A: Idempotency Check
    v_clean_idemp := NULLIF(TRIM(p_idempotency_key), '');
    IF v_clean_idemp IS NOT NULL THEN
        SELECT
            id,
            "billCode",
            "totalAmount",
            "customerName",
            "customerPhone",
            "customerEmail",
            "bookingDate",
            "timeBooking",
            "branchName",
            "customerLang",
            status
        INTO v_existing
        FROM public."Bookings"
        WHERE "idempotency_key" = v_clean_idemp
           OR "idLegacy" = ('idemp:' || v_clean_idemp)
        LIMIT 1;

        IF FOUND THEN
            -- Replay existing committed booking items
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'bookingId', "bookingId",
                    'serviceId', "serviceId",
                    'quantity', quantity,
                    'price', price,
                    'status', status,
                    'options', options,
                    'tip', tip
                )
            ), '[]'::jsonb)
            INTO v_existing_items
            FROM public."BookingItems"
            WHERE "bookingId" = v_existing.id;

            RETURN jsonb_build_object(
                'success', true,
                'idempotent', true,
                'booking_id', v_existing.id,
                'bill_code', v_existing."billCode",
                'data', jsonb_build_object(
                    'bookingId', v_existing.id,
                    'billCode', v_existing."billCode",
                    'customerName', v_existing."customerName",
                    'customerPhone', v_existing."customerPhone",
                    'customerEmail', v_existing."customerEmail",
                    'date', TO_CHAR(v_existing."bookingDate", 'YYYY-MM-DD'),
                    'time', v_existing."timeBooking",
                    'branchName', v_existing."branchName",
                    'totalAmount', v_existing."totalAmount",
                    'lang', v_existing."customerLang",
                    'status', v_existing.status,
                    'items', v_existing_items
                )
            );
        END IF;
    END IF;

    -- Step B: Validate Child Items
    IF p_booking_items IS NULL OR jsonb_array_length(p_booking_items) = 0 THEN
        RAISE EXCEPTION 'Booking items array cannot be empty';
    END IF;

    -- Step C: Sequential ID Allocation in DB transaction
    IF p_booking_id IS NOT NULL AND TRIM(p_booking_id) <> '' THEN
        v_assigned_id := TRIM(p_booking_id);
    ELSE
        v_raw_date := p_booking_data->>'bookingDate';
        IF v_raw_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN
            v_date_key := SUBSTRING(v_raw_date FROM 9 FOR 2) || SUBSTRING(v_raw_date FROM 6 FOR 2) || SUBSTRING(v_raw_date FROM 1 FOR 4);
        ELSIF v_raw_date ~ '^[0-9]{2}-[0-9]{2}-[0-9]{4}' THEN
            v_date_key := SUBSTRING(v_raw_date FROM 1 FOR 2) || SUBSTRING(v_raw_date FROM 4 FOR 2) || SUBSTRING(v_raw_date FROM 7 FOR 4);
        ELSE
            v_date_key := TO_CHAR(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'DDMMYYYY');
        END IF;

        LOOP
            INSERT INTO public.booking_daily_counters (date_key, last_seq, updated_at)
            VALUES (v_date_key, 1, NOW())
            ON CONFLICT (date_key)
            DO UPDATE SET
                last_seq = public.booking_daily_counters.last_seq + 1,
                updated_at = NOW()
            RETURNING last_seq INTO v_next_seq;

            v_assigned_id := 'WB-' || v_date_key || '-' || LPAD(v_next_seq::TEXT, 3, '0');

            EXIT WHEN NOT EXISTS (SELECT 1 FROM public."Bookings" WHERE id = v_assigned_id);
        END LOOP;
    END IF;

    -- Step D: Parse booking date timestamp
    BEGIN
        IF v_raw_date IS NOT NULL AND v_raw_date <> '' THEN
            v_target_ts := v_raw_date::TIMESTAMPTZ;
        ELSE
            v_target_ts := NOW();
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_target_ts := NOW();
    END;

    -- Step E: Insert Parent Booking
    INSERT INTO public."Bookings" (
        id,
        "billCode",
        source,
        "guestCount",
        "branchName",
        "bookingDate",
        "timeBooking",
        "customerName",
        "customerPhone",
        "customerEmail",
        "customerGender",
        "customerLang",
        "customerId",
        "roomName",
        notes,
        "focusAreaNote",
        "totalAmount",
        status,
        tip,
        "idLegacy",
        "idempotency_key",
        "createdAt",
        "updatedAt"
    ) VALUES (
        v_assigned_id,
        COALESCE(p_booking_data->>'billCode', v_assigned_id),
        COALESCE(p_booking_data->>'source', 'WEB_BOOKING'),
        GREATEST(1, COALESCE((p_booking_data->>'guestCount')::INT, 1)),
        COALESCE(p_booking_data->>'branchName', 'ORIA SPA'),
        v_target_ts,
        (p_booking_data->>'timeBooking'),
        COALESCE((p_booking_data->>'customerName'), 'Guest'),
        (p_booking_data->>'customerPhone'),
        (p_booking_data->>'customerEmail'),
        (p_booking_data->>'customerGender'),
        COALESCE(p_booking_data->>'customerLang', 'vi'),
        (p_booking_data->>'customerId'),
        (p_booking_data->>'roomName'),
        (p_booking_data->>'notes'),
        (p_booking_data->>'focusAreaNote'),
        COALESCE((p_booking_data->>'totalAmount')::NUMERIC, 0),
        COALESCE(p_booking_data->>'status', 'NEW')::public."BookingStatus",
        COALESCE((p_booking_data->>'tip')::NUMERIC, 0),
        CASE WHEN v_clean_idemp IS NOT NULL THEN 'idemp:' || v_clean_idemp ELSE NULL END,
        v_clean_idemp,
        NOW(),
        NOW()
    );

    -- Step F: Insert Child BookingItems
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_booking_items)
    LOOP
        v_item_idx := v_item_idx + 1;
        v_item_svc_id := v_item->>'serviceId';
        IF v_item_svc_id IS NULL OR TRIM(v_item_svc_id) = '' THEN
            RAISE EXCEPTION 'Item index % is missing serviceId', v_item_idx;
        END IF;

        v_item_qty := COALESCE((v_item->>'quantity')::INT, 1);
        IF v_item_qty <= 0 THEN
            RAISE EXCEPTION 'Item index % (%): quantity must be positive, got %', v_item_idx, v_item_svc_id, v_item_qty;
        END IF;

        v_item_price := COALESCE((v_item->>'price')::NUMERIC, 0);
        IF v_item_price < 0 THEN
            RAISE EXCEPTION 'Item index % (%): price cannot be negative, got %', v_item_idx, v_item_svc_id, v_item_price;
        END IF;

        v_item_id := COALESCE(
            NULLIF(v_item->>'id', ''),
            v_assigned_id || '-' || v_item_svc_id || '-' || v_item_idx
        );

        INSERT INTO public."BookingItems" (
            id,
            "bookingId",
            "serviceId",
            quantity,
            price,
            status,
            options,
            tip
        ) VALUES (
            v_item_id,
            v_assigned_id,
            v_item_svc_id,
            v_item_qty,
            v_item_price,
            COALESCE(v_item->>'status', 'WAITING'),
            COALESCE(v_item->'options', '{}'::JSONB),
            COALESCE((v_item->>'tip')::NUMERIC, 0)
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'booking_id', v_assigned_id,
        'bill_code', COALESCE(p_booking_data->>'billCode', v_assigned_id),
        'data', jsonb_build_object(
            'bookingId', v_assigned_id,
            'billCode', COALESCE(p_booking_data->>'billCode', v_assigned_id),
            'customerName', p_booking_data->>'customerName',
            'customerPhone', p_booking_data->>'customerPhone',
            'customerEmail', p_booking_data->>'customerEmail',
            'date', TO_CHAR(v_target_ts, 'YYYY-MM-DD'),
            'time', p_booking_data->>'timeBooking',
            'branchName', COALESCE(p_booking_data->>'branchName', 'ORIA SPA'),
            'totalAmount', COALESCE((p_booking_data->>'totalAmount')::NUMERIC, 0),
            'lang', COALESCE(p_booking_data->>'customerLang', 'vi'),
            'status', COALESCE(p_booking_data->>'status', 'NEW')
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Atomic booking transaction failed: %', SQLERRM;
END;
$$;

-- Backward-compatible overload with (p_booking_id, p_booking_data, p_booking_items, p_idempotency_key)
CREATE OR REPLACE FUNCTION public.create_booking_atomic(
    p_booking_id TEXT,
    p_booking_data JSONB,
    p_booking_items JSONB,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.create_booking_atomic(p_booking_data, p_booking_items, p_idempotency_key, p_booking_id);
END;
$$;

-- Grant permissions
GRANT ALL ON TABLE public.booking_daily_counters TO authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION public.create_booking_atomic(JSONB, JSONB, TEXT, TEXT) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.create_booking_atomic(TEXT, JSONB, JSONB, TEXT) TO authenticated, service_role, anon;
