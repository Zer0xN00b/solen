// Journey assembly: weather-aware notes and day-by-day journey building
// (Scope doc sections 11, 24). Pure functions; the engine lives here by decision (see scope section 50).

import { personalizeDays } from './personalization.js';
import { getJourneyDailyEstimate } from './budget.js';

export function getWeatherAwareNote(weather, day) {
  const text = `${weather} ${day.title} ${day.activities.join(' ')}`.toLowerCase();

  if (text.includes('rain') || text.includes('changing skies')) {
    return 'Keep a light layer close and leave flexibility for weather shifts.';
  }

  if (text.includes('warm') || text.includes('tropical') || text.includes('sunny')) {
    return 'Best enjoyed with an easy pace, sun protection, and a little room around outdoor plans.';
  }

  if (text.includes('cool') || text.includes('crisp') || text.includes('cold')) {
    return 'Layer up for the day and leave a little breathing room between outdoor stops.';
  }

  return 'The plan leaves enough flexibility to enjoy the day comfortably as conditions change.';
}

export function buildJourneyDays(
  days,
  duration,
  travelStyle,
  selectedInterests,
  destination,
  budget,
  selectedExperience,
  isPremiumPlus,
  weather,
) {
  const desiredDays = duration === '14+' ? 14 : Math.max(1, Number(duration) || 7);
  const personalized = personalizeDays(days, travelStyle, selectedInterests, destination);

  // No source days means no itinerary can be built. Returning an empty array
  // lets the caller decide what that means; falling through would index
  // `personalized[0 % 0]` — undefined — and crash on `source.title`.
  //
  // This is reachable, not theoretical: `createJourney` only checks that the
  // destination has a record, not that it has day blocks, so a destination
  // in the database with an empty itinerary reaches here.
  if (personalized.length === 0) return [];

  const result = [];

  for (let index = 0; index < desiredDays; index += 1) {
    const source = personalized[index % personalized.length];
    const cycle = Math.floor(index / personalized.length);
    const isExtended = cycle > 0;
    const day = {
      ...source,
      title: isExtended ? `${source.title} · A Deeper Day` : source.title,
      activities: [...source.activities],
    };

    day.budget = getJourneyDailyEstimate(
      budget,
      destination,
      travelStyle,
      selectedInterests,
      selectedExperience,
      isPremiumPlus,
      index,
    );
    day.weatherNote = getWeatherAwareNote(weather, day);
    result.push(day);
  }

  return result;
}

/**
 * Fills in the fields the result screen assumes exist.
 *
 * A journey reaches state from two places: `createJourney()` in this module,
 * which always produces a full shape, and a saved snapshot from the API or
 * localStorage, which is OPAQUE. The library's `?journey=<id>` deep link makes
 * that second path reachable from a URL, and a row saved before `days` existed
 * — or a snapshot truncated at the 1 MB ceiling — arrives with the field
 * missing.
 *
 * Without this, step 6 does `journey.days.map(...)` on undefined and the
 * planner renders a blank page with no error. That is the "confidently wrong
 * content" failure this project keeps running into: a crash is at least
 * visible, a blank page is not.
 *
 * Coerces rather than validates. The snapshot is not user input, and a
 * half-filled journey is far more useful than no journey — the day list is the
 * part that cannot be faked, so it degrades to empty and the rest keeps
 * whatever it had.
 */
export function normalizeJourney(journey) {
  if (!journey || typeof journey !== 'object') return null;

  return {
    ...journey,

    // The one field with no safe default: an absent day list means an empty
    // itinerary, not a fabricated one.
    days: Array.isArray(journey.days) ? journey.days : [],

    accommodation: journey.accommodation || '',
    dining: journey.dining || '',
    weather: journey.weather || '',
    weatherNote: journey.weatherNote || '',
  };
}
