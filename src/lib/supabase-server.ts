// ═══════════════════════════════════════
// Supabase Server Client (Lazy Init)
// ═══════════════════════════════════════

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabaseAdmin: SupabaseClient | null = null;

export const getSupabaseAdmin = () => {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
      );
    }

    _supabaseAdmin = createClient(url, key);
  }
  return _supabaseAdmin;
};
