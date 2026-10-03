/**
 * Saved-journey storage (scope doc §48).
 *
 * The API is the source of truth; localStorage remains a fallback so a
 * saved journey is never lost just because the dev server or the API is
 * down. That ordering is a product decision, not an accident: §47 keeps
 * public planning usable without an account, and someone who has spent
 * ten minutes in the wizard should not lose it to a 502.
 *
 * The fallback is one-way per session — a save that falls back is NOT
 * replayed to the API later, because we cannot know whether the row it
 * would duplicate already exists. Replaying risks duplicates; losing an
 * offline save risks nothing the user cannot redo. Chosen deliberately.
 *
 * The localStorage key is unchanged from the pre-API implementation, so
 * anyone who already saved a journey keeps it across this upgrade.
 */

import { journeys } from '../api/client.js';

const LOCAL_KEY = 'solenSavedJourney';

// Where the most recent save actually landed. Drives the confirmation
// copy, which must not claim a cloud save that didn't happen.
let lastSaveTarget = 'none';

export function getLastSaveTarget() {
  return lastSaveTarget;
}

/** True when a local (unsynced) save is pending. */
export function hasLocalPending() {
  return localStorage.getItem(LOCAL_KEY) !== null;
}

function readLocal() {
  const raw = localStorage.getItem(LOCAL_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // Corrupt entry — drop it rather than leaving it to fail forever.
    localStorage.removeItem(LOCAL_KEY);
    return null;
  }
}

function writeLocal(payload) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(payload));
}

/**
 * Persists a journey. Tries the API first; on any failure writes to
 * localStorage and reports that it did so.
 */
export async function saveJourney(payload) {
  try {
    const { journey } = await journeys.create(payload);
    lastSaveTarget = 'api';
    return { ok: true, target: 'api', journey };
  } catch (err) {
    // 4xx means the request was rejected on its merits (validation), so
    // retrying the same body will fail too — but we still keep a local
    // copy rather than discarding the user's work. The console warning is
    // the only signal; the user gets a working save either way.
    console.warn('[solen] journey save fell back to localStorage:', err?.message);
    writeLocal(payload);
    lastSaveTarget = 'local';
    return { ok: true, target: 'local' };
  }
}

/** True when this browser has something to resume. */
export async function hasSavedJourney() {
  try {
    const { journeys: rows } = await journeys.list();
    if (Array.isArray(rows) && rows.length > 0) return true;
  } catch {
    // fall through to the local check
  }
  return readLocal() !== null;
}

/**
 * Normalizes an API row into the envelope the planner works with.
 *
 * Shared by `loadLatestJourney` and `loadJourneyById` so the two can never
 * disagree about what a row means. The API returns the original request body
 * under `data` — either a bare journey or the
 * `{ journey, isPremiumPlus, favoriteDays }` envelope.
 */
function normalizeRow(row) {
  const data = row?.data || {};

  return {
    journey: data.journey || data,
    isPremiumPlus: Boolean(data.isPremiumPlus ?? row?.isPremiumPlus),
    favoriteDays: Array.isArray(data.favoriteDays) ? data.favoriteDays : [],
    id: row?.id ?? null,
  };
}

/**
 * A coarse identity for a saved journey.
 *
 * Used only to decide whether this browser's localStorage copy corresponds
 * to a given API row — the local copy stores no id, so there is nothing exact
 * to compare against. Heuristic by necessity, and documented as such: two
 * journeys to the same destination with the same length and travel style
 * would be treated as the same journey. That is the right way round to be
 * wrong — it clears a local copy that may not have needed clearing, rather
 * than leaving a deleted journey able to resurrect itself.
 */
function journeySignature(journey) {
  if (!journey || typeof journey !== 'object') return '';

  return [journey.destination, journey.duration, journey.travelStyle]
    .map((value) => String(value ?? '').trim().toLowerCase())
    .join('|');
}

/**
 * Returns the most recent saved journey, or null.
 * Prefers the API (newest first), falling back to local.
 */
export async function loadLatestJourney() {
  try {
    const { journeys: rows } = await journeys.list();
    if (Array.isArray(rows) && rows.length > 0) {
      return normalizeRow(rows[0]);
    }
  } catch {
    // fall through
  }
  return readLocal();
}

/**
 * Returns one specific saved journey by row id, or null.
 *
 * Deliberately does NOT fall back to `readLocal()`: a caller asking for a
 * specific row wants that row or nothing, and silently handing back a
 * different journey from localStorage would be the exact "confidently wrong
 * content" failure this project has been bitten by before.
 */
export async function loadJourneyById(id) {
  try {
    const { journey: row } = await journeys.get(id);
    if (!row) return null;
    return normalizeRow(row);
  } catch {
    return null;
  }
}

/**
 * Deletes one saved journey by row id.
 *
 * `match` is the deleted row (or its snapshot), used to decide whether this
 * browser's localStorage copy is the same journey and should go with it.
 * Omit it and the local copy is left alone.
 *
 * This deliberately does not reuse `clearSavedJourney`, which wipes
 * localStorage unconditionally — deleting one journey from the library would
 * then destroy the offline fallback belonging to a different one.
 */
export async function deleteJourneyById(id, match = null) {
  await journeys.remove(id);

  const local = readLocal();
  if (!local) return { clearedLocal: false };

  // Compare against the snapshot when the row carries one, because that is
  // what the local copy holds; fall back to the promoted columns otherwise.
  const candidate = match?.data?.journey ?? match?.data ?? match;

  if (journeySignature(candidate) && journeySignature(candidate) === journeySignature(local.journey)) {
    localStorage.removeItem(LOCAL_KEY);
    lastSaveTarget = 'none';
    return { clearedLocal: true };
  }

  return { clearedLocal: false };
}

/**
 * Deletes the saved journey. With an id, removes that API row and
 * clears local state; without one, clears local state only.
 */
export async function clearSavedJourney(id) {
  if (id) {
    try {
      await journeys.remove(id);
    } catch {
      // If the row is already gone the user's intent is still satisfied,
      // so this must not block the local cleanup below.
    }
  }
  localStorage.removeItem(LOCAL_KEY);
  lastSaveTarget = 'none';
}