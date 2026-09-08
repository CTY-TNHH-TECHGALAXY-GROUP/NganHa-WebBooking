-- Post-apply verification for 20260907_p0_atomic_booking_idempotency.sql.
-- This script intentionally contains only catalog/data reads. The transaction is
-- read-only as a further guard; it is safe to run against production.
--
-- Run after the migration has been applied successfully:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/verification/20260907_p0_atomic_booking_idempotency_read_only.sql

BEGIN TRANSACTION READ ONLY;

-- Every row should have status PASS. INFO rows are observations that need review
-- only when their detail is unexpected for the environment.

-- Required columns and the counter table shape.
WITH expected_columns(check_name, relation_name, column_name, expected_type, expected_not_null) AS (
    VALUES
        ('bookings.idempotency_key', 'public."Bookings"', 'idempotency_key', 'text', false),
        ('bookings.idempotency_fingerprint', 'public."Bookings"', 'idempotency_fingerprint', 'text', false),
        ('counter.date_key', 'public."WebbookingBookingDailyCounters"', 'date_key', 'character varying(8)', true),
        ('counter.last_seq', 'public."WebbookingBookingDailyCounters"', 'last_seq', 'integer', true),
        ('counter.updated_at', 'public."WebbookingBookingDailyCounters"', 'updated_at', 'timestamp with time zone', true)
)
SELECT
    e.check_name,
    CASE
        WHEN a.attnum IS NULL THEN 'FAIL'
        WHEN format_type(a.atttypid, a.atttypmod) <> e.expected_type THEN 'FAIL'
        WHEN a.attnotnull <> e.expected_not_null THEN 'FAIL'
        ELSE 'PASS'
    END AS status,
    COALESCE(
        format('type=%s, not_null=%s', format_type(a.atttypid, a.atttypmod), a.attnotnull),
        'column missing'
    ) AS actual,
    format('type=%s, not_null=%s', e.expected_type, e.expected_not_null) AS expected
FROM expected_columns e
LEFT JOIN pg_class c ON c.oid = to_regclass(e.relation_name)
LEFT JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = e.column_name AND a.attnum > 0 AND NOT a.attisdropped
ORDER BY e.check_name;

-- Required defaults and the counter primary key.
WITH checks(check_name, passed, actual, expected) AS (
    SELECT
        'counter.last_seq_default',
        COALESCE(pg_get_expr(d.adbin, d.adrelid) = '0', false),
        COALESCE(pg_get_expr(d.adbin, d.adrelid), 'default missing'),
        '0'
    FROM pg_class c
    LEFT JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'last_seq' AND a.attnum > 0 AND NOT a.attisdropped
    LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
    WHERE c.oid = to_regclass('public."WebbookingBookingDailyCounters"')

    UNION ALL

    SELECT
        'counter.updated_at_default',
        COALESCE(pg_get_expr(d.adbin, d.adrelid) IN ('now()', 'CURRENT_TIMESTAMP'), false),
        COALESCE(pg_get_expr(d.adbin, d.adrelid), 'default missing'),
        'now() or CURRENT_TIMESTAMP'
    FROM pg_class c
    LEFT JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'updated_at' AND a.attnum > 0 AND NOT a.attisdropped
    LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
    WHERE c.oid = to_regclass('public."WebbookingBookingDailyCounters"')

    UNION ALL

    SELECT
        'counter.date_key_primary_key',
        EXISTS (
            SELECT 1
            FROM pg_constraint con
            JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY (con.conkey)
            WHERE con.conrelid = to_regclass('public."WebbookingBookingDailyCounters"')
              AND con.contype = 'p'
            GROUP BY con.oid
            HAVING array_agg(a.attname::text ORDER BY array_position(con.conkey, a.attnum)) = ARRAY['date_key']::text[]
        ),
        COALESCE((SELECT pg_get_constraintdef(con.oid) FROM pg_constraint con WHERE con.conrelid = to_regclass('public."WebbookingBookingDailyCounters"') AND con.contype = 'p'), 'primary key missing'),
        'PRIMARY KEY (date_key)'
)
SELECT check_name, CASE WHEN passed THEN 'PASS' ELSE 'FAIL' END AS status, actual, expected
FROM checks
ORDER BY check_name;

-- Required indexes. This checks uniqueness, target table/key, and partial predicate.
WITH expected_indexes(check_name, index_name, column_name, expected_predicate) AS (
    VALUES
        ('index.idempotency_key', 'public.idx_bookings_idempotency_key', 'idempotency_key', '(idempotency_key IS NOT NULL)'),
        ('index.bill_code', 'public.idx_bookings_billcode_unique', 'billCode', NULL),
        ('index.legacy_idempotency', 'public.idx_bookings_idlegacy_idempotency', 'idLegacy', '(("idLegacy" IS NOT NULL) AND ("idLegacy" ~~ ''idemp:%''::text))')
), inspected AS (
    SELECT
        e.*,
        i.indexrelid,
        i.indisunique,
        pg_get_expr(i.indpred, i.indrelid) AS predicate,
        ARRAY(
            SELECT a.attname::text
            FROM unnest(i.indkey) WITH ORDINALITY key_col(attnum, ordinality)
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = key_col.attnum
            ORDER BY key_col.ordinality
        ) AS indexed_columns,
        i.indrelid = to_regclass('public."Bookings"') AS targets_bookings
    FROM expected_indexes e
    LEFT JOIN pg_index i ON i.indexrelid = to_regclass(e.index_name)
)
SELECT
    check_name,
    CASE
        WHEN indexrelid IS NULL THEN 'FAIL'
        WHEN NOT indisunique OR NOT targets_bookings OR indexed_columns <> ARRAY[column_name] THEN 'FAIL'
        WHEN expected_predicate IS NULL AND predicate IS NOT NULL THEN 'FAIL'
        WHEN expected_predicate IS NOT NULL AND predicate <> expected_predicate THEN 'FAIL'
        ELSE 'PASS'
    END AS status,
    COALESCE(format('unique=%s, table=Bookings=%s, columns=%s, predicate=%s', indisunique, targets_bookings, indexed_columns, predicate), 'index missing') AS actual,
    format('unique=true, table=Bookings, columns={%s}, predicate=%s', column_name, COALESCE(expected_predicate, '<none>')) AS expected
FROM inspected
ORDER BY check_name;

-- Exactly one supported RPC signature must remain. Parameter names matter to PostgREST/Supabase RPC calls.
WITH functions AS (
    SELECT
        p.oid,
        pg_catalog.oidvectortypes(p.proargtypes) AS type_arguments,
        pg_get_function_arguments(p.oid) AS arguments,
        p.proargnames,
        p.pronargs,
        p.pronargdefaults,
        p.prosecdef,
        p.prorettype = 'jsonb'::regtype AS returns_jsonb,
        COALESCE(p.proconfig @> ARRAY['search_path=pg_catalog, public'], false) AS pins_search_path
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname = 'create_booking_atomic'
), expected AS (
    SELECT *
    FROM functions
    WHERE type_arguments = 'jsonb, jsonb, text, text'
      AND proargnames = ARRAY['p_booking_data', 'p_booking_items', 'p_idempotency_key', 'p_booking_id']::text[]
)
SELECT
    'function.supported_signature' AS check_name,
    CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS status,
    COALESCE(string_agg(arguments, ' | '), 'function missing') AS actual,
    'p_booking_data jsonb, p_booking_items jsonb, p_idempotency_key text DEFAULT NULL, p_booking_id text DEFAULT NULL -> jsonb' AS expected
FROM expected

UNION ALL

SELECT
    'function.no_unsupported_overloads',
    CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
    COALESCE(string_agg(arguments, ' | '), '<none>'),
    '<none>'
FROM functions
WHERE type_arguments <> 'jsonb, jsonb, text, text'
   OR proargnames IS DISTINCT FROM ARRAY['p_booking_data', 'p_booking_items', 'p_idempotency_key', 'p_booking_id']::text[]

UNION ALL

SELECT
    'function.security_properties',
    CASE WHEN count(*) = 1 AND bool_and(pronargs = 4 AND pronargdefaults = 2 AND prosecdef AND returns_jsonb AND pins_search_path) THEN 'PASS' ELSE 'FAIL' END,
    COALESCE(string_agg(format('args=%s defaults=%s security_definer=%s returns_jsonb=%s search_path_pinned=%s', pronargs, pronargdefaults, prosecdef, returns_jsonb, pins_search_path), ' | '), 'function missing'),
    'args=4 defaults=2 security_definer=true returns_jsonb=true search_path_pinned=true'
FROM expected;

-- Effective privileges. Browser roles must not access the counter or execute the writer;
-- service_role alone must have both capabilities.
WITH roles(role_name, should_have) AS (
    VALUES ('anon', false), ('authenticated', false), ('service_role', true)
), counter AS (
    SELECT c.oid, c.relrowsecurity, c.relacl, c.relowner
    FROM pg_class c WHERE c.oid = to_regclass('public."WebbookingBookingDailyCounters"')
)
SELECT
    'acl.counter.' || roles.role_name AS check_name,
    CASE
        WHEN r.oid IS NULL OR counter.oid IS NULL THEN 'FAIL'
        WHEN (has_table_privilege(r.oid, counter.oid, 'SELECT') OR has_table_privilege(r.oid, counter.oid, 'INSERT') OR has_table_privilege(r.oid, counter.oid, 'UPDATE') OR has_table_privilege(r.oid, counter.oid, 'DELETE')) <> roles.should_have THEN 'FAIL'
        ELSE 'PASS'
    END AS status,
    CASE WHEN r.oid IS NULL THEN 'role missing' ELSE format('select=%s insert=%s update=%s delete=%s', has_table_privilege(r.oid, counter.oid, 'SELECT'), has_table_privilege(r.oid, counter.oid, 'INSERT'), has_table_privilege(r.oid, counter.oid, 'UPDATE'), has_table_privilege(r.oid, counter.oid, 'DELETE')) END AS actual,
    CASE WHEN roles.should_have THEN 'all DML privileges' ELSE 'no DML privileges' END AS expected
FROM roles
LEFT JOIN pg_roles r ON r.rolname = roles.role_name
CROSS JOIN counter

UNION ALL

SELECT
    'acl.counter.rls_enabled',
    CASE WHEN relrowsecurity THEN 'PASS' ELSE 'FAIL' END,
    relrowsecurity::text,
    'true'
FROM counter

UNION ALL

SELECT
    'acl.counter.public_grant_absent',
    CASE WHEN NOT EXISTS (SELECT 1 FROM aclexplode(COALESCE(relacl, acldefault('r', relowner))) privilege WHERE privilege.grantee = 0 AND privilege.privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')) THEN 'PASS' ELSE 'FAIL' END,
    CASE WHEN EXISTS (SELECT 1 FROM aclexplode(COALESCE(relacl, acldefault('r', relowner))) privilege WHERE privilege.grantee = 0 AND privilege.privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')) THEN 'PUBLIC DML grant present' ELSE 'no PUBLIC DML grant' END,
    'no PUBLIC DML grant'
FROM counter;

WITH roles(role_name, should_have_execute) AS (
    VALUES ('anon', false), ('authenticated', false), ('service_role', true)
), function_target AS (
    SELECT p.oid, p.proacl, p.proowner
    FROM pg_proc p
    WHERE p.oid = to_regprocedure('public.create_booking_atomic(jsonb,jsonb,text,text)')
)
SELECT
    'acl.function.' || roles.role_name AS check_name,
    CASE WHEN r.oid IS NULL OR function_target.oid IS NULL THEN 'FAIL'
         WHEN has_function_privilege(r.oid, function_target.oid, 'EXECUTE') = roles.should_have_execute THEN 'PASS'
         ELSE 'FAIL'
    END AS status,
    CASE WHEN r.oid IS NULL THEN 'role missing' ELSE format('execute=%s', has_function_privilege(r.oid, function_target.oid, 'EXECUTE')) END AS actual,
    CASE WHEN roles.should_have_execute THEN 'execute=true' ELSE 'execute=false' END AS expected
FROM roles
LEFT JOIN pg_roles r ON r.rolname = roles.role_name
CROSS JOIN function_target

UNION ALL

SELECT
    'acl.function.public_execute_absent',
    CASE WHEN NOT EXISTS (SELECT 1 FROM aclexplode(COALESCE(proacl, acldefault('f', proowner))) privilege WHERE privilege.grantee = 0 AND privilege.privilege_type = 'EXECUTE') THEN 'PASS' ELSE 'FAIL' END,
    CASE WHEN EXISTS (SELECT 1 FROM aclexplode(COALESCE(proacl, acldefault('f', proowner))) privilege WHERE privilege.grantee = 0 AND privilege.privilege_type = 'EXECUTE') THEN 'PUBLIC EXECUTE grant present' ELSE 'no PUBLIC EXECUTE grant' END,
    'no PUBLIC EXECUTE grant'
FROM function_target;

-- Customer integrity: the RPC must be able to resolve/link a customer without
-- leaving dangling references. This is a structural/data check only.
WITH customer_checks(check_name, passed, actual, expected) AS (
    SELECT
        'customer.bookings_customer_id_column',
        EXISTS (
            SELECT 1 FROM pg_attribute
            WHERE attrelid = 'public."Bookings"'::regclass
              AND attname = 'customerId'
              AND attnum > 0
              AND NOT attisdropped
        ),
        CASE WHEN EXISTS (
            SELECT 1 FROM pg_attribute
            WHERE attrelid = 'public."Bookings"'::regclass
              AND attname = 'customerId'
              AND attnum > 0
              AND NOT attisdropped
        ) THEN 'column present' ELSE 'column missing' END,
        'column present'
    UNION ALL
    SELECT
        'customer.bookings_customer_id_fk',
        EXISTS (
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
        ),
        COALESCE((
            SELECT pg_get_constraintdef(oid)
            FROM pg_constraint
            WHERE conrelid = 'public."Bookings"'::regclass
              AND confrelid = 'public."Customers"'::regclass
              AND contype = 'f'
            LIMIT 1
        ), 'foreign key missing'),
        'Bookings.customerId references Customers.id'
    UNION ALL
    SELECT
        'customer.no_orphan_booking_links',
        NOT EXISTS (
            SELECT 1
            FROM public."Bookings" b
            LEFT JOIN public."Customers" c ON c.id = b."customerId"
            WHERE b."customerId" IS NOT NULL AND c.id IS NULL
        ),
        (SELECT count(*)::text
         FROM public."Bookings" b
         LEFT JOIN public."Customers" c ON c.id = b."customerId"
         WHERE b."customerId" IS NOT NULL AND c.id IS NULL),
        '0'
)
SELECT check_name, CASE WHEN passed THEN 'PASS' ELSE 'FAIL' END AS status, actual, expected
FROM customer_checks
ORDER BY check_name;

-- Duplicate data that would weaken idempotency/uniqueness and parent/child integrity.
WITH findings(check_name, duplicate_groups, duplicate_rows) AS (
    SELECT 'data.duplicate_idempotency_key', count(*), COALESCE(sum(row_count), 0)
    FROM (SELECT count(*) AS row_count FROM public."Bookings" WHERE "idempotency_key" IS NOT NULL GROUP BY "idempotency_key" HAVING count(*) > 1) d
    UNION ALL
    SELECT 'data.duplicate_bill_code', count(*), COALESCE(sum(row_count), 0)
    FROM (SELECT count(*) AS row_count FROM public."Bookings" WHERE "billCode" IS NOT NULL GROUP BY "billCode" HAVING count(*) > 1) d
    UNION ALL
    SELECT 'data.duplicate_legacy_idempotency_key', count(*), COALESCE(sum(row_count), 0)
    FROM (SELECT count(*) AS row_count FROM public."Bookings" WHERE "idLegacy" IS NOT NULL AND "idLegacy" LIKE 'idemp:%' GROUP BY "idLegacy" HAVING count(*) > 1) d
    UNION ALL
    SELECT 'data.cross_namespace_idempotency_collision', count(*), count(*)
    FROM public."Bookings" current_key
    JOIN public."Bookings" legacy_key
      ON legacy_key."idLegacy" = 'idemp:' || current_key."idempotency_key"
     AND legacy_key.id <> current_key.id
    WHERE current_key."idempotency_key" IS NOT NULL
    UNION ALL
    SELECT 'data.orphan_booking_items', count(*), count(*)
    FROM public."BookingItems" bi
    LEFT JOIN public."Bookings" b ON b.id = bi."bookingId"
    WHERE b.id IS NULL
)
SELECT
    check_name,
    CASE WHEN duplicate_groups = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
    format('groups=%s rows=%s', duplicate_groups, duplicate_rows) AS actual,
    'groups=0 rows=0' AS expected
FROM findings
ORDER BY check_name;

-- Counter values must never lag the largest generated ID for the same DDMMYYYY date.
WITH booking_max AS (
    SELECT
        substring(id FROM '^WB-([0-9]{8})-[0-9]+$') AS date_key,
        max(COALESCE(NULLIF(regexp_replace(substring(id FROM '^WB-[0-9]{8}-([0-9]+)$'), '^0+', ''), '')::integer, 0)) AS booked_max
    FROM public."Bookings"
    WHERE id ~ '^WB-[0-9]{8}-[0-9]+$'
    GROUP BY 1
), compared AS (
    SELECT COALESCE(c.date_key, b.date_key) AS date_key, c.last_seq, b.booked_max
    FROM public."WebbookingBookingDailyCounters" c
    FULL OUTER JOIN booking_max b ON b.date_key = c.date_key
)
SELECT
    'counter.coverage.' || date_key AS check_name,
    CASE WHEN last_seq IS NULL OR last_seq < booked_max THEN 'FAIL' ELSE 'PASS' END AS status,
    format('last_seq=%s booked_max=%s', COALESCE(last_seq::text, '<missing>'), COALESCE(booked_max::text, '0')) AS actual,
    'counter exists and last_seq >= booked_max' AS expected
FROM compared
WHERE booked_max IS NOT NULL

UNION ALL

SELECT
    'counter.invalid_rows',
    CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
    format('rows=%s', count(*)),
    'rows=0'
FROM public."WebbookingBookingDailyCounters"
WHERE date_key !~ '^[0-9]{8}$' OR last_seq < 0
ORDER BY check_name;

COMMIT;
