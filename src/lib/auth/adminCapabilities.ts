import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminAccess, WebbookingAdminRole } from './adminAuth';
import { isWebbookingAdminRole } from './adminAuth';

export const ADMIN_CAPABILITY_GRANTS_TABLE = 'WebbookingAdminCapabilityGrants';
export const ADMIN_PERMISSION_REVISIONS_TABLE = 'WebbookingAdminPermissionRevisions';
export const ADMIN_AUDIT_LOG_TABLE = 'WebbookingAdminAuditLog';

export const ADMIN_CAPABILITIES = [
  'content.read',
  'content.write',
  'content.publish',
  'media.read',
  'media.upload',
  'media.delete',
  'services.read',
  'services.write',
  'analytics.read',
  'notification_settings.manage',
  'editor_permissions.manage',
  'seo.read',
  'seo.write',
  'seo.publish',
  'aeo.read',
  'aeo.write',
  'aeo.publish',
  'lost_found.read',
  'lost_found.write',
  'lost_found.delete',
] as const;

export type AdminCapability = (typeof ADMIN_CAPABILITIES)[number];

export function isAdminCapability(value: unknown): value is AdminCapability {
  return typeof value === 'string'
    && (ADMIN_CAPABILITIES as readonly string[]).includes(value);
}

/**
 * Owner/admin are role-baseline operators. Editors and reception require an
 * explicit, active grant. The empty baselines are intentional fail-closed
 * defaults until an editor grant has been audited and assigned.
 */
export const ADMIN_ROLE_BASELINE: Record<WebbookingAdminRole, readonly AdminCapability[]> = {
  owner: ADMIN_CAPABILITIES,
  admin: ADMIN_CAPABILITIES,
  editor: [],
  reception: [],
};

export const EDITOR_PROTECTED_CAPABILITIES = new Set<AdminCapability>([
  'notification_settings.manage',
  'editor_permissions.manage',
]);

export interface CapabilityCheckOptions {
  /** Optional module scope. '*' is the global grant scope. */
  scope?: string;
  /** Set for writes so callers document the mutation boundary explicitly. */
  mutation?: boolean;
}

export interface AdminCapabilityGrant {
  user_id: string;
  capability: AdminCapability;
  scope: string;
  is_active: boolean;
  granted_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type CapabilityAuthorizationResult =
  | {
    allowed: true;
    capability: AdminCapability;
    source: 'role_baseline' | 'grant';
    grant?: AdminCapabilityGrant;
  }
  | {
    allowed: false;
    error: string;
    code: string;
    status: 400 | 403 | 500 | 503;
  };

export type CapabilityLookupResult =
  | { success: true; grants: AdminCapabilityGrant[] }
  | { success: false; error: string; code: string; status: 500 | 503 };

const ADMIN_USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function safePermissionRevision(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1 ? value : null;
}

export type EditorCapabilityUpdateValidation =
  | { ok: true; targetUserId: string; expectedRevision: number; capabilities: AdminCapability[] }
  | { ok: false; message: string; code: string; status: 400 | 403 };

/** Pure validation for the editor grant replacement API. */
export function validateEditorCapabilityUpdate(
  body: unknown,
  actorUserId: string,
): EditorCapabilityUpdateValidation {
  const request = body && typeof body === 'object' && !Array.isArray(body)
    ? body as Record<string, unknown>
    : {};
  const targetUserId = typeof request.user_id === 'string' ? request.user_id.trim() : '';
  const expectedRevision = safePermissionRevision(request.expected_revision);

  if (!ADMIN_USER_ID_PATTERN.test(targetUserId)) {
    return { ok: false, message: 'ID editor không hợp lệ', code: 'INVALID_USER_ID', status: 400 };
  }
  if (targetUserId === actorUserId) {
    return { ok: false, message: 'Không được tự cấp hoặc tự thay đổi capability của chính mình', code: 'SELF_ESCALATION', status: 403 };
  }
  if (expectedRevision === null) {
    return { ok: false, message: 'expected_revision là bắt buộc', code: 'INVALID_REVISION', status: 400 };
  }
  if (!Array.isArray(request.capabilities)) {
    return { ok: false, message: 'capabilities phải là một mảng', code: 'INVALID_CAPABILITY_LIST', status: 400 };
  }
  if (request.capabilities.length > ADMIN_CAPABILITIES.length) {
    return { ok: false, message: 'Danh sách capability vượt quá giới hạn', code: 'INVALID_CAPABILITY_LIST', status: 400 };
  }

  const uniqueCapabilities = [...new Set(request.capabilities)];
  for (const capability of uniqueCapabilities) {
    if (!isAdminCapability(capability)) {
      return { ok: false, message: 'Danh sách chứa capability không hợp lệ', code: 'INVALID_CAPABILITY', status: 400 };
    }
    if (EDITOR_PROTECTED_CAPABILITIES.has(capability)) {
      return { ok: false, message: 'Capability này chỉ dành cho owner/admin', code: 'PROTECTED_CAPABILITY', status: 403 };
    }
  }

  return {
    ok: true,
    targetUserId,
    expectedRevision,
    capabilities: uniqueCapabilities as AdminCapability[],
  };
}

const isMissingCapabilitySchemaError = (error: { code?: string; message?: string } | null | undefined) => {
  if (!error) return false;
  return error.code === '42P01'
    || error.code === 'PGRST205'
    || /relation .* does not exist|schema cache/i.test(error.message || '');
};

function normalizeScope(scope: unknown): string | null {
  if (scope === undefined) return '*';
  if (typeof scope !== 'string') return null;
  const normalized = scope.trim();
  if (!normalized || normalized.length > 100) return null;
  return normalized;
}

async function lookupCapabilityGrants(
  supabase: SupabaseClient,
  userId: string,
): Promise<CapabilityLookupResult> {
  const { data, error } = await (supabase as any)
    .from(ADMIN_CAPABILITY_GRANTS_TABLE)
    .select('user_id, capability, scope, is_active, granted_by, created_at, updated_at')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    if (isMissingCapabilitySchemaError(error)) {
      return {
        success: false,
        error: 'Chưa triển khai bảng phân quyền capability',
        code: 'CAPABILITY_SCHEMA_UNAVAILABLE',
        status: 503,
      };
    }

    console.error('[adminCapabilities] Capability lookup failed:', error.message);
    return {
      success: false,
      error: 'Không thể xác minh capability quản trị',
      code: 'CAPABILITY_LOOKUP_FAILED',
      status: 500,
    };
  }

  const grants = (Array.isArray(data) ? data : [])
    .filter((grant: any): grant is AdminCapabilityGrant => (
      grant
      && typeof grant.user_id === 'string'
      && isAdminCapability(grant.capability)
      && typeof grant.scope === 'string'
      && grant.is_active === true
    ));

  return { success: true, grants };
}

export async function getAdminCapabilityGrants(
  supabase: SupabaseClient,
  userId: string,
): Promise<CapabilityLookupResult> {
  if (!userId || typeof userId !== 'string') {
    return {
      success: false,
      error: 'ID người dùng không hợp lệ',
      code: 'INVALID_USER_ID',
      status: 500,
    };
  }
  return lookupCapabilityGrants(supabase, userId);
}

/**
 * Request-time authorization. No grant result is cached; membership and
 * grants are evaluated again for every protected request.
 */
export async function authorizeCapability(
  access: AdminAccess,
  requestedCapability: unknown,
  options: CapabilityCheckOptions = {},
): Promise<CapabilityAuthorizationResult> {
  if (!isAdminCapability(requestedCapability)) {
    return {
      allowed: false,
      error: 'Capability không hợp lệ',
      code: 'INVALID_CAPABILITY',
      status: 400,
    };
  }

  if (!access.membership?.is_active || !isWebbookingAdminRole(access.role)) {
    return {
      allowed: false,
      error: 'Tài khoản quản trị không còn hoạt động',
      code: 'FORBIDDEN',
      status: 403,
    };
  }

  // Keep protected capabilities owner/admin-only even if a malformed or
  // manually inserted grant bypasses the editor-management API.
  if ((access.role === 'editor' || access.role === 'reception')
    && EDITOR_PROTECTED_CAPABILITIES.has(requestedCapability)) {
    return {
      allowed: false,
      error: 'Capability này chỉ dành cho owner/admin',
      code: 'PROTECTED_CAPABILITY',
      status: 403,
    };
  }

  const scope = normalizeScope(options.scope);
  if (!scope) {
    return {
      allowed: false,
      error: 'Scope capability không hợp lệ',
      code: 'INVALID_CAPABILITY_SCOPE',
      status: 400,
    };
  }

  if (ADMIN_ROLE_BASELINE[access.role].includes(requestedCapability)) {
    return {
      allowed: true,
      capability: requestedCapability,
      source: 'role_baseline',
    };
  }

  const grantsResult = await lookupCapabilityGrants(access.supabase, access.user.id);
  if ('error' in grantsResult) {
    return {
      allowed: false,
      error: grantsResult.error,
      code: grantsResult.code,
      status: grantsResult.status,
    };
  }

  const grant = grantsResult.grants.find((candidate) => (
    candidate.capability === requestedCapability
    && (candidate.scope === '*' || candidate.scope === scope)
  ));

  if (!grant) {
    return {
      allowed: false,
      error: options.mutation
        ? 'Tài khoản không có capability để thực hiện thay đổi này'
        : 'Tài khoản không có capability này',
      code: 'CAPABILITY_DENIED',
      status: 403,
    };
  }

  return {
    allowed: true,
    capability: requestedCapability,
    source: 'grant',
    grant,
  };
}

export async function authorizeCapabilities(
  access: AdminAccess,
  requestedCapabilities: readonly unknown[],
  options: CapabilityCheckOptions = {},
): Promise<CapabilityAuthorizationResult> {
  if (!Array.isArray(requestedCapabilities) || requestedCapabilities.length === 0) {
    return {
      allowed: false,
      error: 'Danh sách capability không hợp lệ',
      code: 'INVALID_CAPABILITY',
      status: 400,
    };
  }

  let firstAuthorization: CapabilityAuthorizationResult | null = null;
  for (const capability of requestedCapabilities) {
    const authorization = await authorizeCapability(access, capability, options);
    if (!authorization.allowed) return authorization;
    firstAuthorization ||= authorization;
  }

  return firstAuthorization as Extract<CapabilityAuthorizationResult, { allowed: true }>;
}

export interface AdminAuditEvent {
  actorUserId: string;
  targetUserId?: string | null;
  action: string;
  resource: string;
  change: unknown;
  requestId?: string | null;
}

const AUDIT_SENSITIVE_KEY = /password|secret|token|credential|service.?role|smtp|cookie|session/i;

function sanitizeAuditValue(value: unknown, key = '', depth = 0): unknown {
  if (AUDIT_SENSITIVE_KEY.test(key)) return '[redacted]';
  if (depth > 4) return '[truncated]';
  if (typeof value === 'string') return value.length > 1000 ? `${value.slice(0, 1000)}...[truncated]` : value;
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => sanitizeAuditValue(item, key, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).slice(0, 100).map(([entryKey, entryValue]) => [
      entryKey,
      sanitizeAuditValue(entryValue, entryKey, depth + 1),
    ]));
  }
  return value;
}

/**
 * Shared audit writer for capability-owning routes. Permission replacement
 * itself uses the SQL RPC so its audit row is atomic with the grant change.
 */
export async function recordAdminAudit(
  supabase: SupabaseClient,
  event: AdminAuditEvent,
): Promise<{ success: true } | { success: false; error: string; code: string }> {
  const { error } = await (supabase as any)
    .from(ADMIN_AUDIT_LOG_TABLE)
    .insert({
      actor_user_id: event.actorUserId,
      target_user_id: event.targetUserId || null,
      action: event.action,
      resource: event.resource,
      change: sanitizeAuditValue(event.change),
      request_id: event.requestId || null,
    });

  if (error) {
    console.error('[adminCapabilities] Audit write failed:', error.message);
    return { success: false, error: 'Không thể ghi audit quản trị', code: 'AUDIT_WRITE_FAILED' };
  }

  return { success: true };
}
