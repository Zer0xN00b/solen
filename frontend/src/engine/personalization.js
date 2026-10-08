// Traveller personalization logic (Scope doc §17-19).
// Pure functions: no React, no DOM. The engine lives here by decision (see scope section 50).

import { experiences } from '../data/plannerOptions.js';

export function createSlug(value) {
  return value.toLowerCase().replace(/\s+/g, '-');
}

export function getTravelerProfile(
  travelStyle,
  selectedInterests,
  selectedExperience,
  feelingParam,
) {
  const interests = selectedInterests || [];

  if (
    travelStyle === 'Adventure' ||
    interests.includes('Adventure') ||
    selectedExperience === 'wild'
  ) {
    return {
      name: 'The Wild Seeker',
      description:
        'You travel for movement, discovery, and the stories that happen off the obvious path.',
    };
  }

  if (
    travelStyle === 'Luxury' ||
    interests.includes('Wellness') ||
    selectedExperience === 'escape'
  ) {
    return {
      name: 'The Refined Escapist',
      description:
        'You like beautiful places, unhurried moments, and a little more indulgence along the way.',
    };
  }

  if (
    travelStyle === 'Food & Nightlife' ||
    interests.includes('Food') ||
    interests.includes('Nightlife') ||
    selectedExperience === 'table'
  ) {
    return {
      name: 'The Taste Chaser',
      description:
        'You understand a place through its tables, neighbourhoods, flavours, and after-dark energy.',
    };
  }

  if (
    travelStyle === 'Culture' ||
    interests.includes('Culture') ||
    interests.includes('Art') ||
    feelingParam === 'discover-culture'
  ) {
    return {
      name: 'The Curious Romantic',
      description:
        'You travel slowly enough to notice the details — art, rituals, architecture, and local stories.',
    };
  }

  if (
    travelStyle === 'Nature' ||
    interests.includes('Nature') ||
    interests.includes('Photography')
  ) {
    return {
      name: 'The Slow Explorer',
      description:
        'You are drawn to open landscapes, quiet beauty, and the kind of moments worth remembering.',
    };
  }

  return {
    name: 'The Intentional Traveller',
    description:
      'You prefer a journey with balance — enough to discover, enough to breathe, and nothing that feels rushed.',
  };
}

export function getPersonalizedSummary(
  destination,
  travelStyle,
  selectedInterests,
  selectedExperience,
  feelingParam,
) {
  const interests = selectedInterests || [];
  const focus = interests.length
    ? interests
        .slice(0, 3)
        .join(', ')
        .replace(/, ([^,]*)$/, ' & $1')
    : 'the moments that matter most to you';

  const styleText =
    {
      'Slow & Peaceful': 'unhurried mornings and room to simply be there',
      Adventure: 'movement, discovery, and a little unpredictability',
      Luxury: 'beautiful stays, elevated experiences, and time to indulge',
      Culture: 'local stories, design, art, and meaningful encounters',
      'Food & Nightlife': 'great tables, local flavour, and evenings worth staying out for',
      Nature: 'open landscapes, fresh air, and time away from the noise',
    }[travelStyle] || 'a rhythm that feels distinctly yours';

  const experienceText =
    selectedExperience && experiences[selectedExperience]
      ? ` With ${experiences[selectedExperience].name.toLowerCase()} woven through it, the journey keeps its sense of character.`
      : '';

  if (feelingParam === 'fall-in-love') {
    return `SOLEN shaped ${destination} around ${styleText}, with ${focus} adding the details that make the journey feel personal and intimate.${experienceText}`;
  }

  return `SOLEN shaped ${destination} around ${styleText}, then layered in ${focus} so the itinerary feels considered rather than simply packed.${experienceText}`;
}

export function personalizeDays(days, travelStyle, selectedInterests, _destination) {
  const interests = selectedInterests || [];
  const ranked = [...days].map((day, index) => {
    let score = 0;
    const text = `${day.title} ${day.description} ${day.activities.join(' ')}`.toLowerCase();

    interests.forEach((interest) => {
      if (text.includes(interest.toLowerCase())) score += 3;
    });

    const styleKeywords = {
      'Slow & Peaceful': ['slow', 'relax', 'quiet', 'leisurely', 'sunset', 'garden', 'spa'],
      Adventure: ['adventure', 'wild', 'mountain', 'water', 'drive', 'hike', 'explore', 'glacier'],
      Luxury: ['private', 'luxury', 'fine', 'villa', 'spa', 'sunset', 'chef'],
      Culture: ['temple', 'culture', 'tradition', 'art', 'market', 'garden', 'medina', 'museum'],
      'Food & Nightlife': [
        'food',
        'dinner',
        'market',
        'restaurant',
        'tasting',
        'café',
        'bar',
        'izakaya',
      ],
      Nature: [
        'nature',
        'coast',
        'water',
        'mountain',
        'forest',
        'garden',
        'landscape',
        'beach',
        'glacier',
      ],
    };

    (styleKeywords[travelStyle] || []).forEach((keyword) => {
      if (text.includes(keyword)) score += 2;
    });

    return { ...day, _score: score, _originalIndex: index };
  });

  const sorted = ranked.sort((a, b) => b._score - a._score || a._originalIndex - b._originalIndex);

  if (sorted.length > 2) {
    const opening = sorted.find((day) => day._originalIndex === 0);
    const ending = sorted.find((day) => day._originalIndex === days.length - 1);
    const middle = sorted.filter((day) => day !== opening && day !== ending);

    return [opening, ...middle, ending]
      .filter(Boolean)
      .map(({ _score, _originalIndex, ...day }) => ({
        ...day,
        activities: [...day.activities],
      }));
  }

  return sorted.map(({ _score, _originalIndex, ...day }) => ({
    ...day,
    activities: [...day.activities],
  }));
}
