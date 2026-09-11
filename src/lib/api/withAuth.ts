import { NextRequest } from 'next/server';
import { apiResponse } from './apiResponse';
import {
  requireAdmin,
  requireCapability,
  requireCapabilities,
  type WebbookingAdminRole,
  type AdminAccess,
  type AdminCapability,
  type CapabilityCheckOptions,
} from './requireAdmin';

export type AuthContext = AdminAccess;

export type AuthHandler = (
  req: NextRequest,
  ctx: AuthContext,
  params?: any
) => Promise<Response> | Response;

/**
 * HOC Wrapper cho các Admin API routes.
 * Kiểm tra xác thực (cookies) và role admin.
 */
export const withAuth = (handler: AuthHandler, allowedRoles?: WebbookingAdminRole[]) => {
  return async (req: NextRequest, context: any = {}) => {
    const { params } = context;
    try {
      const result = await requireAdmin(allowedRoles);
      if ('error' in result) {
        const code = result.status === 401
          ? 'UNAUTHORIZED'
          : result.status === 403
            ? 'FORBIDDEN'
            : 'CONFIG_ERROR';
        return apiResponse.error(result.error, code, result.status);
      }

      return await handler(req, result.access, params);
    } catch (error: any) {
      console.error('[API Error]', error);
      return apiResponse.error(error.message || 'Lỗi hệ thống', error.code || 'INTERNAL_ERROR', error.status || 500);
    }
  };
};

/**
 * HOC for route handlers protected by a shared capability. Unlike menu/UI
 * checks, this gate runs on the server for every request.
 */
export const withCapability = (
  handler: AuthHandler,
  capability: AdminCapability,
  options: CapabilityCheckOptions = {},
) => {
  return async (req: NextRequest, context: any = {}) => {
    const { params } = context;
    try {
      const result = await requireCapability(capability, options);
      if ('error' in result) {
        return apiResponse.error(result.error, result.code, result.status);
      }

      return await handler(req, result.access, params);
    } catch (error: any) {
      console.error('[Capability API Error]', error);
      return apiResponse.error(error.message || 'Lỗi hệ thống', error.code || 'INTERNAL_ERROR', error.status || 500);
    }
  };
};

export const withCapabilities = (
  handler: AuthHandler,
  capabilities: readonly AdminCapability[],
  options: CapabilityCheckOptions = {},
) => {
  return async (req: NextRequest, context: any = {}) => {
    const { params } = context;
    try {
      const result = await requireCapabilities(capabilities, options);
      if ('error' in result) {
        return apiResponse.error(result.error, result.code, result.status);
      }

      return await handler(req, result.access, params);
    } catch (error: any) {
      console.error('[Capabilities API Error]', error);
      return apiResponse.error(error.message || 'Lỗi hệ thống', error.code || 'INTERNAL_ERROR', error.status || 500);
    }
  };
};
