import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseJourneyInput, ValidationError } from '../src/services/journeyValidation.ts';

// This is the trust boundary: everything below arrives from a client and
// becomes a database column. The cases here are the ones that must NOT get
// through — a bad write here is a corrupted library row for every user.

test('rejects a body that is not an object', () => {
  for (const bad of [null, undefined, 42, 'string', true]) {
    assert.throws(() => parseJourneyInput(bad), ValidationError);
  }
});

test('rejects an array body', () => {
  // An array is typeof 'object', which is exactly why this is checked.
  assert.throws(() => parseJourneyInput([1, 2, 3]), ValidationError);
});

test('requires destination and duration', () => {
  assert.throws(() => parseJourneyInput({ duration: 5 }), ValidationError);
  assert.throws(() => parseJourneyInput({ destination: 'Kyoto' }), ValidationError);
  assert.throws(() => parseJourneyInput({ destination: '   ', duration: 5 }), ValidationError);
});

test('accepts a flat journey object', () => {
  const input = parseJourneyInput({
    destination: 'Kyoto',
    duration: 5,
    travelStyle: 'Culture',
    budget: 180000,
    currency: 'jpy',
  });

  assert.equal(input.destination, 'Kyoto');
  assert.equal(input.duration, 5);
  assert.equal(input.travelStyle, 'Culture');
  assert.equal(input.budget, 180000);
  // Currency is normalised to upper case at the boundary, so the column is
  // always comparable.
  assert.equal(input.currency, 'JPY');
});

test('accepts the planner envelope and persists it whole', () => {
  // The planner sends { journey, isPremiumPlus, favoriteDays }. favouriteDays
  // sits OUTSIDE `journey`, so a validator that only snapshotted `journey`
  // would silently drop it and resume would lose the user's starred days.
  const input = parseJourneyInput({
    journey: { destination: 'Kyoto', duration: 5, travelStyle: 'Culture' },
    isPremiumPlus: true,
    favoriteDays: [1, 3],
  });

  assert.equal(input.isPremiumPlus, true);
  assert.deepEqual(input.data.favoriteDays, [1, 3]);
  assert.deepEqual(input.data.isPremiumPlus, true);
});

test('a top-level value beats the snapshot for a promoted column', () => {
  // The envelope can disagree with the snapshot. The explicit outer value
  // wins, otherwise a stale snapshot silently overwrites what the client
  // actually asked to store.
  const input = parseJourneyInput({
    journey: { destination: 'Kyoto', duration: 5, budget: 100 },
    budget: 999,
  });

  assert.equal(input.budget, 999);
});

test('derives a title when the client sends none', () => {
  const input = parseJourneyInput({ destination: 'Maldives', duration: 10 });
  assert.equal(input.title, 'Maldives — 10 days');
});

test('derives a singular title for one day', () => {
  assert.equal(parseJourneyInput({ destination: 'Paris', duration: 1 }).title, 'Paris — 1 day');
});

test('keeps a client-supplied title', () => {
  const input = parseJourneyInput({ destination: 'Kyoto', duration: 5, title: 'Kyoto in autumn' });
  assert.equal(input.title, 'Kyoto in autumn');
});

test('accepts a numeric string duration', () => {
  // The planner's inputs are DOM values, so this is a real shape.
  assert.equal(parseJourneyInput({ destination: 'Kyoto', duration: '5' }).duration, 5);
});

test('rejects out-of-range durations', () => {
  assert.throws(() => parseJourneyInput({ destination: 'Kyoto', duration: 0 }), ValidationError);
  assert.throws(() => parseJourneyInput({ destination: 'Kyoto', duration: -3 }), ValidationError);
  assert.throws(() => parseJourneyInput({ destination: 'Kyoto', duration: 999 }), ValidationError);
  assert.throws(() => parseJourneyInput({ destination: 'Kyoto', duration: 'abc' }), ValidationError);
});

test('rejects a negative budget but allows zero', () => {
  // Zero is a real budget; negative is nonsense. `budget > 0` would be wrong.
  assert.throws(() => parseJourneyInput({ destination: 'Kyoto', duration: 5, budget: -1 }), ValidationError);
  assert.equal(parseJourneyInput({ destination: 'Kyoto', duration: 5, budget: 0 }).budget, 0);
});

test('caps over-long strings so a column cannot overflow', () => {
  assert.throws(
    () => parseJourneyInput({ destination: 'x'.repeat(500), duration: 5 }),
    ValidationError,
  );
  assert.throws(
    () => parseJourneyInput({ destination: 'Kyoto', duration: 5, travelStyle: 'y'.repeat(500) }),
    ValidationError,
  );
});

test('defaults currency to INR and optional fields to null', () => {
  const input = parseJourneyInput({ destination: 'Kyoto', duration: 5 });

  assert.equal(input.currency, 'INR');
  assert.equal(input.travelStyle, null);
  assert.equal(input.budget, null);
  assert.equal(input.isPremiumPlus, false);
});

test('trims whitespace instead of storing it', () => {
  const input = parseJourneyInput({ destination: '  Kyoto  ', duration: 5 });
  assert.equal(input.destination, 'Kyoto');
});

test('rejects a snapshot that is not an object', () => {
  assert.throws(() => parseJourneyInput({ journey: 'nope', duration: 5 }), ValidationError);
});

test('rejects an oversized snapshot', () => {
  // The 1 MB ceiling is what stops an unbounded row being written. Generating
  // ~1.1 MB of filler is the only honest way to prove the boundary holds.
  const huge = { destination: 'Kyoto', duration: 5, journey: { junk: 'x'.repeat(1_100_000) } };
  assert.throws(() => parseJourneyInput(huge), ValidationError);
});

test('ValidationError carries a 400 status for the error handler', () => {
  try {
    parseJourneyInput({});
    assert.fail('should have thrown');
  } catch (err) {
    assert.ok(err instanceof ValidationError);
    assert.equal(err.status, 400);
  }
});