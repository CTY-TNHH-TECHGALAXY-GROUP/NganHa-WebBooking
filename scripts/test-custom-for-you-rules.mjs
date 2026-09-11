import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as contract from '../src/lib/booking/contract.ts';
import { resolveServiceCapabilities } from '../src/lib/booking/capabilities.ts';

const nhs1000 = {
  id: 'NHS1000',
  nameVN: 'Mát-xa chân - Cắt móng (tay & chân) - Chà gót',
  nameEN: 'Foot - Nail cut (hand & feet) - Heel smoothing',
  priceVND: 790000,
  priceUSD: 33,
  duration: 90,
  isActive: true,
  showCustomForYou: true,
  showPreferences: true,
  showNotes: true,
  showGender: false,
  showStrength: true,
  showFocus: false,
  focusConfig: {},
};
const room = { id: 'NHS0900', priceVND: 105000, priceUSD: 4, duration: 0, isActive: true };

const capabilities = resolveServiceCapabilities(nhs1000);
assert.deepEqual(capabilities, {
  custom: true,
  strength: true,
  gender: false,
  preferences: true,
  focus: false,
  notes: true,
  allowedBodyAreas: [],
});

const legacy = contract.normalizeOptions({
  strength: 'medium',
  therapist: 'random',
  bodyParts: { focus: [], avoid: [] },
  notes: { tag0: false, tag1: false, content: '' },
}, 'items[0].options');
assert.equal(legacy.errors.length, 0);
const repaired = contract.canonicalizeOptionsForService(legacy.value, nhs1000);
assert.equal(repaired.changed, true);
assert.deepEqual(repaired.options, { strength: 'medium' });
assert.deepEqual(contract.validateCatalogOptions(repaired.options, nhs1000, 'items[0].options'), []);

const meaningfulGender = contract.normalizeOptions({ therapist: 'female' }, 'items[0].options');
assert.deepEqual(contract.validateCatalogOptions(meaningfulGender.value, nhs1000, 'items[0].options').map((item) => item.code), ['UNSUPPORTED_OPTION']);
const meaningfulFocus = contract.normalizeOptions({ bodyParts: { focus: ['FOOT'], avoid: [] } }, 'items[0].options');
assert.deepEqual(contract.validateCatalogOptions(meaningfulFocus.value, nhs1000, 'items[0].options').map((item) => item.code), ['UNSUPPORTED_OPTION']);

for (const quantity of [1, 2, 3]) {
  const pricing = contract.buildCanonicalPricing([
    { id: 'NHS1000', quantity, options: { strength: 'medium', addons: { privateRoom: true } } },
  ], [nhs1000, room], room);
  assert.equal(pricing.totalAmountVND, 895000 * quantity);
  assert.equal(pricing.items[0].options.therapist, undefined);
}

const bookingRoute = readFileSync(new URL('../src/app/api/bookings/route.ts', import.meta.url), 'utf8');
assert.match(bookingRoute, /options\.therapist\s*\?/);
assert.match(bookingRoute, /options\.addons\?\.privateRoom/);
assert.match(bookingRoute, /options:\s*\{\s*displayName: 'Phòng riêng', parentServiceId: item\.id, isAddon: true \}/);

console.log('PASS: Custom For You DB rules, NHS1000 repair, quantity pricing, and private-room option contract');
