import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export type WebbookingAdminRole = 'owner' | 'admin' | 'editor' | 'reception';

export const ADMIN_ALLOWED_ROLES: readonly WebbookingAdminRole[] = [
  'owner',
  'admin',
  'editor',
  'reception',
] as const;

export function isWebbookingAdminRole(value: unknown): value is WebbookingAdminRole {
  return typeof value === 'string'
    && (ADMIN_ALLOWED_ROLES as readonly string[]).includes(value);
}

export interface AdminMembership {
  user_id: string;
  role: WebbookingAdminRole;
  is_active: boolean;
}

export interface AdminAccess {
  user: { id: string; email?: string | null };
  role: WebbookingAdminRole;
  membership: AdminMembership;
  supabase: SupabaseClient;
  /** Request-time bridge consumed by capability-aware modules such as SEO/AEO. */
  hasCapability?: (capability: string) => Promise<boolean>;
}

export type AdminAccessResult =
  | { success: true; access: AdminAccess }
  | { success: false; error: string; code: string; status: 401 | 403 | 500 };

/**
 * Validates a user ID against the WebbookingAdminUsers table.
 * Strictly checks:
 * 1. user_id matches
 * 2. is_active === true
 * 3. role is within the allowed roles
 *
 * Never authorizes admin access from an email string alone or from client-side state.
 */
export async function validateAdminMembership(
  userId: string,
  allowedRoles?: WebbookingAdminRole[]
): Promise<
  | { success: true; membership: AdminMembership }
  | { success: false; error: string; code: string; status: 403 | 500 }
> {
  if (!userId || typeof userId !== 'string') {
    return {
      success: false,
      error: 'ID người dùng không hợp lệ',
      code: 'INVALID_USER_ID',
      status: 403,
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('[validateAdminMembership] Missing Supabase server credentials');
    return {
      success: false,
      error: 'Chưa cấu hình dịch vụ xác thực máy chủ',
      code: 'CONFIG_ERROR',
      status: 500,
    };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: membership, error: dbError } = await supabase
      .from('WebbookingAdminUsers')
      .select('user_id, role, is_active')
      .eq('user_id', userId)
      .maybeSingle();

    if (dbError) {
      console.error('[validateAdminMembership] Database error querying WebbookingAdminUsers:', dbError.message);
      return {
        success: false,
        error: 'Không thể xác minh quyền quản trị',
        code: 'INTERNAL_ERROR',
        status: 500,
      };
    }

    if (!membership) {
      return {
        success: false,
        error: 'Tài khoản không có quyền truy cập quản trị',
        code: 'FORBIDDEN',
        status: 403,
      };
    }

    if (membership.is_active !== true) {
      return {
        success: false,
        error: 'Tài khoản quản trị đã bị vô hiệu hóa',
        code: 'FORBIDDEN',
        status: 403,
      };
    }

    if (!isWebbookingAdminRole(membership.role)) {
      console.error('[validateAdminMembership] Unsupported role in WebbookingAdminUsers:', membership.role);
      return {
        success: false,
        error: 'Cấu hình vai trò quản trị không hợp lệ',
        code: 'INVALID_ADMIN_ROLE',
        status: 500,
      };
    }

    const userRole = membership.role;
    const validRoles = allowedRoles && allowedRoles.length > 0 ? allowedRoles : ADMIN_ALLOWED_ROLES;

    if (!validRoles.includes(userRole)) {
      return {
        success: false,
        error: 'Tài khoản không có vai trò phù hợp',
        code: 'FORBIDDEN',
        status: 403,
      };
    }

    return {
      success: true,
      membership: {
        user_id: membership.user_id,
        role: userRole,
        is_active: membership.is_active,
      },
    };
  } catch (err: any) {
    console.error('[validateAdminMembership] Unexpected exception:', err);
    return {
      success: false,
      error: 'Lỗi hệ thống khi xác thực quyền quản trị',
      code: 'INTERNAL_ERROR',
      status: 500,
    };
  }
}

/**
 * Inspects server session cookies, resolves the authenticated Supabase user,
 * and validates their admin status in the WebbookingAdminUsers table.
 *
 * Safe for Server Components, Route Handlers, and Server Actions.
 */
export async function getAuthenticatedAdminSession(
  allowedRoles?: WebbookingAdminRole[]
): Promise<AdminAccessResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceKey) {
    return {
      success: false,
      error: 'Thiếu cấu hình Supabase máy chủ',
      code: 'CONFIG_ERROR',
      status: 500,
    };
  }

  try {
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

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Vui lòng đăng nhập',
        code: 'UNAUTHORIZED',
        status: 401,
      };
    }

    const membershipResult = await validateAdminMembership(user.id, allowedRoles);
    if ('error' in membershipResult) {
      return {
        success: false,
        error: membershipResult.error,
        code: membershipResult.code,
        status: membershipResult.status,
      };
    }

    const supabaseAdmin = getSupabaseAdmin();
    const access: AdminAccess = {
      user: { id: user.id, email: user.email },
      role: membershipResult.membership.role,
      membership: membershipResult.membership,
      supabase: supabaseAdmin,
    };
    access.hasCapability = async (capability) => {
      const { authorizeCapability } = await import('./adminCapabilities');
      const authorization = await authorizeCapability(access, capability);
      return authorization.allowed;
    };

    return { success: true, access };
  } catch (err: any) {
    console.error('[getAuthenticatedAdminSession] Unexpected error:', err);
    return {
      success: false,
      error: 'Lỗi xác thực phiên quản trị',
      code: 'INTERNAL_ERROR',
      status: 500,
    };
  }
}
