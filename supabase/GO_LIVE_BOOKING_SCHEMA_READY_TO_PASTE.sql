-- WITHDRAWN FROM THE WEB RELEASE PLAN. DO NOT PASTE OR APPLY THIS FILE.
-- The shared booking schema belongs to the separate operations system.
-- This historical proposal alters shared tables/constraints and installs an RPC.
-- Retained for review only; its filename no longer indicates approval to run.
-- See plans/GO_LIVE_FINAL_STEPS_20260908.md for the current integration plan.
-- ==============================================================================
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

BEGIN;

-- 1. Ensure public."BookingStatus" enum type exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BookingStatus') THEN
        CREATE TYPE public."BookingStatus" AS ENUM ('NEW', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'PENDING_PAYMENT');
    END IF;
END $$;

-- 2. Add idempotency fields to Bookings if not present
ALTER TABLE public."Bookings" ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT;
ALTER TABLE public."Bookings" ADD COLUMN IF NOT EXISTS "idempotency_fingerprint" TEXT;

-- Stop before creating constraints if pre-existing data is ambiguous.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public."Bookings"
        WHERE "idempotency_key" IS NOT NULL
        GROUP BY "idempotency_key"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Duplicate non-null Bookings.idempotency_key values must be reviewed before migration';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public."Bookings"
        WHERE "billCode" IS NOT NULL
        GROUP BY "billCode"
        HAVING COUNT(*) > 1
    ) THEN
            RAISE EXCEPTION 'Duplicate Bookings.billCode values must be reviewed before migration';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public."Bookings"
        WHERE "idLegacy" IS NOT NULL AND "idLegacy" LIKE 'idemp:%'
        GROUP BY "idLegacy"
        HAVING COUNT(*) > 1
    ) THEN
            RAISE EXCEPTION 'Duplicate legacy idempotency keys must be reviewed before migration';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public."Bookings" current_key
        JOIN public."Bookings" legacy_key
          ON legacy_key."idLegacy" = 'idemp:' || current_key."idempotency_key"
         AND legacy_key.id <> current_key.id
        WHERE current_key."idempotency_key" IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Cross-namespace idempotency key collisions must be reviewed before migration';
    END IF;
END $$;

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

-- 4. Create database-owned daily counter table for collision-free booking numbers.
-- The technical table uses the required Webbooking prefix.
CREATE TABLE IF NOT EXISTS public."WebbookingBookingDailyCounters" (
    date_key VARCHAR(8) NOT NULL PRIMARY KEY, -- format: DDMMYYYY (e.g. 07092026)
    last_seq INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Preserve the counter contract when the table already exists from an earlier
-- attempt. A bad legacy row must stop the migration instead of being repaired
-- implicitly.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public."WebbookingBookingDailyCounters"'::regclass
          AND conname = 'webbooking_counter_date_key_format'
    ) THEN
        ALTER TABLE public."WebbookingBookingDailyCounters"
            ADD CONSTRAINT webbooking_counter_date_key_format
            CHECK (date_key ~ '^[0-9]{8}$');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public."WebbookingBookingDailyCounters"'::regclass
          AND conname = 'webbooking_counter_last_seq_nonnegative'
    ) THEN
        ALTER TABLE public."WebbookingBookingDailyCounters"
            ADD CONSTRAINT webbooking_counter_last_seq_nonnegative
            CHECK (last_seq >= 0);
    END IF;
END $$;

-- Seed counter with maximum sequence number from existing Bookings (if any)
INSERT INTO public."WebbookingBookingDailyCounters" (date_key, last_seq, updated_at)
SELECT
    substring(id from 'WB-([0-9]{8})-') AS date_key,
    COALESCE(MAX(NULLIF(regexp_replace(substring(id from 'WB-[0-9]{8}-([0-9]+)'), '^0+', ''), '')::INTEGER), 0) AS last_seq,
    NOW()
FROM public."Bookings"
WHERE id ~ '^WB-[0-9]{8}-[0-9]+$'
GROUP BY 1
ON CONFLICT (date_key) DO UPDATE
SET last_seq = GREATEST(public."WebbookingBookingDailyCounters".last_seq, EXCLUDED.last_seq),
    updated_at = NOW();

-- Customer links must remain valid before the new writer is enabled. Existing
-- orphaned references are a migration blocker, never something to repair here.
DO $$
BEGIN
    IF to_regclass('public."Customers"') IS NULL THEN
        RAISE EXCEPTION 'Customers table is required for atomic booking migration';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute
        WHERE attrelid = 'public."Bookings"'::regclass
          AND attname = 'customerId'
          AND attnum > 0
          AND NOT attisdropped
    ) THEN
        RAISE EXCEPTION 'Bookings.customerId is required for atomic customer linking';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM public."Bookings" b
        LEFT JOIN public."Customers" c ON c.id = b."customerId"
        WHERE b."customerId" IS NOT NULL AND c.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Orphaned Bookings.customerId values must be reviewed before migration';
    END IF;
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public."Bookings"'::regclass
          AND confrelid = 'public."Customers"'::regclass
          AND contype = 'f'
          AND conkey = ARRAY[
              (SELECT attnum FROM pg_attribute
               WHERE attrelid = 'public."Bookings"'::regclass
                 AND attname = 'customerId'
                 AND attnum > 0
                 AND NOT attisdropped)
          ]::smallint[]
    ) THEN
        ALTER TABLE public."Bookings"
            ADD CONSTRAINT bookings_customer_id_fkey
            FOREIGN KEY ("customerId") REFERENCES public."Customers" (id)
            ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public."Customers"
        WHERE phone IS NOT NULL AND BTRIM(phone) <> ''
        GROUP BY phone HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Duplicate customer phone identities must be reviewed before migration';
    END IF;
    IF EXISTS (
        SELECT 1 FROM public."Customers"
        WHERE email IS NOT NULL AND BTRIM(email) <> ''
        GROUP BY LOWER(email) HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Duplicate customer email identities must be reviewed before migration';
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone_unique
    ON public."Customers" (phone)
    WHERE phone IS NOT NULL AND BTRIM(phone) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_email_lower_unique
    ON public."Customers" (LOWER(email))
    WHERE email IS NOT NULL AND BTRIM(email) <> '';

CREATE INDEX IF NOT EXISTS idx_bookings_customer_id
    ON public."Bookings" ("customerId")
    WHERE "customerId" IS NOT NULL;

-- 5. Atomic Booking Creation RPC
-- Drop every unsupported overload so PostgREST cannot resolve an older writer.
-- oidvectortypes() is deliberately used here and in the verifier: unlike
-- pg_get_function_arguments(), it returns only the identity type list.
DO $$
DECLARE
    v_function RECORD;
BEGIN
    FOR v_function IN
        SELECT oidvectortypes(p.proargtypes) AS type_arguments
        FROM pg_proc p
        WHERE p.pronamespace = 'public'::regnamespace
          AND p.proname = 'create_booking_atomic'
    LOOP
        IF v_function.type_arguments <> 'jsonb, jsonb, text, text' THEN
            EXECUTE format(
                'DROP FUNCTION IF EXISTS public.create_booking_atomic(%s)',
                v_function.type_arguments
            );
        END IF;
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.create_booking_atomic(
    p_booking_data JSONB,
    p_booking_items JSONB,
    p_idempotency_key TEXT DEFAULT NULL,
    p_booking_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
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
    v_item_catalog_price NUMERIC;
    v_total_amount NUMERIC := 0;
    v_incoming_fingerprint TEXT;
    v_id_attempts INTEGER := 0;
    v_customer_name TEXT;
    v_customer_phone TEXT;
    v_customer_email TEXT;
    v_customer_id TEXT;
    v_customer_by_phone TEXT;
    v_customer_by_email TEXT;
    v_expected_catalog JSONB;
    v_actual_catalog JSONB;
BEGIN
    IF p_booking_data IS NULL OR jsonb_typeof(p_booking_data) <> 'object' THEN
        RAISE EXCEPTION 'Booking data must be a JSON object';
    END IF;
    IF p_booking_items IS NULL OR jsonb_typeof(p_booking_items) <> 'array' THEN
        RAISE EXCEPTION 'Booking items must be a JSON array';
    END IF;
    IF p_booking_id IS NOT NULL AND NULLIF(TRIM(p_booking_id), '') IS NOT NULL THEN
        RAISE EXCEPTION 'Client cannot provide a booking ID';
    END IF;

    v_customer_name := NULLIF(BTRIM(p_booking_data->>'customerName'), '');
    IF v_customer_name IS NULL THEN
        RAISE EXCEPTION 'Customer name is required';
    END IF;

    IF p_booking_data ? 'guestCount'
       AND (jsonb_typeof(p_booking_data->'guestCount') <> 'number'
            OR (p_booking_data->>'guestCount') !~ '^[0-9]+$') THEN
        RAISE EXCEPTION 'Guest count must be a positive integer';
    END IF;
    IF p_booking_data ? 'guestCount'
       AND ((p_booking_data->>'guestCount')::INTEGER < 1
            OR (p_booking_data->>'guestCount')::INTEGER > 20) THEN
        RAISE EXCEPTION 'Guest count must be between 1 and 20';
    END IF;

    v_raw_date := NULLIF(BTRIM(p_booking_data->>'bookingDate'), '');
    IF v_raw_date IS NULL THEN
        RAISE EXCEPTION 'Booking date is required';
    END IF;
    BEGIN
        v_target_ts := v_raw_date::TIMESTAMPTZ;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Booking date is invalid';
    END;
    IF v_target_ts IS NULL THEN
        RAISE EXCEPTION 'Booking date is invalid';
    END IF;

    -- Step A: Idempotency Check
    v_clean_idemp := NULLIF(TRIM(p_idempotency_key), '');
    IF v_clean_idemp IS NOT NULL THEN
        IF LENGTH(v_clean_idemp) > 200 OR v_clean_idemp ~ '[[:cntrl:]]' THEN
            RAISE EXCEPTION 'Invalid idempotency key';
        END IF;

        -- Serialize requests for the same key before reading or allocating an ID.
        PERFORM pg_catalog.pg_advisory_xact_lock(
            pg_catalog.hashtextextended(v_clean_idemp, 0)
        );
        v_incoming_fingerprint := NULLIF(TRIM(p_booking_data->>'requestFingerprint'), '');
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
            "customerId",
            "customerGender",
            "roomName",
            notes,
            "focusAreaNote",
            "idempotency_key",
            "idempotency_fingerprint",
            status
        INTO v_existing
        FROM public."Bookings"
        WHERE "idempotency_key" = v_clean_idemp
           OR "idLegacy" = ('idemp:' || v_clean_idemp)
        LIMIT 1;

        IF FOUND THEN
            -- A legacy idemp:key row has no canonical intent to compare. Never
            -- accept an arbitrary replay against such a row.
            IF v_existing.idempotency_key IS NULL
               OR v_existing.idempotency_fingerprint IS NULL THEN
                RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'IDEMPOTENCY_LEGACY_REVIEW';
            END IF;
            IF v_incoming_fingerprint IS NULL THEN
                RAISE EXCEPTION 'Request fingerprint is required';
            END IF;
            IF v_existing.idempotency_fingerprint <> v_incoming_fingerprint THEN
                RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'IDEMPOTENCY_CONFLICT';
            END IF;
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
                ) ORDER BY id
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
                    'date', TO_CHAR(v_existing."bookingDate" AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD'),
                    'time', v_existing."timeBooking",
                    'branchName', v_existing."branchName",
                    'totalAmount', v_existing."totalAmount",
                    'lang', v_existing."customerLang",
                    'customerId', v_existing."customerId",
                    'customerGender', v_existing."customerGender",
                    'roomName', v_existing."roomName",
                    'notes', v_existing.notes,
                    'focusAreaNote', v_existing."focusAreaNote",
                    'status', v_existing.status,
                    'items', v_existing_items
                )
            );
        END IF;

        IF v_incoming_fingerprint IS NULL
           OR v_incoming_fingerprint !~ '^[0-9a-fA-F]{64}$' THEN
            RAISE EXCEPTION 'Request fingerprint is required';
        END IF;
    END IF;

    -- Step B: Validate Child Items
    IF jsonb_array_length(p_booking_items) = 0 THEN
        RAISE EXCEPTION 'Booking items array cannot be empty';
    END IF;

    -- A stable lock order prevents cross-cart deadlocks. Keep catalog rows
    -- locked until the booking commits, including price-only admin updates.
    PERFORM id FROM public."Services"
    WHERE id IN (SELECT item->>'serviceId' FROM jsonb_array_elements(p_booking_items) item)
    ORDER BY id FOR SHARE;
    IF p_booking_data ? 'expectedCatalog' THEN
        IF jsonb_typeof(p_booking_data->'expectedCatalog') <> 'array' THEN
            RAISE EXCEPTION 'PRICE_CHANGED';
        END IF;
        SELECT jsonb_agg(item ORDER BY item->>'id') INTO v_expected_catalog
        FROM jsonb_array_elements(p_booking_data->'expectedCatalog') item;
        SELECT jsonb_agg(jsonb_build_object(
            'id', id, 'priceVND', "priceVND", 'priceUSD', "priceUSD",
            'duration', duration, 'isActive', "isActive"
        ) ORDER BY id) INTO v_actual_catalog
        FROM public."Services"
        WHERE id IN (SELECT item->>'serviceId' FROM jsonb_array_elements(p_booking_items) item);
        IF v_expected_catalog IS DISTINCT FROM v_actual_catalog THEN
            RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'PRICE_CHANGED';
        END IF;
    END IF;

    -- Resolve or create the customer under the same transaction as the parent
    -- and children. Existing profiles are read-only for this public flow.
    v_customer_phone := NULLIF(BTRIM(p_booking_data->>'customerPhone'), '');
    v_customer_email := NULLIF(LOWER(BTRIM(p_booking_data->>'customerEmail')), '');
    IF v_customer_phone IS NOT NULL THEN
        PERFORM pg_catalog.pg_advisory_xact_lock(
            pg_catalog.hashtextextended('customer:phone:' || v_customer_phone, 0)
        );
    END IF;
    IF v_customer_email IS NOT NULL THEN
        PERFORM pg_catalog.pg_advisory_xact_lock(
            pg_catalog.hashtextextended('customer:email:' || v_customer_email, 0)
        );
    END IF;

    IF v_customer_phone IS NOT NULL THEN
        SELECT id INTO v_customer_by_phone
        FROM public."Customers"
        WHERE phone = v_customer_phone
        ORDER BY "createdAt" NULLS FIRST, id
        LIMIT 1;
    END IF;
    IF v_customer_email IS NOT NULL THEN
        SELECT id INTO v_customer_by_email
        FROM public."Customers"
        WHERE LOWER(email) = v_customer_email
        ORDER BY "createdAt" NULLS FIRST, id
        LIMIT 1;
    END IF;
    IF v_customer_by_phone IS NOT NULL
       AND v_customer_by_email IS NOT NULL
       AND v_customer_by_phone <> v_customer_by_email THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'CUSTOMER_IDENTITY_CONFLICT';
    END IF;
    v_customer_id := COALESCE(v_customer_by_phone, v_customer_by_email);
    IF v_customer_id IS NULL AND (v_customer_phone IS NOT NULL OR v_customer_email IS NOT NULL) THEN
        v_customer_id := 'CUS-' || md5(
            COALESCE(v_customer_phone, '') || '|' ||
            COALESCE(v_customer_email, '') || '|' ||
            clock_timestamp()::TEXT || '|' || random()::TEXT
        );
        INSERT INTO public."Customers" (
            id, "fullName", phone, email, gender, "createdAt", "updatedAt"
        ) VALUES (
            v_customer_id,
            v_customer_name,
            v_customer_phone,
            v_customer_email,
            NULLIF(BTRIM(p_booking_data->>'customerGender'), ''),
            NOW(),
            NOW()
        );
    END IF;

    -- Step C: Allocate from a row lock keyed by the spa-local date. The
    -- timestamp is converted before extracting DDMMYYYY so a midnight booking
    -- does not receive the device/UTC date.
    v_date_key := TO_CHAR(v_target_ts AT TIME ZONE 'Asia/Ho_Chi_Minh', 'DDMMYYYY');
    LOOP
        v_id_attempts := v_id_attempts + 1;
        IF v_id_attempts > 1000 THEN
            RAISE EXCEPTION 'Unable to allocate a unique booking ID after 1000 attempts';
        END IF;

        INSERT INTO public."WebbookingBookingDailyCounters" (date_key, last_seq, updated_at)
        VALUES (v_date_key, 0, NOW())
        ON CONFLICT (date_key) DO NOTHING;

        SELECT last_seq
        INTO v_next_seq
        FROM public."WebbookingBookingDailyCounters"
        WHERE date_key = v_date_key
        FOR UPDATE;

        IF v_next_seq >= 2147483647 THEN
            RAISE EXCEPTION 'Booking counter exhausted for date %', v_date_key;
        END IF;
        v_next_seq := v_next_seq + 1;
        UPDATE public."WebbookingBookingDailyCounters"
        SET last_seq = v_next_seq, updated_at = NOW()
        WHERE date_key = v_date_key;

        v_assigned_id := 'WB-' || v_date_key || '-' ||
            CASE WHEN v_next_seq < 1000 THEN LPAD(v_next_seq::TEXT, 3, '0') ELSE v_next_seq::TEXT END;

        EXIT WHEN NOT EXISTS (SELECT 1 FROM public."Bookings" WHERE id = v_assigned_id);
    END LOOP;

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
        "idempotency_fingerprint",
        "createdAt",
        "updatedAt"
    ) VALUES (
        v_assigned_id,
        v_assigned_id,
        'WEB_BOOKING',
        GREATEST(1, COALESCE((p_booking_data->>'guestCount')::INT, 1)),
        COALESCE(p_booking_data->>'branchName', 'ORIA SPA'),
        v_target_ts,
        (p_booking_data->>'timeBooking'),
        v_customer_name,
        v_customer_phone,
        v_customer_email,
        (p_booking_data->>'customerGender'),
        COALESCE(p_booking_data->>'customerLang', 'vi'),
        v_customer_id,
        (p_booking_data->>'roomName'),
        (p_booking_data->>'notes'),
        (p_booking_data->>'focusAreaNote'),
        0,
        'NEW'::public."BookingStatus",
        0,
        CASE WHEN v_clean_idemp IS NOT NULL THEN 'idemp:' || v_clean_idemp ELSE NULL END,
        v_clean_idemp,
        v_incoming_fingerprint,
        NOW(),
        NOW()
    );

    -- Step F: Insert Child BookingItems
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_booking_items)
    LOOP
        v_item_idx := v_item_idx + 1;
        IF jsonb_typeof(v_item) <> 'object' THEN
            RAISE EXCEPTION 'Item index % must be a JSON object', v_item_idx;
        END IF;
        v_item_svc_id := v_item->>'serviceId';
        IF v_item_svc_id IS NULL OR TRIM(v_item_svc_id) = '' THEN
            RAISE EXCEPTION 'Item index % is missing serviceId', v_item_idx;
        END IF;

        IF v_item ? 'quantity'
           AND (jsonb_typeof(v_item->'quantity') <> 'number'
                OR (v_item->>'quantity') !~ '^[0-9]+$') THEN
            RAISE EXCEPTION 'Item index % (%): quantity must be an integer', v_item_idx, v_item_svc_id;
        END IF;
        v_item_qty := COALESCE((v_item->>'quantity')::INT, 1);
        IF v_item_qty < 1 OR v_item_qty > 20 THEN
            RAISE EXCEPTION 'Item index % (%): quantity must be between 1 and 20, got %', v_item_idx, v_item_svc_id, v_item_qty;
        END IF;

        SELECT "priceVND"
        INTO v_item_catalog_price
        FROM public."Services"
        WHERE id = v_item_svc_id AND "isActive" = true
        LIMIT 1;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Item index % (%): service is not active or does not exist', v_item_idx, v_item_svc_id;
        END IF;
        IF v_item_catalog_price IS NULL OR v_item_catalog_price < 0 THEN
            RAISE EXCEPTION 'Item index % (%): service has no valid canonical price', v_item_idx, v_item_svc_id;
        END IF;
        v_item_price := v_item_catalog_price;
        v_total_amount := v_total_amount + (v_item_price * v_item_qty);

        -- Item IDs are server-owned so a caller cannot collide with another
        -- booking or make retries depend on an arbitrary client ID.
        v_item_id := v_assigned_id || '-ITEM-' || LPAD(v_item_idx::TEXT, 3, '0');
        IF v_item ? 'options' AND jsonb_typeof(v_item->'options') <> 'object' THEN
            RAISE EXCEPTION 'Item index % (%): options must be a JSON object', v_item_idx, v_item_svc_id;
        END IF;

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
            'WAITING',
            COALESCE(v_item->'options', '{}'::JSONB),
            0
        );
    END LOOP;

    UPDATE public."Bookings"
    SET "totalAmount" = v_total_amount,
        "updatedAt" = NOW()
    WHERE id = v_assigned_id;

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
        ) ORDER BY id
    ), '[]'::jsonb)
    INTO v_existing_items
    FROM public."BookingItems"
    WHERE "bookingId" = v_assigned_id;

    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'booking_id', v_assigned_id,
        'bill_code', v_assigned_id,
        'data', jsonb_build_object(
            'bookingId', v_assigned_id,
            'billCode', v_assigned_id,
            'customerName', v_customer_name,
            'customerPhone', v_customer_phone,
            'customerEmail', v_customer_email,
            'customerId', v_customer_id,
            'customerGender', p_booking_data->>'customerGender',
            'date', TO_CHAR(v_target_ts AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD'),
            'time', p_booking_data->>'timeBooking',
            'branchName', COALESCE(p_booking_data->>'branchName', 'ORIA SPA'),
            'totalAmount', v_total_amount,
            'lang', COALESCE(p_booking_data->>'customerLang', 'vi'),
            'status', 'NEW',
            'items', v_existing_items
        )
    );

EXCEPTION
    WHEN SQLSTATE 'P0001' THEN
        RAISE;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Atomic booking transaction failed: %', SQLERRM;
END;
$$;

-- The old overload accepted a client-supplied booking ID and must not remain exposed.
DROP FUNCTION IF EXISTS public.create_booking_atomic(TEXT, JSONB, JSONB, TEXT);

-- Keep the counter private. The SECURITY DEFINER function owner performs the write.
ALTER TABLE public."WebbookingBookingDailyCounters" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."WebbookingBookingDailyCounters" FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public."WebbookingBookingDailyCounters" TO service_role;

-- Never expose a SECURITY DEFINER booking writer to browser roles.
REVOKE ALL ON FUNCTION public.create_booking_atomic(JSONB, JSONB, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking_atomic(JSONB, JSONB, TEXT, TEXT) TO service_role;
ALTER FUNCTION public.create_booking_atomic(JSONB, JSONB, TEXT, TEXT)
    SET search_path = pg_catalog, public;

COMMIT;
