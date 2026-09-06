import type { SupabaseClient } from '@supabase/supabase-js';

type Revision = {
  content_key: string;
  payload: Record<string, unknown> | unknown[];
  changed_by: string;
};

/** Best-effort audit trail; saving live content must not be blocked by an audit write. */
export async function recordContentRevisions(
  supabase: SupabaseClient,
  revisions: Revision[],
) {
  if (revisions.length === 0) return;

  const { error } = await supabase
    .from('WebbookingContentRevisions')
    .insert(revisions);

  if (error) console.error('[contentRevision] Unable to record revision:', error.message);
}
