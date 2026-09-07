import {
  getAuthenticatedAdminSession,
  type WebbookingAdminRole,
  type AdminAccess,
  ADMIN_ALLOWED_ROLES,
} from '@/lib/auth/adminAuth';

export type { WebbookingAdminRole, AdminAccess };
export { ADMIN_ALLOWED_ROLES };

export type AdminAccessResult =
  | { access: AdminAccess }
  | { error: string; status: 401 | 403 | 500 };

/**
 * Server-side gate for admin operations.
 * Resolves user session from cookies and validates active role against WebbookingAdminUsers.
 *
 * Allowed roles default to: ['owner', 'admin', 'editor', 'reception'].
 */
export async function requireAdmin(
  allowedRoles?: WebbookingAdminRole[]
): Promise<AdminAccessResult> {
  const result = await getAuthenticatedAdminSession(allowedRoles);
  if (!result.success) {
    return { error: result.error, status: result.status };
  }

  return { access: result.access };
}
