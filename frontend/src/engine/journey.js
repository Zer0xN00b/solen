// Journey assembly: weather-aware notes and day-by-day journey building
// (Scope doc §11, §24). Pure functions, portable to the backend later.

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
