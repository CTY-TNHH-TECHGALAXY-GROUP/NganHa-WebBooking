import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export type WebbookingAdminRole = 'owner' | 'editor' | 'reception';

export type AdminAccess = {
  user: { id: string; email?: string | null };
  role: WebbookingAdminRole;
  supabase: SupabaseClient;
};

type AdminAccessResult =
  | { access: AdminAccess }
  | { error: string; status: 401 | 403 | 500 };

export async function requireAdmin(allowedRoles?: WebbookingAdminRole[]): Promise<AdminAccessResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceKey) {
    return { error: 'Missing Supabase configuration', status: 500 };
  }

  const cookieStore = await cookies();
  const authClient = createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(_name: string, _value: string, _options: CookieOptions) {},
      remove(_name: string, _options: CookieOptions) {},
    },
  });

  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) {
    return { error: 'Vui long dang nhap', status: 401 };
  }

  const supabase = getSupabaseAdmin();
  const { data: membership, error: membershipError } = await supabase
    .from('WebbookingAdminUsers')
    .select('role, is_active')
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError) {
    console.error('[requireAdmin] Membership lookup failed:', membershipError.message);
    return { error: 'Khong the xac minh quyen truy cap', status: 500 };
  }

  if (!membership?.is_active) {
    return { error: 'Khong co quyen truy cap', status: 403 };
  }

  const role = membership.role as WebbookingAdminRole;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return { error: 'Khong co quyen truy cap', status: 403 };
  }

  return { access: { user: { id: user.id, email: user.email }, role, supabase } };
}
