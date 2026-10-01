/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

// The repository has no TS test runner; compile only these small modules in memory.
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(compiled.outputText, filename);
};

const { normalizeSpaWeather } = require('../weather-status.ts');
const { getSpaWeather, WEATHER_CACHE_SECONDS } = require('../weather-api.ts');

const NOW = Math.floor(Date.parse('2026-10-01T04:30:00Z') / 1000);
const makeRaw = ({ currentMm = 0, currentCode = 1003, chance = 10, nextMm = 0, nextCode = 1003 } = {}) => ({
  current: {
    temp_c: 31,
    precip_mm: currentMm,
    condition: { code: currentCode, text: 'Partly cloudy' },
    last_updated_epoch: NOW - 300,
  },
  forecast: {
    forecastday: [{ hour: [{
      time_epoch: NOW + 1800,
      chance_of_rain: chance,
      precip_mm: nextMm,
      condition: { code: nextCode },
    }] }],
  },
});

test('classifies current rain and the next forecast hour', () => {
  assert.equal(normalizeSpaWeather(makeRaw(), NOW).status, 'no_rain');
  assert.equal(normalizeSpaWeather(makeRaw({ chance: 60 }), NOW).status, 'rain_soon');
  assert.equal(normalizeSpaWeather(makeRaw({ nextMm: 0.2 }), NOW).rainSoon, true);
  assert.equal(normalizeSpaWeather(makeRaw({ nextCode: 1183 }), NOW).rainSoon, true);
  assert.equal(normalizeSpaWeather(makeRaw({ currentMm: 0.2 }), NOW).isRaining, true);
  assert.equal(normalizeSpaWeather(makeRaw({ currentMm: 0.2 }), NOW).status, 'light_rain');
  assert.equal(normalizeSpaWeather(makeRaw({ currentMm: 2 }), NOW).status, 'rain');
  assert.equal(normalizeSpaWeather(makeRaw({ currentCode: 1183 }), NOW).status, 'light_rain');
  assert.equal(normalizeSpaWeather(makeRaw({ currentCode: 1189 }), NOW).status, 'rain');
  assert.equal(normalizeSpaWeather(makeRaw({ currentCode: 1063 }), NOW).status, 'no_rain');
});

test('hides missing, malformed, stale, or absent next-hour data', () => {
  assert.equal(normalizeSpaWeather({}, NOW), null);
  assert.equal(normalizeSpaWeather({ ...makeRaw(), current: { ...makeRaw().current, precip_mm: undefined } }, NOW), null);
  assert.equal(normalizeSpaWeather({ ...makeRaw(), current: { ...makeRaw().current, condition: {} } }, NOW), null);
  assert.equal(normalizeSpaWeather({ ...makeRaw(), forecast: {} }, NOW), null);
  assert.equal(normalizeSpaWeather({ ...makeRaw(), current: { ...makeRaw().current, last_updated_epoch: NOW - 3600 } }, NOW), null);
  assert.equal(normalizeSpaWeather({ ...makeRaw(), forecast: { forecastday: [{ hour: [] }] } }, NOW), null);
});

test('finds the next hour across midnight', () => {
  const beforeMidnight = Math.floor(Date.parse('2026-10-01T16:30:00Z') / 1000);
  const raw = makeRaw();
  raw.current.last_updated_epoch = beforeMidnight - 300;
  raw.forecast.forecastday = [{ hour: [] }, { hour: [{
    time_epoch: beforeMidnight + 1800,
    chance_of_rain: 70,
    precip_mm: 0,
    condition: { code: 1003 },
  }] }];
  assert.equal(normalizeSpaWeather(raw, beforeMidnight).status, 'rain_soon');
});

test('server service returns only normalized fields', async () => {
  const previousFetch = global.fetch;
  const previousEnv = {
    WEATHER_API_KEY: process.env.WEATHER_API_KEY,
    ORIA_SPA_LAT: process.env.ORIA_SPA_LAT,
    ORIA_SPA_LNG: process.env.ORIA_SPA_LNG,
  };
  const now = Math.floor(Date.now() / 1000);
  const raw = makeRaw();
  raw.current.last_updated_epoch = now - 60;
  raw.forecast.forecastday[0].hour[0].time_epoch = Math.ceil(now / 3600) * 3600;
  raw.current.secretVendorField = 'should not leave the server';
  process.env.WEATHER_API_KEY = 'test-secret';
  process.env.ORIA_SPA_LAT = '10.77';
  process.env.ORIA_SPA_LNG = '106.70';
  global.fetch = async () => Response.json(raw);

  try {
    const weather = await getSpaWeather();
    assert.equal(weather.status, 'no_rain');
    assert.deepEqual(Object.keys(weather).sort(), [
      'conditionCode', 'conditionText', 'isRaining', 'rainSoon', 'status', 'temperatureC', 'updatedAt',
    ]);
    assert.equal(JSON.stringify(weather).includes('secretVendorField'), false);
    assert.equal(JSON.stringify(weather).includes('test-secret'), false);
  } finally {
    global.fetch = previousFetch;
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('provider failure leaves weather hidden and uses only fixed spa coordinates', async () => {
  const previousFetch = global.fetch;
  const previousError = console.error;
  const previousEnv = {
    WEATHER_API_KEY: process.env.WEATHER_API_KEY,
    ORIA_SPA_LAT: process.env.ORIA_SPA_LAT,
    ORIA_SPA_LNG: process.env.ORIA_SPA_LNG,
  };
  const logs = [];
  let request;
  process.env.WEATHER_API_KEY = 'test-secret';
  process.env.ORIA_SPA_LAT = '10.77';
  process.env.ORIA_SPA_LNG = '106.70';
  console.error = (...args) => logs.push(args.join(' '));
  global.fetch = async (url, options) => {
    request = { url: new URL(url), options };
    throw new Error('WeatherAPI unavailable');
  };

  try {
    assert.equal(await getSpaWeather(), null);
    assert.equal(request.url.searchParams.get('q'), '10.77,106.7');
    assert.equal(request.url.searchParams.get('days'), '2');
    assert.equal(request.options.next.revalidate, WEATHER_CACHE_SECONDS);
    assert.equal(logs.join(' ').includes('test-secret'), false);
  } finally {
    global.fetch = previousFetch;
    console.error = previousError;
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('invalid coordinates or provider errors never return weather data', async () => {
  const previousFetch = global.fetch;
  const previousError = console.error;
  const previousEnv = {
    WEATHER_API_KEY: process.env.WEATHER_API_KEY,
    ORIA_SPA_LAT: process.env.ORIA_SPA_LAT,
    ORIA_SPA_LNG: process.env.ORIA_SPA_LNG,
  };
  process.env.WEATHER_API_KEY = 'test-secret';
  process.env.ORIA_SPA_LAT = '999';
  process.env.ORIA_SPA_LNG = '106.70';
  console.error = () => {};
  global.fetch = async () => { throw new Error('Should not fetch with invalid coordinates'); };

  try {
    assert.equal(await getSpaWeather(), null);
    process.env.ORIA_SPA_LAT = '10.77';
    global.fetch = async () => new Response('{}', { status: 403 });
    assert.equal(await getSpaWeather(), null);
    global.fetch = async () => new Response('{}', { status: 200 });
    assert.equal(await getSpaWeather(), null);
  } finally {
    global.fetch = previousFetch;
    console.error = previousError;
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
