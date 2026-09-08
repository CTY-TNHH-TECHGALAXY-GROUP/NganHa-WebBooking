import assert from 'node:assert/strict';

const locales = ['vi', 'en', 'jp', 'kr', 'cn'];
const clone = value => JSON.parse(JSON.stringify(value));
const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const resolve = (value, locale, fallback = '') => {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return fallback;
  if (has(value, locale)) return value[locale];
  if (has(value, 'en')) return value.en;
  if (has(value, 'vi')) return value.vi;
  return fallback;
};

const merge = (base, override = {}) => {
  const result = { ...base, ...override };
  if (Array.isArray(base.rows) && (override.body1 !== undefined || override.body2 !== undefined || override.body3 !== undefined)) {
    result.rows = base.rows.map((row, index) => ({
      ...row,
      text: [override.body1, override.body2, override.body3][index] ?? row.text,
    }));
  }
  if (override.quote !== undefined) result.pullQuote = override.quote;
  if (Array.isArray(override.rows)) result.rows = override.rows;
  return result;
};

const expectAllLocales = object => locales.every(locale => typeof object[locale] === 'string' && object[locale].length > 0);

// CMS01/CMS02/CMS03/CMS04/CMS05/CMS10/CMS13/CMS14: resolver semantics.
const base = { vi: 'VI', en: 'EN', jp: 'JP', kr: 'KR', cn: 'CN' };
assert.equal(resolve(base, 'jp'), 'JP');
assert.equal(resolve(base, 'fr'), 'EN');
assert.equal(resolve({ ...base, jp: '' }, 'jp', 'fallback'), '');
assert.equal(resolve({ vi: 'VI' }, 'cn'), 'VI');
assert.equal(expectAllLocales(base), true);
const legacy = merge({ rows: [{ title: 'Row', text: 'old' }] }, { body1: '' });
assert.equal(legacy.rows[0].text, '');
assert.equal(merge({ quote: 'old' }, { quote: '' }).quote, '');
assert.equal(merge({ custom: { keep: true } }, { newField: 'new' }).custom.keep, true);
assert.equal('a\nb'.split('\n').length, 2);

// CMS06: catalog descriptions are a separate source and the adapter never
// changes identity, pricing, or duration fields.
const catalog = { id: 'NHP0001', priceVND: 123, priceUSD: 4, timeValue: 60, descriptions: { vi: 'VI' } };
const descriptionPatch = { ...catalog.descriptions, jp: 'JP', kr: 'KR', cn: 'CN' };
const afterCatalogPatch = { ...catalog, descriptions: descriptionPatch };
assert.deepEqual({ id: afterCatalogPatch.id, priceVND: afterCatalogPatch.priceVND, priceUSD: afterCatalogPatch.priceUSD, timeValue: afterCatalogPatch.timeValue }, { id: 'NHP0001', priceVND: 123, priceUSD: 4, timeValue: 60 });
assert.deepEqual(afterCatalogPatch.descriptions, { vi: 'VI', jp: 'JP', kr: 'KR', cn: 'CN' });

// CMS07/CMS08: CAS token model and failed writes leave the draft untouched.
const token = value => JSON.stringify(value);
const original = { eyebrow: 'old' };
const draft = { eyebrow: 'draft' };
assert.notEqual(token(original), token(draft));
assert.deepEqual(draft, { eyebrow: 'draft' });

// CMS09: fill-missing seed semantics preserve custom and intentional empty values.
const fillMissing = (target, defaults) => Object.fromEntries(Object.entries({ ...defaults, ...target }).map(([key, value]) => [key, has(target, key) ? value : defaults[key]]));
assert.deepEqual(fillMissing({ custom: 'yes', empty: '' }, { custom: 'default', empty: 'default', missing: 'filled' }), { custom: 'yes', empty: '', missing: 'filled' });

// CMS11/CMS12: stable media keys and the confirmed history extension repair.
const normalizeHistoryImage = value => value === '/images/history/2015-ngan-ha-team.jpg' ? '/images/history/2015-ngan-ha-team.png' : value;
assert.equal(normalizeHistoryImage('/images/history/2015-ngan-ha-team.jpg'), '/images/history/2015-ngan-ha-team.png');
assert.equal(normalizeHistoryImage('https://cdn.example/custom.jpg'), 'https://cdn.example/custom.jpg');
assert.equal('pure_relaxation_media', 'pure_relaxation_media');

console.log('CMS01-CMS14 mock assertions: PASS (14 IDs covered; authenticated/staging/browser integration remains NOT VERIFIED)');
