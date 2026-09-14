import { createHash } from 'node:crypto';

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(canonicalize);

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    result[key] = canonicalize((value as Record<string, unknown>)[key]);
  }
  return result;
}

/** A stable token for optimistic concurrency on a SystemConfigs JSON document. */
export function systemConfigRevision(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(canonicalize(value ?? null))).digest('hex');
}
