import assert from 'node:assert/strict';
import { resolveServiceCapabilities } from '../src/lib/booking/capabilities.ts';
import { validateCatalogOptions } from '../src/lib/booking/contract.ts';

const service = {
  id: 'NHS_TEST', priceVND: 1, priceUSD: 1, duration: 60, isActive: true,
  showStrength: true,
  strengthConfig: { light: true, medium: true, strong: false },
};

assert.deepEqual(resolveServiceCapabilities(service).allowedStrengths, ['light', 'medium']);
assert.equal(validateCatalogOptions({ strength: 'strong' }, service, 'options')[0]?.code, 'UNSUPPORTED_OPTION');
assert.deepEqual(validateCatalogOptions({ strength: 'medium' }, service, 'options'), []);
assert.deepEqual(resolveServiceCapabilities({ ...service, strengthConfig: null }).allowedStrengths, ['light', 'medium', 'strong']);
assert.deepEqual(resolveServiceCapabilities({ ...service, strengthConfig: { light: false, medium: false, strong: false } }).allowedStrengths, []);
console.log('strength config: PASS');
