import assert from 'node:assert/strict';
const cases = [
  { id: 'CF01', locale: 'EN', viewport: 'desktop', interaction: 'one standard service, quantity 1' },
  { id: 'CF02', locale: 'VI', viewport: 'mobile 390', interaction: 'body service and supported duration' },
  { id: 'CF03', locale: 'JA', viewport: 'desktop', interaction: 'same selection quantity 2' },
  { id: 'CF04', locale: 'KO', viewport: 'tablet 768', interaction: 'two supported options/durations' },
  { id: 'CF05', locale: 'ZH', viewport: 'mobile 390', interaction: 'eligible service plus private-room addon' },
  { id: 'CF06', locale: 'VI', viewport: 'desktop', interaction: 'foot strength/focus/avoid preferences' },
  { id: 'CF07', locale: 'EN', viewport: 'mobile 390', interaction: 'edit ear-service options' },
  { id: 'CF08', locale: 'JA', viewport: 'tablet 768', interaction: 'barber plus foot remove/re-add' },
  { id: 'CF09', locale: 'KO', viewport: 'desktop', interaction: 'premium choice and therapist preference' },
  { id: 'CF10', locale: 'ZH', viewport: 'desktop', interaction: 'multiple selections and double-click/retry' },
];
const ids = cases.map((testCase) => testCase.id);
assert.deepEqual(ids, ['CF01', 'CF02', 'CF03', 'CF04', 'CF05', 'CF06', 'CF07', 'CF08', 'CF09', 'CF10']);
assert.equal(new Set(ids).size, 10);
assert.ok(cases.every((testCase) => testCase.locale && testCase.viewport && testCase.interaction));
const evidenceBoundary = {
  browserSelection: 'NOT_EXECUTED',
  quote: 'NOT_EXECUTED',
  dbParentAndItems: 'BLOCKED',
  adminDisplay: 'BLOCKED',
  inboxReceipt: 'BLOCKED',
};
console.log(JSON.stringify({
  recipient: 'nghik22@gmail.com', phone: '+84 389898593', cases,
  evidence: { manifestOnly: true, liveAdmin: false, liveInbox: false, perCase: evidenceBoundary },
}, null, 2));
