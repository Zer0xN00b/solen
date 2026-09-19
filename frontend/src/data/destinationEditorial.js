// Editorial content for the destination detail pages (Scope doc §7).
// Keyed by route slug (/destinations/:slug). Design is LOCKED - only extend
// content here when adding a new destination.

export const destinationEditorial = {
  kyoto: {
    name: 'Kyoto',
    region: 'JAPAN · ASIA',
    image: '/assets/destinations/kyoto.webp',
    description: 'Ancient rituals, quiet gardens, and timeless beauty.',

    introTitle: 'A city where time moves differently.',
    intro:
      'Kyoto invites you to slow down. Wander through centuries-old streets, discover hidden temples, drink matcha in quiet gardens, and experience a Japan shaped by ritual, craft, and understated beauty.',

    bestTime: 'March – May · October – November',

    experiences: [
      'Private tea ceremony',
      'Arashiyama bamboo grove',
      'Fushimi Inari at sunrise',
      'Traditional ryokan stay',
    ],

    styles: ['Culture', 'Nature', 'Slow Travel', 'Luxury'],
  },

  'amalfi-coast': {
    name: 'Amalfi Coast',
    region: 'ITALY · EUROPE',
    image: '/assets/destinations/amalfi.webp',
    description: 'Cliffside villages, blue waters, and effortless Italian beauty.',

    introTitle: 'La dolce vita, above the sea.',
    intro:
      'The Amalfi Coast is made for lingering. Follow winding coastal roads, disappear into hillside villages, swim in impossibly blue water, and let long lunches stretch into golden afternoons.',

    bestTime: 'May – June · September – October',

    experiences: [
      'Private coastal boat day',
      'Ravello garden visit',
      'Italian cooking experience',
      'Sunset aperitivo in Positano',
    ],

    styles: ['Romantic', 'Luxury', 'Food', 'Relaxation'],
  },

  bali: {
    name: 'Bali',
    region: 'INDONESIA · ASIA',
    image: '/assets/destinations/bali.webp',
    description: 'Tropical stillness, lush landscapes, and soulful escapes.',

    introTitle: 'Come for the island. Stay for the feeling.',
    intro:
      'Bali moves between jungle, ocean, rice terraces, and quiet spiritual spaces. Spend your days between hidden beaches, beautiful villas, temple rituals, and long evenings surrounded by nature.',

    bestTime: 'April – October',

    experiences: [
      'Private jungle villa stay',
      'Sunrise Mount Batur trek',
      'Balinese wellness ritual',
      'Ubud rice terrace journey',
    ],

    styles: ['Nature', 'Wellness', 'Adventure', 'Luxury'],
  },

  iceland: {
    name: 'Iceland',
    region: 'ICELAND · EUROPE',
    image: '/assets/destinations/iceland.webp',
    description: 'Wild landscapes, endless skies, and the beauty of the unknown.',

    introTitle: 'For those drawn to the wild.',
    intro:
      'Iceland feels almost otherworldly. Chase waterfalls across volcanic landscapes, soak in geothermal waters, drive beneath enormous skies, and let the rawness of the island become part of the journey.',

    bestTime: 'June – August · September – March',

    experiences: [
      'Private South Coast drive',
      'Blue Lagoon retreat',
      'Northern Lights expedition',
      'Glacier and ice cave adventure',
    ],

    styles: ['Adventure', 'Nature', 'Photography', 'Luxury'],
  },

  maldives: {
    name: 'Maldives',
    region: 'MALDIVES · ISLANDS',
    image: '/assets/destinations/maldives.webp',
    description: 'Turquoise waters, secluded shores, and complete escape.',

    introTitle: 'Nothing to do. Everything to feel.',
    intro:
      'The Maldives is an invitation to disappear. Wake above the water, spend afternoons drifting between reef and lagoon, and end each day beneath a sky untouched by the noise of the world.',

    bestTime: 'November – April',

    experiences: [
      'Overwater villa escape',
      'Private island dinner',
      'Sunset sailing experience',
      'Reef diving and snorkelling',
    ],

    styles: ['Relaxation', 'Romantic', 'Luxury', 'Nature'],
  },

  morocco: {
    name: 'Morocco',
    region: 'MOROCCO · AFRICA',
    image: '/assets/destinations/morocco.webp',
    description: 'Ancient medinas, warm desert light, and unforgettable colour.',

    introTitle: 'Where every corner tells a story.',
    intro:
      'Morocco is a world of texture and contrast. Lose yourself in ancient medinas, stay inside beautifully restored riads, cross desert landscapes, and experience food, craft, colour, and hospitality at every turn.',

    bestTime: 'March – May · September – November',

    experiences: [
      'Luxury riad stay',
      'Marrakech medina discovery',
      'Sahara desert camp',
      'Private Moroccan cooking class',
    ],

    styles: ['Culture', 'Adventure', 'Food', 'Luxury'],
  },

  paris: {
    name: 'Paris',
    region: 'FRANCE · EUROPE',
    image: '/assets/destinations/paris.webp',
    description: 'Art, intimacy, timeless streets, and the pleasure of lingering.',

    introTitle: 'For the pleasure of getting lost.',
    intro:
      'Paris rewards curiosity. Spend mornings inside quiet galleries, wander through neighbourhood cafés, discover beautiful hidden streets, and let the city unfold at its own unhurried rhythm.',

    bestTime: 'April – June · September – October',

    experiences: [
      'Private museum experience',
      'Seine sunset cruise',
      'Parisian food discovery',
      'Hidden neighbourhood walk',
    ],

    styles: ['Culture', 'Romantic', 'Food', 'Luxury'],
  },
};
