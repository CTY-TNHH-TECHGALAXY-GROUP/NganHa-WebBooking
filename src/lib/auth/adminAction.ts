'use server';

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import {
  getAuthenticatedAdminSession,
  type WebbookingAdminRole,
} from './adminAuth';

export interface VerifyAdminResult {
  ok: boolean;
  role?: WebbookingAdminRole;
  error?: string;
  status?: number;
}

/**
 * Server Action callable from Client Components to verify the current user's
 * admin session and active role in WebbookingAdminUsers.
 *
 * Runs exclusively on the server, reads secure session cookies, and validates
 * against the database using the service role client.
 */
export async function verifyAdminSessionAction(
  allowedRoles?: WebbookingAdminRole[]
): Promise<VerifyAdminResult> {
  try {
    const result = await getAuthenticatedAdminSession(allowedRoles);
    if (!result.success) {
      return {
        ok: false,
        error: result.error,
        status: result.status,
      };
    }

    return {
      ok: true,
      role: result.access.role,
    };
  } catch (err: any) {
    console.error('[verifyAdminSessionAction] Unexpected error:', err);
    return {
      ok: false,
      error: 'Lỗi xác thực quyền quản trị',
      status: 500,
    };
  }
}

/**
 * Server Action to sign out of Supabase on the server side and clear session cookies.
 */
export async function logoutAdminAction(): Promise<{ success: boolean }> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      return { success: true };
    }

    const cookieStore = await cookies();
    const authClient = createServerClient(url, anonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // ignore in case of read-only context
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete({ name, ...options });
          } catch {
            // ignore
          }
        },
      },
    });

    await authClient.auth.signOut();
    return { success: true };
  } catch (err) {
    console.error('[logoutAdminAction] Error signing out:', err);
    return { success: false };
  }
}
