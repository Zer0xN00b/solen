import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  formatLiveConditions,
  liveConditionsLabel,
} from '../src/engine/liveWeather.js';

// Scope §52. These guard the honesty rule: the live block may only appear when
// there is a real reading behind it. Every fallback case must produce null so
// the planner keeps the curated prose it already had.

test('formats a live reading into a single calm line', () => {
  const result = {
    isLive: true,
    live: { temperatureC: 21.4, description: 'Partly cloudy', observedAt: 't', weatherCode: 2 },
    curated: 'Warm and dry.',
  };

  assert.equal(formatLiveConditions(result), '21°C · Partly cloudy');
  assert.equal(liveConditionsLabel(result), 'LIVE CONDITIONS');
});

test('rounds the temperature rather than showing a decimal', () => {
  const result = {
    isLive: true,
    live: { temperatureC: 18.6, description: 'Clear sky' },
    curated: '',
  };

  assert.match(formatLiveConditions(result), /^19°C/);
});

test('shows nothing when the provider fell back', () => {
  const result = { isLive: false, live: null, curated: 'Warm and dry.' };

  assert.equal(formatLiveConditions(result), null);
  // Critically: it must not claim "LIVE" for a reading it does not have.
  assert.equal(liveConditionsLabel(result), null);
});

test('tolerates a missing, null or malformed result', () => {
  for (const bad of [null, undefined, {}, { isLive: true }, { isLive: true, live: null }]) {
    assert.equal(formatLiveConditions(bad), null, `should render nothing for ${JSON.stringify(bad)}`);
    assert.equal(liveConditionsLabel(bad), null);
  }
});

test('refuses to render a non-finite temperature', () => {
  // "NaN°C" in a luxury planner is worse than no reading at all.
  const result = { isLive: true, live: { temperatureC: NaN, description: 'Rain' }, curated: '' };
  assert.equal(formatLiveConditions(result), null);
});

test('falls back to temperature alone when there is no description', () => {
  const result = { isLive: true, live: { temperatureC: 12 }, curated: '' };
  assert.equal(formatLiveConditions(result), '12°C');
});