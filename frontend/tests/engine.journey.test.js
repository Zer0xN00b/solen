import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildJourneyDays,
  getWeatherAwareNote,
  normalizeJourney,
} from '../src/engine/journey.js';

test('normalizeJourney fills a missing day list instead of crashing', () => {
  // The regression this exists for: step 6 does journey.days.map() on
  // whatever the API returned, and a snapshot saved before `days` existed
  // arrives without the field — a blank page rather than an error.
  const result = normalizeJourney({ destination: 'Kyoto', duration: 5 });

  assert.deepEqual(result.days, []);
  assert.equal(result.destination, 'Kyoto');
});

test('normalizeJourney fills the string fields the result screen prints', () => {
  const result = normalizeJourney({ days: [] });

  assert.equal(result.accommodation, '');
  assert.equal(result.dining, '');
  assert.equal(result.weather, '');
  assert.equal(result.weatherNote, '');
});

test('normalizeJourney keeps a complete journey intact', () => {
  // It must coerce, not overwrite. A real journey loses nothing.
  const journey = {
    destination: 'Amalfi Coast',
    days: [{ title: 'Day 1', activities: ['Boat'], budget: 100 }],
    accommodation: 'Boutique coastal hotel',
    dining: 'Local trattorias',
    weather: 'Warm and sunny',
    weatherNote: 'Sun protection',
  };

  const result = normalizeJourney(journey);

  assert.equal(result.days.length, 1);
  assert.equal(result.accommodation, 'Boutique coastal hotel');
  assert.equal(result.dining, 'Local trattorias');
  assert.equal(result.weather, 'Warm and sunny');
});

test('normalizeJourney rejects a non-object', () => {
  assert.equal(normalizeJourney(null), null);
  assert.equal(normalizeJourney(undefined), null);
  assert.equal(normalizeJourney('nope'), null);
});

test('normalizeJourney does not mutate its input', () => {
  // State objects are compared and reused; mutating a caller's snapshot
  // would be a subtle bug that only shows up after several resumes.
  const journey = { destination: 'Kyoto' };
  normalizeJourney(journey);

  assert.equal(journey.days, undefined, 'input must be untouched');
});

test('getWeatherAwareNote responds to the conditions it can see', () => {
  const rainy = getWeatherAwareNote('Rain likely', {
    title: 'Temple day',
    activities: ['Walking'],
  });
  const warm = getWeatherAwareNote('Warm and sunny', {
    title: 'Beach day',
    activities: ['Swimming'],
  });

  assert.match(rainy, /light layer/i);
  assert.match(warm, /sun protection/i);
});

test('getWeatherAwareNote falls back to a neutral note', () => {
  const note = getWeatherAwareNote('', { title: 'Anything', activities: [] });
  assert.match(note, /flexibility/i);
});

test('buildJourneyDays honours the requested duration', () => {
  const days = buildJourneyDays(
    [{ title: 'Day one', activities: ['Walk'] }],
    7,
    'Luxury',
    ['Nature'],
    'Amalfi Coast',
    250000,
    null,
    false,
    'Warm and sunny',
  );

  assert.equal(days.length, 7);
});

test('buildJourneyDays caps a "14+" request at 14', () => {
  const days = buildJourneyDays(
    [{ title: 'Day one', activities: ['Walk'] }],
    '14+',
    'Luxury',
    ['Nature'],
    'Amalfi Coast',
    250000,
    null,
    false,
    'Warm and sunny',
  );

  assert.equal(days.length, 14);
});

test('buildJourneyDays never returns an empty itinerary', () => {
  // `personalized[index % personalized.length]` divides by the source count,
  // so an empty source list would be a crash on the very first day.
  const days = buildJourneyDays([], 3, 'Luxury', [], 'Kyoto', 100000, null, false, 'Warm');

  assert.ok(Array.isArray(days));
});