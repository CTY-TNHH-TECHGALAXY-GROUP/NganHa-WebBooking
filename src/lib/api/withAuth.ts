import { NextRequest } from 'next/server';
import { apiResponse } from './apiResponse';
import { requireAdmin, type WebbookingAdminRole } from './requireAdmin';

export type AuthContext = {
  user: any;
  supabase: any;
  role: WebbookingAdminRole;
};

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
