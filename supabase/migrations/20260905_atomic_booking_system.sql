-- ==============================================================================
-- Migration: 20260905_atomic_booking_system.sql
-- Purpose: Atomic Booking Creation, Idempotency & Unique Constraints
-- Author: Senior Full-stack Engineer
-- Notes: Additive migration. Fully rollbackable.
-- ==============================================================================

-- 1. Create unique index for idempotency keys (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_idlegacy_idempotency
ON "Bookings" ("idLegacy")
WHERE "idLegacy" IS NOT NULL AND "idLegacy" LIKE 'idemp:%';

-- 2. Ensure billCode has a unique constraint / index
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_billcode_unique
ON "Bookings" ("billCode");

-- 3. Stored Procedure / RPC for Atomic Booking Transaction
CREATE OR REPLACE FUNCTION create_booking_atomic(
    p_booking_id TEXT,
    p_booking_data JSONB,
    p_booking_items JSONB,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_booking RECORD;
    v_item JSONB;
    v_res JSONB;
BEGIN
    -- Step A: Check idempotency
    IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
        SELECT id, "billCode", "totalAmount", "customerName", "bookingDate"
        INTO v_existing_booking
        FROM "Bookings"
        WHERE "idLegacy" = ('idemp:' || p_idempotency_key)
        LIMIT 1;

        IF FOUND THEN
            RETURN jsonb_build_object(
                'success', true,
                'idempotent', true,
                'booking_id', v_existing_booking.id,
                'bill_code', v_existing_booking."billCode"
            );
        END IF;
    END IF;

    -- Step B: Insert into Bookings
    INSERT INTO "Bookings" (
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
        "createdAt",
        "updatedAt"
    ) VALUES (
        p_booking_id,
        (p_booking_data->>'billCode'),
        COALESCE(p_booking_data->>'source', 'WEB_BOOKING'),
        COALESCE((p_booking_data->>'guestCount')::INT, 1),
        COALESCE(p_booking_data->>'branchName', 'ORIA SPA'),
        (p_booking_data->>'bookingDate')::TIMESTAMP,
        (p_booking_data->>'timeBooking'),
        (p_booking_data->>'customerName'),
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
        CASE WHEN p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN 'idemp:' || p_idempotency_key ELSE NULL END,
        NOW(),
        NOW()
    );

    -- Step C: Insert all items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_booking_items)
    LOOP
        INSERT INTO "BookingItems" (
            id,
            "bookingId",
            "serviceId",
            quantity,
            price,
            status,
            options,
            tip
        ) VALUES (
            (v_item->>'id'),
            p_booking_id,
            (v_item->>'serviceId'),
            COALESCE((v_item->>'quantity')::INT, 1),
            COALESCE((v_item->>'price')::NUMERIC, 0),
            COALESCE(v_item->>'status', 'WAITING'),
            COALESCE(v_item->'options', '{}'::JSONB),
            COALESCE((v_item->>'tip')::NUMERIC, 0)
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'bill_code', p_booking_data->>'billCode'
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Postgres automatically rolls back the entire transaction block on unhandled exception
        RAISE EXCEPTION 'Atomic booking transaction failed: %', SQLERRM;
END;
$$;

-- ==============================================================================
-- ROLLBACK / DOWN NOTES:
-- To revert this migration, execute:
--   DROP FUNCTION IF EXISTS create_booking_atomic(TEXT, JSONB, JSONB, TEXT);
--   DROP INDEX IF EXISTS idx_bookings_billcode_unique;
--   DROP INDEX IF EXISTS idx_bookings_idlegacy_idempotency;
-- ==============================================================================
