import {
  getAuthenticatedAdminSession,
  type WebbookingAdminRole,
  type AdminAccess,
  ADMIN_ALLOWED_ROLES,
} from '@/lib/auth/adminAuth';
import {
  authorizeCapability,
  authorizeCapabilities,
  type AdminCapability,
  type CapabilityCheckOptions,
  type CapabilityAuthorizationResult,
} from '@/lib/auth/adminCapabilities';

export type { WebbookingAdminRole, AdminAccess };
export { ADMIN_ALLOWED_ROLES };
export type { AdminCapability, CapabilityCheckOptions, CapabilityAuthorizationResult };

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

export type RequireCapabilityResult =
  | { access: AdminAccess; authorization: Extract<CapabilityAuthorizationResult, { allowed: true }> }
  | { error: string; code: string; status: 400 | 401 | 403 | 500 | 503 };

/**
 * Server-side capability gate layered on the current cookie/session auth.
 * The helper deliberately resolves the admin session before looking up grants.
 */
export async function requireCapability(
  capability: unknown,
  options: CapabilityCheckOptions = {},
): Promise<RequireCapabilityResult> {
  const session = await getAuthenticatedAdminSession();
  if (!session.success) {
    return {
      error: session.error,
      code: session.code,
      status: session.status,
    };
  }

  const authorization = await authorizeCapability(session.access, capability, options);
  if (!authorization.allowed) {
    return {
      error: authorization.error,
      code: authorization.code,
      status: authorization.status,
    };
  }

  return { access: session.access, authorization };
}

export async function requireCapabilities(
  capabilities: readonly AdminCapability[],
  options: CapabilityCheckOptions = {},
): Promise<RequireCapabilityResult> {
  const session = await getAuthenticatedAdminSession();
  if (!session.success) {
    return {
      error: session.error,
      code: session.code,
      status: session.status,
    };
  }

  const authorization = await authorizeCapabilities(session.access, capabilities, options);
  if (!authorization.allowed) {
    return {
      error: authorization.error,
      code: authorization.code,
      status: authorization.status,
    };
  }

  return { access: session.access, authorization };
}
