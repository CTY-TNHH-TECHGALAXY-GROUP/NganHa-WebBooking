#!/usr/bin/env node

/*
 * Retired safety boundary.
 *
 * This filename previously contained a direct SystemConfigs update after a
 * read/timestamp preflight. It cannot provide atomic JSON CAS, immutable
 * rollback input, or durable run artifacts. Keep the filename as a loud
 * failure so a copied old command never modifies History accidentally.
 *
 * Use scripts/migrate-pagespeed-renditions.mjs only after applying and
 * verifying supabase/migrations/20260914_system_configs_jsonb_cas.sql.
 */

console.error([
  'migrate-history-webp.mjs is retired and intentionally performs no work.',
  'Apply the reviewed SystemConfigs CAS migration, then use',
  'scripts/migrate-pagespeed-renditions.mjs with a unique --run-id and',
  'a durable private --backup-dir for any reviewed apply run.',
].join(' '));
process.exitCode = 1;
