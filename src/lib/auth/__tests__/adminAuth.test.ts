import assert from 'node:assert';
import {
  validateAdminMembership,
  ADMIN_ALLOWED_ROLES,
} from '../adminAuth';

export async function runAdminAuthTests() {
  // Test 1: Empty or non-string user ID rejected
  const res1 = await validateAdminMembership('');
  assert.strictEqual(res1.success, false);
  if (!res1.success) {
    assert.strictEqual(res1.status, 403);
    assert.strictEqual(res1.code, 'INVALID_USER_ID');
  }

  const res2 = await validateAdminMembership(null as any);
  assert.strictEqual(res2.success, false);
  if (!res2.success) {
    assert.strictEqual(res2.status, 403);
  }

  // Test 2: Fail-closed on missing credentials
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;

  const res3 = await validateAdminMembership('valid-uuid');
  assert.strictEqual(res3.success, false);
  if (!res3.success) {
    assert.strictEqual(res3.status, 500);
    assert.strictEqual(res3.code, 'CONFIG_ERROR');
  }

  process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;

  // Test 3: Allowed admin roles definition
  assert.ok(ADMIN_ALLOWED_ROLES.includes('owner'));
  assert.ok(ADMIN_ALLOWED_ROLES.includes('admin'));
  assert.ok(ADMIN_ALLOWED_ROLES.includes('editor'));
  assert.ok(ADMIN_ALLOWED_ROLES.includes('reception'));
  assert.strictEqual(ADMIN_ALLOWED_ROLES.length, 4);

  return true;
}
