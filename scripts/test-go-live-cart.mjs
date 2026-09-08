import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const code = ts.transpileModule(readFileSync(new URL('../src/lib/bookingCartStorage.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const key = 'nganha_booking_cart_v2';
const item = { id: 'QA', cartId: 'qa-1', qty: 2, names: { en: 'QA' }, priceVND: 790000, basePriceVND: 790000, priceUSD: 32, basePriceUSD: 32, timeValue: 60, options: {} };
function setup(fetch) {
  const now = Date.now();
  const storage = new Map([[key, JSON.stringify({ version: 2, createdAt: now, updatedAt: now, expiresAt: now + 86400000, items: [item] })]]);
  const exports = {};
  vm.runInNewContext(code, { exports, fetch, console, Date, CustomEvent: class {}, window: {
    dispatchEvent() {}, localStorage: { getItem: k => storage.get(k) || null, setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) },
  } });
  return { storage, revalidate: exports.revalidateCartWithServer };
}
for (const status of [409, 503]) {
  const h = setup(async () => Response.json({ code: 'CART_REQUIRES_REVIEW', unavailableItems: [{ id: 'QA' }] }, { status }));
  const before = h.storage.get(key); const result = await h.revalidate();
  assert.equal(result.valid, false); assert.equal(h.storage.get(key), before); assert.equal(result.updatedCart.length, 1);
}
const h = setup(async () => Response.json({ valid: true, items: [{ ...item, basePriceUSD: 33, priceUSD: 33, duration: 60 }], quote: 'signed-fixture' }));
const result = await h.revalidate();
assert.equal(result.valid, true); assert.equal(result.hasPriceChanged, true); assert.equal(result.quote, 'signed-fixture');
assert.equal(JSON.parse(h.storage.get(key)).items[0].priceUSD, 33);
assert.equal(JSON.parse(h.storage.get(key)).items[0].qty, 2);
assert.equal(JSON.parse(h.storage.get(key)).items[0].priceVND, 790000);
const malformed = setup(async () => Response.json({ valid: true }));
assert.equal((await malformed.revalidate()).valid, false);
console.log('PASS cart: 409/503 preserve selections, USD-only change persists, quote forwarded, malformed response fails closed');
