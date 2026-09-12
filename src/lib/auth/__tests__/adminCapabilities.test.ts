import assert from 'node:assert';
import { isWebbookingAdminRole } from '../adminAuth';
import type { AdminAccess, WebbookingAdminRole } from '../adminAuth';
import {
  ADMIN_CAPABILITIES,
  ADMIN_ROLE_BASELINE,
  authorizeCapability,
  validateEditorCapabilityUpdate,
} from '../adminCapabilities';

const ACTOR_ID = '11111111-1111-4111-8111-111111111111';
const EDITOR_ID = '22222222-2222-4222-8222-222222222222';

function makeAccess(role: WebbookingAdminRole, getGrants: () => unknown[]): AdminAccess {
  const builder = {
    select: () => builder,
    eq: () => builder,
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve({ data: getGrants(), error: null }).then(resolve, reject),
  };

  return {
    user: { id: ACTOR_ID, email: 'actor@example.test' },
    role,
    membership: { user_id: ACTOR_ID, role, is_active: true },
    supabase: { from: () => builder } as any,
  };
}

export async function runAdminCapabilityTests() {
  assert.strictEqual(isWebbookingAdminRole('admin'), true);
  assert.strictEqual(isWebbookingAdminRole('administrator'), false);
  assert.deepStrictEqual(ADMIN_ROLE_BASELINE.editor, []);
  assert.strictEqual(ADMIN_CAPABILITIES.includes('seo.publish'), true);
  assert.strictEqual(ADMIN_CAPABILITIES.includes('aeo.publish'), true);

  const ownerResult = await authorizeCapability(
    makeAccess('owner', () => []),
    'editor_permissions.manage',
    { mutation: true },
  );
  assert.strictEqual(ownerResult.allowed, true);
  assert.strictEqual(ownerResult.allowed && ownerResult.source, 'role_baseline');

  const adminResult = await authorizeCapability(
    makeAccess('admin', () => []),
    'notification_settings.manage',
    { mutation: true },
  );
  assert.strictEqual(adminResult.allowed, true);

  const editorWithoutGrant = await authorizeCapability(
    makeAccess('editor', () => []),
    'content.write',
    { mutation: true },
  );
  assert.strictEqual(editorWithoutGrant.allowed, false);
  if (!editorWithoutGrant.allowed) assert.strictEqual(editorWithoutGrant.code, 'CAPABILITY_DENIED');

  const forgedProtectedGrant = await authorizeCapability(
    makeAccess('editor', () => [{
      user_id: ACTOR_ID,
      capability: 'notification_settings.manage',
      scope: '*',
      is_active: true,
    }]),
    'notification_settings.manage',
    { mutation: true },
  );
  assert.strictEqual(forgedProtectedGrant.allowed, false);
  if (!forgedProtectedGrant.allowed) assert.strictEqual(forgedProtectedGrant.code, 'PROTECTED_CAPABILITY');

  let activeGrants: unknown[] = [{
    user_id: ACTOR_ID,
    capability: 'content.write',
    scope: '*',
    is_active: true,
  }];
  const editorAccess = makeAccess('editor', () => activeGrants);
  const allowedBeforeRevoke = await authorizeCapability(editorAccess, 'content.write', { mutation: true });
  assert.strictEqual(allowedBeforeRevoke.allowed, true);
  activeGrants = [];
  const deniedAfterRevoke = await authorizeCapability(editorAccess, 'content.write', { mutation: true });
  assert.strictEqual(deniedAfterRevoke.allowed, false);

  const malformed = await authorizeCapability(editorAccess, 'content.wrtie', { mutation: true });
  assert.strictEqual(malformed.allowed, false);
  if (!malformed.allowed) assert.strictEqual(malformed.code, 'INVALID_CAPABILITY');

  const selfGrant = validateEditorCapabilityUpdate({
    user_id: ACTOR_ID,
    capabilities: ['analytics.read'],
    expected_revision: 1,
  }, ACTOR_ID);
  assert.strictEqual(selfGrant.ok, false);
  if (!selfGrant.ok) assert.strictEqual(selfGrant.code, 'SELF_ESCALATION');

  const caseVariantSelfGrant = validateEditorCapabilityUpdate({
    user_id: ACTOR_ID.toUpperCase(),
    capabilities: ['analytics.read'],
    expected_revision: 1,
  }, ACTOR_ID);
  assert.strictEqual(caseVariantSelfGrant.ok, false);
  if (!caseVariantSelfGrant.ok) assert.strictEqual(caseVariantSelfGrant.code, 'SELF_ESCALATION');

  const malformedGrant = validateEditorCapabilityUpdate({
    user_id: EDITOR_ID,
    capabilities: ['not-a-capability'],
    expected_revision: 1,
  }, ACTOR_ID);
  assert.strictEqual(malformedGrant.ok, false);
  if (!malformedGrant.ok) assert.strictEqual(malformedGrant.code, 'INVALID_CAPABILITY');

  const protectedGrant = validateEditorCapabilityUpdate({
    user_id: EDITOR_ID,
    capabilities: ['editor_permissions.manage'],
    expected_revision: 1,
  }, ACTOR_ID);
  assert.strictEqual(protectedGrant.ok, false);
  if (!protectedGrant.ok) assert.strictEqual(protectedGrant.code, 'PROTECTED_CAPABILITY');

  const validGrant = validateEditorCapabilityUpdate({
    user_id: EDITOR_ID,
    capabilities: ['analytics.read', 'analytics.read', 'seo.publish'],
    expected_revision: 3,
  }, ACTOR_ID);
  assert.deepStrictEqual(validGrant, {
    ok: true,
    targetUserId: EDITOR_ID,
    expectedRevision: 3,
    capabilities: ['analytics.read', 'seo.publish'],
  });

  return true;
}
