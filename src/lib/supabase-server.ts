// ═══════════════════════════════════════
// Supabase Server Client (Lazy Init)
// ═══════════════════════════════════════

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabaseAdmin: SupabaseClient | null = null;

// Mock that doesn't use Proxy to avoid Next.js stringification issues
const createMockSupabase = () => {
  const mockResponse = { data: null, error: { message: 'Mock Error', code: 'PGRST116' } };
  const mockPromise = Promise.resolve(mockResponse);
  const mockBuilder = {
    select: () => mockBuilder,
    eq: () => mockBuilder,
    in: () => mockBuilder,
    single: () => mockPromise,
    order: () => mockBuilder,
    limit: () => mockBuilder,
    then: (resolve: any) => mockPromise.then(resolve)
  };
  return {
    from: () => mockBuilder,
    auth: {
      admin: {
        listUsers: () => Promise.resolve({ data: { users: [] }, error: null })
      }
    }
  } as any;
};

export const getSupabaseAdmin = (): SupabaseClient => {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      console.warn('Missing Supabase env vars, using Mock Client');
      _supabaseAdmin = createMockSupabase();
      return _supabaseAdmin as SupabaseClient;
    }

    _supabaseAdmin = createClient(url, key);
  }
  return _supabaseAdmin;
};
