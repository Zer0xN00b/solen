import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  clearWeatherCache,
  describeWeatherCode,
  getWeather,
} from '../src/services/weatherService.ts';

// Scope §52. The contract under test is not "does it fetch weather" — it is
// "does it fail safely". Every case below is an upstream misbehaviour, and in
// every one the caller must still receive the curated prose it already had.

const CURATED = 'Warm, dry summers and cool evenings.';

/** Replaces global fetch for one call, then restores it. */
function stubFetch(handler) {
  const original = globalThis.fetch;
  globalThis.fetch = async (...args) => handler(...args);
  return () => {
    globalThis.fetch = original;
  };
}

beforeEach(() => {
  clearWeatherCache();
});

test('maps known WMO codes to readable descriptions', () => {
  assert.equal(describeWeatherCode(0), 'Clear sky');
  assert.equal(describeWeatherCode(63), 'Rain');
  assert.equal(describeWeatherCode(95), 'Thunderstorm');
});

test('an unknown code degrades to a neutral phrase, never "undefined"', () => {
  // A provider adding a code we do not know must not put a gap in the UI.
  const label = describeWeatherCode(4242);
  assert.ok(label.length > 0);
  assert.doesNotMatch(label, /undefined|null|NaN/i);
});

test('returns a live reading on a well-formed payload', async () => {
  const restore = stubFetch(async () => ({
    ok: true,
    json: async () => ({
      current: { temperature_2m: 21.4, weather_code: 2, time: '2026-10-05T15:15' },
    }),
  }));

  try {
    const result = await getWeather('kyoto', 35.0116, 135.7681, CURATED);
    assert.equal(result.isLive, true);
    assert.equal(result.live.temperatureC, 21.4);
    assert.equal(result.live.description, 'Partly cloudy');
    assert.equal(result.live.observedAt, '2026-10-05T15:15');
    // The curated prose still travels with the response so a client that
    // only ever sees `live` can still degrade later.
    assert.equal(result.curated, CURATED);
  } finally {
    restore();
  }
});

test('falls back to curated prose when the provider errors', async () => {
  const restore = stubFetch(async () => {
    throw new Error('ECONNREFUSED');
  });

  try {
    const result = await getWeather('kyoto', 35.0116, 135.7681, CURATED);
    assert.equal(result.isLive, false);
    assert.equal(result.live, null);
    assert.equal(result.curated, CURATED);
  } finally {
    restore();
  }
});

test('falls back on a non-200 response', async () => {
  const restore = stubFetch(async () => ({ ok: false, status: 503, json: async () => ({}) }));

  try {
    const result = await getWeather('kyoto', 35.0116, 135.7681, CURATED);
    assert.equal(result.isLive, false);
    assert.equal(result.curated, CURATED);
  } finally {
    restore();
  }
});

test('falls back when the payload shape changes', async () => {
  // The provider is allowed to change. This must degrade, not render NaN°.
  const restore = stubFetch(async () => ({
    ok: true,
    json: async () => ({ current: { temperature_2m: 'warm', weather_code: null } }),
  }));

  try {
    const result = await getWeather('kyoto', 35.0116, 135.7681, CURATED);
    assert.equal(result.isLive, false);
    assert.equal(result.live, null);
    assert.equal(result.curated, CURATED);
  } finally {
    restore();
  }
});

test('a destination without coordinates falls back without spending a request', async () => {
  let called = false;
  const restore = stubFetch(async () => {
    called = true;
    return { ok: true, json: async () => ({ current: { temperature_2m: 20, weather_code: 0 } }) };
  });

  try {
    const result = await getWeather('nowhere', null, null, CURATED);
    assert.equal(result.isLive, false);
    assert.equal(result.curated, CURATED);
    assert.equal(called, false, 'must not call the provider without coordinates');
  } finally {
    restore();
  }
});

test('caches a successful reading and reuses it', async () => {
  let calls = 0;
  const restore = stubFetch(async () => {
    calls += 1;
    return {
      ok: true,
      json: async () => ({ current: { temperature_2m: 20, weather_code: 0, time: 't' } }),
    };
  });

  try {
    const first = await getWeather('kyoto', 35.0116, 135.7681, CURATED);
    const second = await getWeather('kyoto', 35.0116, 135.7681, CURATED);

    assert.equal(first.isLive, true);
    assert.equal(second.isLive, true);
    assert.equal(calls, 1, 'second call must be served from cache');
  } finally {
    restore();
  }
});

test('does not cache a failure, so a later request can recover', async () => {
  // Caching a miss would turn one slow upstream into ten minutes of stale
  // fallback — the outage would outlast the outage.
  let calls = 0;
  const restore = stubFetch(async () => {
    calls += 1;
    if (calls === 1) throw new Error('timeout');
    return {
      ok: true,
      json: async () => ({ current: { temperature_2m: 18, weather_code: 3, time: 't' } }),
    };
  });

  try {
    const first = await getWeather('kyoto', 35.0116, 135.7681, CURATED);
    assert.equal(first.isLive, false);

    const second = await getWeather('kyoto', 35.0116, 135.7681, CURATED);
    assert.equal(second.isLive, true, 'must retry after a failure rather than serve a cached miss');
  } finally {
    restore();
  }
});

test('nearby coordinates share a cache entry', async () => {
  // Keys on rounded coordinates, so a slug change or a re-seed with the same
  // place does not silently multiply upstream traffic.
  let calls = 0;
  const restore = stubFetch(async () => {
    calls += 1;
    return {
      ok: true,
      json: async () => ({ current: { temperature_2m: 20, weather_code: 0, time: 't' } }),
    };
  });

  try {
    await getWeather('kyoto', 35.0116, 135.7681, CURATED);
    await getWeather('kyoto-again', 35.01161, 135.76811, CURATED);
    assert.equal(calls, 1);
  } finally {
    restore();
  }
});