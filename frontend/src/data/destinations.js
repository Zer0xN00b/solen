// Core itinerary content for every SOLEN destination.
// Each destination carries imagery, weather summary, accommodation/dining tiers
// and the base day-plans the planner personalizes (Scope doc §10, §19, §51).
// When the backend itinerary engine arrives (§50), this file becomes the seed
// data for the destinations table.

export const itineraryData = {
  'Amalfi Coast': {
    image: '/assets/destinations/amalfi.webp',
    weather: 'Warm, sunny days with a gentle Mediterranean breeze.',
    accommodation: {
      standard: 'Boutique coastal hotel',
      premium: 'Private cliffside luxury villa',
    },
    dining: {
      standard: 'Local trattorias and seaside restaurants',
      premium: 'Michelin-starred dining and private chef experiences',
    },
    days: [
      {
        title: 'Arrive Along the Coast',
        description:
          'Ease into the Amalfi rhythm with sea views, winding streets, and a slow first evening.',
        activities: [
          'Check into your coastal stay',
          'Explore Amalfi town',
          'Sunset aperitivo overlooking the sea',
        ],
        budget: 9000,
      },
      {
        title: 'Positano in Full Colour',
        description:
          'Spend the day wandering Positano, discovering hidden corners and beautiful coastal viewpoints.',
        activities: ['Breakfast with a sea view', 'Walk through Positano', 'Beach afternoon'],
        budget: 11000,
      },
      {
        title: 'A Day on the Water',
        description: 'Experience the coast from the water with a relaxed private boat day.',
        activities: ['Private boat excursion', 'Swim in secluded coves', 'Lunch by the water'],
        budget: 15000,
      },
      {
        title: 'Ravello Escape',
        description:
          'Trade the coastline for Ravello and its gardens, villas, and dramatic mountain views.',
        activities: ['Visit Villa Rufolo', 'Explore Ravello', 'Long lunch overlooking the coast'],
        budget: 10000,
      },
      {
        title: 'Slow Coastal Living',
        description:
          'A quieter day designed around beautiful food, wandering, and the Mediterranean pace.',
        activities: ['Leisurely breakfast', 'Local artisan shopping', 'Golden-hour coastal walk'],
        budget: 8500,
      },
      {
        title: 'Capri Day',
        description:
          'Take a day trip to Capri for dramatic cliffs, elegant streets, and blue water.',
        activities: ['Ferry to Capri', 'Explore Anacapri', 'Return for sunset'],
        budget: 13000,
      },
      {
        title: 'One Last Italian Morning',
        description: 'End slowly with one final breakfast and a last look at the coast.',
        activities: ['Breakfast overlooking the sea', 'Final coastal stroll', 'Departure'],
        budget: 7000,
      },
    ],
  },

  Bali: {
    image: '/assets/destinations/bali.webp',
    weather: 'Tropical warmth with lush green landscapes and ocean air.',
    accommodation: {
      standard: 'Boutique jungle or beach resort',
      premium: 'Private infinity-pool villa',
    },
    dining: {
      standard: 'Balinese cafés and modern island restaurants',
      premium: 'Private dining and curated tasting experiences',
    },
    days: [
      {
        title: 'Welcome to Bali',
        description: 'Arrive gently and settle into the island atmosphere.',
        activities: ['Check into your resort', 'Poolside afternoon', 'Sunset dinner'],
        budget: 7000,
      },
      {
        title: 'Ubud & the Jungle',
        description:
          'Explore Bali’s cultural heart surrounded by rice fields and tropical greenery.',
        activities: ['Tegallalang rice terraces', 'Ubud market', 'Traditional Balinese dinner'],
        budget: 8500,
      },
      {
        title: 'Island Adventure',
        description: 'A day for waterfalls, hidden paths, and Bali’s wild side.',
        activities: ['Waterfall visit', 'Jungle exploration', 'Local lunch'],
        budget: 9500,
      },
      {
        title: 'The Wellness Day',
        description: 'Slow everything down with a deeply restorative island day.',
        activities: ['Yoga session', 'Balinese spa treatment', 'Healthy dinner'],
        budget: 8000,
      },
      {
        title: 'Beach Club Afternoon',
        description: 'Move toward the coast for a relaxed afternoon by the water.',
        activities: ['Beach morning', 'Beach club', 'Sunset drinks'],
        budget: 9000,
      },
      {
        title: 'Temple & Culture',
        description: 'Experience Bali through its temples, traditions, and ceremonies.',
        activities: ['Temple visit', 'Cultural experience', 'Traditional dinner'],
        budget: 7500,
      },
      {
        title: 'Island Goodbye',
        description: 'One final slow morning before leaving Bali.',
        activities: ['Breakfast by the pool', 'Final walk', 'Departure'],
        budget: 6500,
      },
    ],
  },

  Iceland: {
    image: '/assets/destinations/iceland.webp',
    weather: 'Cool, crisp air with dramatic landscapes and changing skies.',
    accommodation: {
      standard: 'Design-led countryside lodge',
      premium: 'Luxury glass cabin with panoramic views',
    },
    dining: {
      standard: 'Modern Icelandic restaurants',
      premium: 'Chef-led tasting menus and private dining',
    },
    days: [
      {
        title: 'Into the Icelandic Landscape',
        description: 'Begin surrounded by volcanic landscapes, open skies, and dramatic scenery.',
        activities: ['Arrival', 'Countryside drive', 'Local dinner'],
        budget: 12000,
      },
      {
        title: 'The Golden Circle',
        description: 'Discover some of Iceland’s most iconic natural landmarks.',
        activities: ['Þingvellir National Park', 'Geysir', 'Gullfoss waterfall'],
        budget: 13000,
      },
      {
        title: 'Black Sand & Sea',
        description: 'Head toward Iceland’s wild southern coast.',
        activities: ['Black sand beach', 'Coastal cliffs', 'Waterfall stop'],
        budget: 14000,
      },
      {
        title: 'Glacier Country',
        description: 'A day immersed in glaciers, ice, and enormous landscapes.',
        activities: ['Glacier viewpoint', 'Ice lagoon', 'Scenic drive'],
        budget: 16000,
      },
      {
        title: 'Northern Wilderness',
        description: 'Leave the crowds behind and explore quieter Iceland.',
        activities: ['Mountain drive', 'Remote viewpoints', 'Local dinner'],
        budget: 12000,
      },
      {
        title: 'The Blue Lagoon',
        description: 'Slow down in geothermal waters surrounded by volcanic scenery.',
        activities: ['Geothermal spa', 'Relaxation', 'Dinner experience'],
        budget: 13000,
      },
      {
        title: 'One Last Horizon',
        description: 'A final scenic morning before your Iceland journey ends.',
        activities: ['Breakfast', 'Final landscape walk', 'Departure'],
        budget: 9000,
      },
    ],
  },

  Kyoto: {
    image: '/assets/destinations/kyoto.webp',
    weather: 'Seasonal, serene, and often beautifully crisp in the mornings.',
    accommodation: {
      standard: 'Traditional Kyoto boutique stay',
      premium: 'Private luxury machiya or refined ryokan',
    },
    dining: {
      standard: 'Izakaya, ramen, sushi, and local Kyoto dining',
      premium: 'Kaiseki dining and private chef experiences',
    },
    days: [
      {
        title: 'Arrive in Kyoto',
        description: 'Begin quietly with lantern-lit streets and your first taste of Kyoto.',
        activities: ['Check into your stay', 'Gion evening walk', 'Traditional Japanese dinner'],
        budget: 9000,
      },
      {
        title: 'Temples & Tea',
        description: 'Discover Kyoto through its temples, gardens, and centuries-old traditions.',
        activities: ['Kinkaku-ji', 'Tea ceremony', 'Philosopher’s Path'],
        budget: 10000,
      },
      {
        title: 'Arashiyama',
        description: 'A day among bamboo forests, temples, and mountain scenery.',
        activities: ['Arashiyama bamboo grove', 'Tenryu-ji', 'Riverside lunch'],
        budget: 9500,
      },
      {
        title: 'Kyoto Through Food',
        description: 'Spend the day discovering the city through its extraordinary food culture.',
        activities: ['Nishiki Market', 'Local food tasting', 'Evening izakaya'],
        budget: 11000,
      },
      {
        title: 'Fushimi Inari',
        description: 'Walk beneath thousands of torii gates and discover quieter mountain paths.',
        activities: ['Fushimi Inari', 'Mountain walk', 'Traditional dinner'],
        budget: 8500,
      },
      {
        title: 'A Slower Kyoto',
        description: 'A deliberately unhurried day of gardens, craft, and quiet streets.',
        activities: ['Japanese garden', 'Local craft shopping', 'Kaiseki-inspired dinner'],
        budget: 10500,
      },
      {
        title: 'Goodbye, Kyoto',
        description: 'One final peaceful morning before departure.',
        activities: ['Morning temple visit', 'Final coffee', 'Departure'],
        budget: 7000,
      },
    ],
  },

  Maldives: {
    image: '/assets/destinations/maldives.webp',
    weather: 'Warm tropical temperatures, turquoise water, and soft ocean breezes.',
    accommodation: {
      standard: 'Luxury island resort',
      premium: 'Private overwater villa with dedicated service',
    },
    dining: {
      standard: 'Resort dining and seafood restaurants',
      premium: 'Private beach dinners and chef-led menus',
    },
    days: [
      {
        title: 'Arrive in Paradise',
        description: 'Let the island slow you down from the moment you arrive.',
        activities: ['Resort check-in', 'Ocean swim', 'Sunset dinner'],
        budget: 15000,
      },
      {
        title: 'Blue Water Morning',
        description: 'A relaxed day dedicated to the ocean.',
        activities: ['Snorkelling', 'Beach afternoon', 'Sunset cruise'],
        budget: 17000,
      },
      {
        title: 'Underwater World',
        description: 'Discover the reef and marine life beneath the surface.',
        activities: ['Guided snorkelling', 'Diving option', 'Seafood dinner'],
        budget: 18000,
      },
      {
        title: 'Pure Relaxation',
        description: 'A complete reset with no schedule except the tide.',
        activities: ['Breakfast in villa', 'Spa treatment', 'Private beach time'],
        budget: 16000,
      },
      {
        title: 'Island Exploration',
        description: 'See another side of island life beyond the resort.',
        activities: ['Local island visit', 'Traditional lunch', 'Sunset photography'],
        budget: 15000,
      },
      {
        title: 'Private Ocean Day',
        description: 'A private boat experience across the lagoon.',
        activities: ['Private boat', 'Dolphin spotting', 'Picnic lunch'],
        budget: 20000,
      },
      {
        title: 'One Last Sunrise',
        description: 'Finish with one final morning beside impossibly blue water.',
        activities: ['Sunrise breakfast', 'Final swim', 'Departure'],
        budget: 13000,
      },
    ],
  },

  Morocco: {
    image: '/assets/destinations/morocco.webp',
    weather: 'Warm days, cool evenings, and rich desert landscapes.',
    accommodation: {
      standard: 'Elegant riad',
      premium: 'Private luxury riad with courtyard service',
    },
    dining: {
      standard: 'Moroccan restaurants and market food',
      premium: 'Private rooftop dining and curated Moroccan menus',
    },
    days: [
      {
        title: 'Welcome to Marrakech',
        description: 'Enter the medina and let the colours, sounds, and scents take over.',
        activities: ['Riad check-in', 'Medina walk', 'Rooftop dinner'],
        budget: 7500,
      },
      {
        title: 'The Medina',
        description: 'Lose yourself among souks, courtyards, and hidden workshops.',
        activities: ['Souk exploration', 'Artisan workshops', 'Traditional lunch'],
        budget: 8000,
      },
      {
        title: 'Atlas Mountains',
        description: 'Escape the city for mountain landscapes and Berber villages.',
        activities: ['Atlas Mountains', 'Village visit', 'Mountain lunch'],
        budget: 10000,
      },
      {
        title: 'Moroccan Flavours',
        description: 'A full day dedicated to the country’s extraordinary food culture.',
        activities: ['Cooking experience', 'Spice market', 'Moroccan tasting dinner'],
        budget: 8500,
      },
      {
        title: 'Desert Horizons',
        description: 'Head toward dramatic desert landscapes and golden horizons.',
        activities: ['Scenic drive', 'Desert experience', 'Sunset'],
        budget: 12000,
      },
      {
        title: 'Slow Marrakech',
        description: 'A slower day for hammams, gardens, and beautiful details.',
        activities: ['Majorelle Garden', 'Hammam', 'Leisurely dinner'],
        budget: 9000,
      },
      {
        title: 'Until Next Time',
        description: 'One final morning in the medina before departure.',
        activities: ['Breakfast', 'Final shopping', 'Departure'],
        budget: 6500,
      },
    ],
  },

  Paris: {
    image: '/assets/destinations/paris.webp',
    weather: 'Elegant seasonal weather with cool mornings and golden afternoons.',
    accommodation: {
      standard: 'Parisian boutique hotel',
      premium: 'Luxury rive gauche hotel or private suite',
    },
    dining: {
      standard: 'Classic cafés, bistros, and neighbourhood restaurants',
      premium: 'Michelin-starred dining and private culinary experiences',
    },
    days: [
      {
        title: 'Bonjour, Paris',
        description:
          'Begin with a slow walk through beautiful streets and your first Parisian evening.',
        activities: ['Hotel check-in', 'Seine walk', 'French dinner'],
        budget: 11000,
      },
      {
        title: 'Classic Paris',
        description: 'See the icons while leaving enough time to simply wander.',
        activities: ['Louvre', 'Tuileries Garden', 'Café afternoon'],
        budget: 12000,
      },
      {
        title: 'Montmartre',
        description: 'Explore Paris through art, narrow streets, and beautiful viewpoints.',
        activities: ['Montmartre', 'Sacré-Cœur', 'Local bistro'],
        budget: 9500,
      },
      {
        title: 'Parisian Table',
        description: 'Let food become the centre of the day.',
        activities: ['French bakery breakfast', 'Market visit', 'Fine dining'],
        budget: 14000,
      },
      {
        title: 'The Art of Wandering',
        description: 'A day designed around neighbourhoods, galleries, and small discoveries.',
        activities: ['Le Marais', 'Gallery visit', 'Wine bar'],
        budget: 10000,
      },
      {
        title: 'Golden Paris',
        description: 'See the city at its most cinematic.',
        activities: ['Eiffel Tower', 'Seine cruise', 'Sunset dinner'],
        budget: 13000,
      },
      {
        title: 'Au Revoir',
        description: 'One final coffee and one final walk before leaving Paris.',
        activities: ['Breakfast', 'Final neighbourhood walk', 'Departure'],
        budget: 8000,
      },
    ],
  },
};
