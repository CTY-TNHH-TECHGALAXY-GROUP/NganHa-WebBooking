-- REVIEW BEFORE APPLYING. This migration adds a narrow atomic writer used by
-- the History editor and the rendition migration. It makes no content change.
-- Apply only after the preflight block succeeds against the target project.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $$
DECLARE
  system_configs_relation REGCLASS := to_regclass('public."SystemConfigs"');
BEGIN
  IF system_configs_relation IS NULL THEN
    RAISE EXCEPTION 'Preflight required: public."SystemConfigs" is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = system_configs_relation
      AND attname = 'key'
      AND atttypid = 'text'::regtype
      AND NOT attisdropped
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = system_configs_relation
      AND attname = 'value'
      AND atttypid = 'jsonb'::regtype
      AND NOT attisdropped
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = system_configs_relation
      AND attname = 'updated_at'
      AND atttypid = 'timestamp with time zone'::regtype
      AND NOT attisdropped
  ) THEN
    RAISE EXCEPTION 'Preflight required: SystemConfigs key/value JSONB/updated_at columns do not match the reviewed contract';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_index AS index_definition
    WHERE index_definition.indrelid = system_configs_relation
      AND index_definition.indisunique
      AND index_definition.indisvalid
      AND index_definition.indisready
      AND index_definition.indpred IS NULL
      AND index_definition.indexprs IS NULL
      AND index_definition.indnkeyatts = 1
      AND index_definition.indnatts = 1
      AND index_definition.indkey[0] = (
        SELECT attribute.attnum
        FROM pg_attribute AS attribute
        WHERE attribute.attrelid = system_configs_relation
          AND attribute.attname = 'key'
          AND NOT attribute.attisdropped
      )
  ) THEN
    RAISE EXCEPTION 'Preflight required: SystemConfigs.key needs a valid non-partial single-column unique constraint or index';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    RAISE EXCEPTION 'Preflight required: expected service_role is missing';
  END IF;

  IF NOT has_table_privilege('service_role', system_configs_relation, 'SELECT')
     OR NOT has_table_privilege('service_role', system_configs_relation, 'INSERT')
     OR NOT has_table_privilege('service_role', system_configs_relation, 'UPDATE') THEN
    RAISE EXCEPTION 'Preflight required: service_role needs SELECT, INSERT and UPDATE on SystemConfigs';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_class AS relation
    JOIN pg_roles AS role_definition ON role_definition.rolname = 'service_role'
    WHERE relation.oid = system_configs_relation
      AND relation.relforcerowsecurity
      AND NOT role_definition.rolbypassrls
  ) THEN
    RAISE EXCEPTION 'Preflight required: service_role must bypass forced row-level security for the invoker RPC';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.webbooking_compare_and_swap_system_config(
  p_key TEXT,
  p_expected_exists BOOLEAN,
  p_expected_value JSONB,
  p_next_value JSONB
)
RETURNS TABLE (key TEXT, value JSONB, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
#variable_conflict use_column
BEGIN
  IF p_key NOT IN ('brand_history', 'about_story_content') THEN
    RAISE EXCEPTION 'Unsupported SystemConfigs key: %', p_key
      USING ERRCODE = '22023';
  END IF;

  IF p_next_value IS NULL OR jsonb_typeof(p_next_value) <> 'object' THEN
    RAISE EXCEPTION 'Next SystemConfigs value must be a JSON object'
      USING ERRCODE = '22023';
  END IF;

  IF NOT p_expected_exists AND p_expected_value IS NOT NULL THEN
    RAISE EXCEPTION 'Absent config cannot have an expected JSON value'
      USING ERRCODE = '22023';
  END IF;

  IF p_expected_exists THEN
    RETURN QUERY
      UPDATE public."SystemConfigs" AS config
      SET value = p_next_value,
          updated_at = timezone('utc'::text, now())
      WHERE config.key = p_key
        AND config.value IS NOT DISTINCT FROM p_expected_value
      RETURNING config.key, config.value, config.updated_at;
  ELSE
    RETURN QUERY
      INSERT INTO public."SystemConfigs" AS config (key, value, updated_at)
      SELECT p_key, p_next_value, timezone('utc'::text, now())
      WHERE p_expected_value IS NULL
      ON CONFLICT (key) DO NOTHING
      RETURNING config.key, config.value, config.updated_at;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.webbooking_compare_and_swap_system_config(TEXT, BOOLEAN, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.webbooking_compare_and_swap_system_config(TEXT, BOOLEAN, JSONB, JSONB) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.webbooking_compare_and_swap_system_config(TEXT, BOOLEAN, JSONB, JSONB) TO service_role;

COMMIT;
