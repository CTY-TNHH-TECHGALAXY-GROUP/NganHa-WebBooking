import type { AdminAccess } from '@/lib/auth/adminAuth';
import type { AeoCapability, SeoCapability } from './types';

export type SeoAeoCapability = SeoCapability | AeoCapability;

type CapabilityAwareAccess = AdminAccess & {
  hasCapability?: (capability: SeoAeoCapability) => boolean | Promise<boolean>;
  can?: (capability: SeoAeoCapability) => boolean | Promise<boolean>;
  capabilities?: Iterable<string> | Record<string, boolean>;
};

/**
 * Agent 2 integration seam: its shared auth contract can provide
 * hasCapability/can/capabilities on AdminAccess. Until then, owner/admin keep
 * their documented baseline and all other roles fail closed.
 */
export async function hasSeoAeoCapability(access: AdminAccess, capability: SeoAeoCapability): Promise<boolean> {
  if (access.role === 'owner' || access.role === 'admin') return true;

  const capabilityAware = access as CapabilityAwareAccess;
  if (typeof capabilityAware.hasCapability === 'function') return Boolean(await capabilityAware.hasCapability(capability));
  if (typeof capabilityAware.can === 'function') return Boolean(await capabilityAware.can(capability));

  const grants = capabilityAware.capabilities;
  if (grants && typeof grants === 'object') {
    if (Symbol.iterator in grants && typeof (grants as Iterable<string>)[Symbol.iterator] === 'function') {
      return Array.from(grants as Iterable<string>).includes(capability);
    }
    return Boolean((grants as Record<string, boolean>)[capability]);
  }
  return false;
}
