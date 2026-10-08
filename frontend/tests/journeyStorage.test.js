import { test } from 'node:test';
import assert from 'node:assert/strict';

// journeyStorage touches `localStorage` at module scope only inside
// functions, so a stub installed before the import is enough. jsdom is not
// needed for the pure logic under test.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const { hasLocalPending } = await import('../src/api/journeyStorage.js');

// journeySignature is module-private, so it is exercised through the public
// surface that depends on it. `deleteJourneyById` is what needs it: the whole
// point of the Option A heuristic is that deleting one journey must NOT clear
// the localStorage copy belonging to a different one.
//
// These tests stub `journeys.remove` by intercepting fetch, which is how the
// client reaches the API.

const LOCAL_KEY = 'solenSavedJourney';

function primeLocal(journey) {
  store.clear();
  store.set(LOCAL_KEY, JSON.stringify({ journey, isPremiumPlus: false, favoriteDays: [] }));
}

/** Pretends the API accepted the delete. */
function stubApiAsSuccess() {
  const nativeFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 204,
    headers: { getSetCookie: () => [] },
    text: async () => '',
  });
  return () => {
    globalThis.fetch = nativeFetch;
  };
}

test('hasLocalPending reflects the localStorage copy', () => {
  store.clear();
  assert.equal(hasLocalPending(), false);

  primeLocal({ destination: 'Kyoto', duration: 5, travelStyle: 'Culture' });
  assert.equal(hasLocalPending(), true);

  store.clear();
  assert.equal(hasLocalPending(), false);
});

test('deleting a different journey preserves the local copy', async () => {
  // The regression this whole heuristic exists to prevent: the local copy is
  // a DIFFERENT trip, so clearing it would destroy an unrelated offline save.
  primeLocal({ destination: 'Kyoto', duration: 5, travelStyle: 'Culture' });

  const restore = stubApiAsSuccess();
  try {
    const { deleteJourneyById } = await import('../src/api/journeyStorage.js?del-other');
    const result = await deleteJourneyById('some-other-id', {
      data: { journey: { destination: 'Amalfi Coast', duration: 7, travelStyle: 'Luxury' } },
    });

    assert.equal(result.clearedLocal, false, 'must not claim it cleared anything');
    assert.equal(store.has(LOCAL_KEY), true, 'local Kyoto copy must survive');
  } finally {
    restore();
  }
});

test('deleting the journey that IS the local copy clears it', async () => {
  primeLocal({ destination: 'Kyoto', duration: 5, travelStyle: 'Culture' });

  const restore = stubApiAsSuccess();
  try {
    const { deleteJourneyById } = await import('../src/api/journeyStorage.js?del-self');
    const result = await deleteJourneyById('kyoto-id', {
      data: { journey: { destination: 'Kyoto', duration: 5, travelStyle: 'Culture' } },
    });

    assert.equal(result.clearedLocal, true);
    assert.equal(store.has(LOCAL_KEY), false, 'the local copy must be gone');
  } finally {
    restore();
  }
});

test('the signature match ignores case and surrounding whitespace', async () => {
  // Deliberate: the heuristic is documented as coarse, and normalising here
  // only reduces false negatives without weakening the guard.
  primeLocal({ destination: 'Kyoto', duration: 5, travelStyle: 'Culture' });

  const restore = stubApiAsSuccess();
  try {
    const { deleteJourneyById } = await import('../src/api/journeyStorage.js?del-case');
    const result = await deleteJourneyById('kyoto-id', {
      data: { journey: { destination: '  kyoto ', duration: 5, travelStyle: 'culture' } },
    });

    assert.equal(result.clearedLocal, true);
  } finally {
    restore();
  }
});

test('a row with no comparable fields never clears the local copy', async () => {
  // No signature means no match. Clearing on an empty comparison would be a
  // coin flip, and the wrong side of that coin destroys a save.
  primeLocal({ destination: 'Kyoto', duration: 5, travelStyle: 'Culture' });

  const restore = stubApiAsSuccess();
  try {
    const { deleteJourneyById } = await import('../src/api/journeyStorage.js?del-empty');
    const result = await deleteJourneyById('sparse-id', { data: {} });

    assert.equal(result.clearedLocal, false);
    assert.equal(store.has(LOCAL_KEY), true);
  } finally {
    restore();
  }
});