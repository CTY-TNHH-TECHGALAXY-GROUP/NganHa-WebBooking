import { NextRequest } from 'next/server';
import { apiResponse } from '@/lib/api/apiResponse';
import { withCapability } from '@/lib/api/withAuth';
import {
  ADMIN_CAPABILITIES,
  ADMIN_CAPABILITY_GRANTS_TABLE,
  ADMIN_PERMISSION_REVISIONS_TABLE,
  isAdminCapability,
  validateEditorCapabilityUpdate,
} from '@/lib/auth/adminCapabilities';

function isMissingRpcError(error: { code?: string; message?: string } | null | undefined) {
  return Boolean(error) && (
    error?.code === 'PGRST202'
    || error?.code === '42883'
    || /function .* does not exist|could not find the function/i.test(error?.message || '')
  );
}


export const GET = withCapability(async (_request, { supabase }) => {
  const { data: memberships, error: membershipError } = await (supabase as any)
    .from('WebbookingAdminUsers')
    .select('user_id, role, is_active, created_at, updated_at')
    .eq('role', 'editor')
    .order('created_at', { ascending: true });

  if (membershipError) {
    return apiResponse.error('Không thể tải danh sách editor', 'DB_ERROR', 500);
  }

  const editorIds = (memberships || [])
    .map((membership: any) => membership.user_id)
    .filter((userId: unknown): userId is string => typeof userId === 'string');

  const { data: grants, error: grantsError } = editorIds.length > 0
    ? await (supabase as any)
      .from(ADMIN_CAPABILITY_GRANTS_TABLE)
      .select('user_id, capability, scope, is_active, granted_by, created_at, updated_at')
      .in('user_id', editorIds)
      .eq('is_active', true)
    : { data: [], error: null };

  if (grantsError) {
    const code = grantsError.code === '42P01' || grantsError.code === 'PGRST205'
      ? 'CAPABILITY_SCHEMA_UNAVAILABLE'
      : 'DB_ERROR';
    const status = code === 'CAPABILITY_SCHEMA_UNAVAILABLE' ? 503 : 500;
    return apiResponse.error(
      code === 'CAPABILITY_SCHEMA_UNAVAILABLE'
        ? 'Chưa triển khai bảng phân quyền capability'
        : 'Không thể tải capability editor',
      code,
      status,
    );
  }

  const { data: revisions, error: revisionsError } = editorIds.length > 0
    ? await (supabase as any)
      .from(ADMIN_PERMISSION_REVISIONS_TABLE)
      .select('user_id, revision')
      .in('user_id', editorIds)
    : { data: [], error: null };

  if (revisionsError) {
    const code = revisionsError.code === '42P01' || revisionsError.code === 'PGRST205'
      ? 'CAPABILITY_SCHEMA_UNAVAILABLE'
      : 'DB_ERROR';
    return apiResponse.error(
      code === 'CAPABILITY_SCHEMA_UNAVAILABLE'
        ? 'Chưa triển khai bảng revision phân quyền capability'
        : 'Không thể tải revision capability editor',
      code,
      code === 'CAPABILITY_SCHEMA_UNAVAILABLE' ? 503 : 500,
    );
  }

  const userResult = await (supabase as any).auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (userResult.error) {
    return apiResponse.error('Không thể tải danh sách tài khoản editor', 'DB_ERROR', 500);
  }

  const emailByUserId = new Map<string, string>();
  for (const user of userResult.data?.users || []) {
    if (typeof user?.id === 'string' && typeof user.email === 'string') {
      emailByUserId.set(user.id, user.email);
    }
  }

  const grantsByUserId = new Map<string, unknown[]>();
  const revisionByUserId = new Map<string, number>();
  for (const revision of revisions || []) {
    if (typeof revision?.user_id === 'string' && Number.isSafeInteger(revision.revision) && revision.revision >= 1) {
      revisionByUserId.set(revision.user_id, revision.revision);
    }
  }
  for (const grant of grants || []) {
    if (!isAdminCapability(grant?.capability) || grant?.is_active !== true) continue;
    const current = grantsByUserId.get(grant.user_id) || [];
    current.push({
      capability: grant.capability,
      scope: typeof grant.scope === 'string' ? grant.scope : '*',
      granted_by: grant.granted_by || null,
      created_at: grant.created_at || null,
      updated_at: grant.updated_at || null,
    });
    grantsByUserId.set(grant.user_id, current);
  }

  const editors = (memberships || []).map((membership: any) => ({
    user_id: membership.user_id,
    email: emailByUserId.get(membership.user_id) || null,
    role: 'editor' as const,
    is_active: membership.is_active === true,
    updated_at: membership.updated_at || null,
    revision: revisionByUserId.get(membership.user_id) || 1,
    grants: grantsByUserId.get(membership.user_id) || [],
  }));

  return apiResponse.success({
    capabilities: ADMIN_CAPABILITIES,
    editors,
  });
}, 'editor_permissions.manage');

export const PUT = withCapability(async (request: NextRequest, { supabase, user }) => {
  const body = await request.json().catch(() => null);
  const validation = validateEditorCapabilityUpdate(body, user.id);
  if (!validation.ok) {
    return apiResponse.error(validation.message, validation.code, validation.status);
  }
  const { targetUserId, expectedRevision, capabilities: uniqueCapabilities } = validation;

  const { data: target, error: targetError } = await (supabase as any)
    .from('WebbookingAdminUsers')
    .select('user_id, role, is_active')
    .eq('user_id', targetUserId)
    .maybeSingle();

  if (targetError) {
    return apiResponse.error('Không thể xác minh tài khoản editor', 'DB_ERROR', 500);
  }
  if (!target) {
    return apiResponse.error('Không tìm thấy tài khoản editor', 'NOT_FOUND', 404);
  }
  if (target.role !== 'editor') {
    return apiResponse.error('Endpoint này không được thay đổi owner/admin/reception', 'PROTECTED_TARGET', 403);
  }
  if (target.is_active !== true) {
    return apiResponse.error('Không thể cấp capability cho membership đã vô hiệu hóa', 'TARGET_INACTIVE', 403);
  }

  const { data, error } = await (supabase as any).rpc('webbooking_replace_editor_capabilities', {
    p_actor_user_id: user.id,
    p_target_user_id: targetUserId,
    p_capabilities: uniqueCapabilities,
    p_expected_revision: expectedRevision,
  });

  if (error) {
    if (isMissingRpcError(error)) {
      return apiResponse.error('Chưa triển khai RPC cập nhật capability', 'CAPABILITY_SCHEMA_UNAVAILABLE', 503);
    }
    if (error.code === '40001' || /revision|concurr|changed/i.test(error.message || '')) {
      return apiResponse.error('Capability editor đã được thay đổi ở cửa sổ khác', 'PERMISSION_CONFLICT', 409);
    }
    if (error.code === 'P0001') {
      return apiResponse.error('Tài khoản không còn được phép thay đổi capability editor', 'FORBIDDEN', 403);
    }
    console.error('[admin/editor-permissions PUT] Capability update failed:', error.message);
    return apiResponse.error('Không thể cập nhật capability editor', 'DB_ERROR', 500);
  }

  return apiResponse.success(data || {
    user_id: targetUserId,
    capabilities: uniqueCapabilities,
    revision: expectedRevision + 1,
  });
}, 'editor_permissions.manage', { mutation: true });
