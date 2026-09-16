// Planner option data: the selectable inputs of the journey-building flow.
// (Scope doc §10-15). These are application data today; the long-term plan
// is to serve destinations from the backend Destination API (§54).

export const destinations = [
  'Amalfi Coast',
  'Bali',
  'Iceland',
  'Kyoto',
  'Maldives',
  'Morocco',
  'Paris',
];

export const durations = ['3', '5', '7', '10', '14', '14+'];

export const travelStyles = [
  'Slow & Peaceful',
  'Adventure',
  'Luxury',
  'Culture',
  'Food & Nightlife',
  'Nature',
];

export const interests = [
  'Food',
  'Beaches',
  'Adventure',
  'Culture',
  'Shopping',
  'Nature',
  'Nightlife',
  'Art',
  'Wellness',
  'Photography',
];

export const currencies = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 1 },
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.012 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.011 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.0095 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rate: 0.044 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 1.75 },
];

export const experiences = {
  wild: {
    name: 'THE WILD',
    description: 'Chase landscapes that make you feel wonderfully small.',
  },
  table: {
    name: 'THE TABLE',
    description: 'Taste the places you visit through unforgettable food.',
  },
  soul: {
    name: 'THE SOUL',
    description: 'Slow down, reconnect, and experience somewhere deeply.',
  },
  escape: {
    name: 'THE ESCAPE',
    description: 'Disappear somewhere beautiful and let the world wait.',
  },
};

