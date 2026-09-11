import { getAuthenticatedAdminSession, type AdminAccess } from '@/lib/auth/adminAuth';
import { authorizeCapability } from '@/lib/auth/adminCapabilities';
import { ANALYTICS_CAPABILITY } from './server';

export type AnalyticsAccessResult =
  | { ok: true; access: AdminAccess }
  | { ok: false; error: string; status: 401 | 403 | 500 | 503 };

export const requireAnalyticsRead = async (): Promise<AnalyticsAccessResult> => {
  const session = await getAuthenticatedAdminSession();
  if (!session.success) return { ok: false, error: session.error, status: session.status };

  const authorization = await authorizeCapability(session.access, ANALYTICS_CAPABILITY);
  if (authorization.allowed) {
    return { ok: true, access: session.access };
  }

  return { ok: false, error: authorization.error, status: authorization.status === 500 || authorization.status === 503 ? authorization.status : 403 };
};
