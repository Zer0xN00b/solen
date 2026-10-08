/**
 * Single read path for destination content (scope doc §7, §10).
 *
 * Components must not import the raw JS data files. They import this
 * module, which serves the same shapes from whichever source is available.
 *
 * WHY THE CACHE IS SEEDED FROM THE JS FILES
 *
 * The obvious design — `await` the API, render when it lands — would put a
 * loading state in front of two locked pages and change their first paint.
 * That is exactly the visual regression this migration exists to avoid.
 *
 * So the cache starts populated from the JS files and is replaced by the API
 * response when (and only when) the API answers. Every consumer therefore
 * renders correct, complete content on the first frame whether or not the API
 * is running. When the API and the JS are in sync — which the seed's
 * field-by-field verification gate enforces — swapping the source is
 * unobservable. The fallback is not a degraded path, it is the initial value.
 *
 * WHY NO localStorage FALLBACK
 *
 * Unlike saved journeys, this content ships with the bundle, so it is
 * already available offline. Caching a bundled constant in localStorage
 * would only add a staleness failure mode.
 *
 * The JS files stay in place until the whole migration is proven. Removing
 * them is a separate, deliberate decision.
 */

import { content } from '../api/client.js';
import {
  destinations as fallbackHomeDestinations,
  experiences as fallbackExperiences,
  feelings as fallbackFeelings,
} from './homeContent.js';
import { destinationEditorial as fallbackEditorial } from './destinationEditorial.js';
import { itineraryData as fallbackItinerary } from './destinations.js';
import { globeDestinations as fallbackGlobe } from './globeDestinations.js';

/**
 * Finds the canonical route slug for a display name, using the editorial file
 * as the lookup table. Falls back to a naive slugify only if the name is
 * genuinely absent, so a card can never render an empty href.
 */
function slugForName(editorial, name) {
  for (const [slug, record] of Object.entries(editorial)) {
    if (record.name === name) return slug;
  }
  return name.toLowerCase().replace(/\s+/g, '-');
}

/** The shapes consumers read, seeded from the JS files. */
const cache = {
  itinerary: fallbackItinerary,
  editorial: fallbackEditorial,
  // The bundled cards have no `slug` — `homeContent.js` is `{name, image,
  // description}`. Taken from the editorial file, which IS keyed by the
  // canonical route slug, rather than by re-deriving a slug from the name at
  // a call site. Without this the cards would link to `/destinations/
  // undefined` until the API answered, on the most locked page there is.
  homeDestinations: fallbackHomeDestinations.map((card) => ({
    ...card,
    slug: slugForName(fallbackEditorial, card.name),
  })),
  globe: fallbackGlobe,
  experiences: fallbackExperiences,
  feelings: fallbackFeelings,
};

/** Where the current values came from — surfaced for diagnosis, not UI. */
let source = 'bundled';

/**
 * Bumped whenever the cache is replaced. Exposed through `subscribe` so a
 * component can re-render when the API lands.
 *
 * Without this, a component that reads the cache during render would keep
 * showing the bundled values forever: replacing a module variable does not
 * make React re-render anything on its own. That is the whole reason the
 * module cannot be a silent import-time side effect.
 */
let version = 0;

const listeners = new Set();

/** Subscribe to cache replacements. Returns an unsubscribe function. */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  version += 1;
  for (const listener of listeners) listener(version);
}

let loaded = null;

/** True once a `loadDestinationContent()` call has resolved, either way. */
let settled = false;

function toItinerary(detail) {
  return {
    image: detail.image,
    weather: detail.weatherSummary,
    accommodation: detail.accommodation,
    dining: detail.dining,
    // The API returns both `dayIndex` (0-based) and `dayNumber` (1-based);
    // the planner's own day blocks are 0-indexed and unnumbered, so drop the
    // display-only field rather than letting it leak into a re-save.
    days: detail.days.map(({ dayNumber: _dayNumber, dayIndex: _dayIndex, ...rest }) => rest),
  };
}

function toEditorial(detail) {
  return {
    name: detail.name,
    region: detail.region,
    image: detail.image,
    description: detail.heroDescription,
    introTitle: detail.introTitle,
    intro: detail.intro,
    bestTime: detail.bestTime,
    experiences: detail.experiences,
    styles: detail.travelStyles,
  };
}

/**
 * Legacy slugs still reachable in the URL, mirrored from
 * `destinationModel.ts` (LEGACY_SLUG_ALIASES). That file is the source of
 * truth; this copy exists because the two run in different packages.
 *
 * `globeDestinations.js` ships `amalfi` while the detail route is keyed
 * `amalfi-coast`, so the globe's own click target 404s. Resolving the alias
 * here fixes that the moment the detail page reads from this module. It is a
 * deliberate alias for a URL the product still generates — not the old
 * silent-Kyoto fallback, which served wrong content for ANY unknown slug and
 * was removed on purpose.
 */
const LEGACY_SLUG_ALIASES = {
  amalfi: 'amalfi-coast',
};

/**
 * Fetches everything and replaces the cache.
 *
 * Deduplicated: concurrent callers share one in-flight request rather than
 * each firing its own. Safe to call on every mount.
 *
 * A failure is logged and swallowed. The cache keeps the bundled values, so
 * the site behaves exactly as it did before the API existed.
 */
export function loadDestinationContent() {
  if (loaded) return loaded;

  loaded = (async () => {
    try {
      // ONE request for all content.
      //
      // This used to fetch the list, then fan out one request per destination
      // for its detail — eight round trips on a fresh load, all of which had
      // to land before the cache counted as settled. Every consumer reads from
      // this single cache, so it needs every destination in depth no matter
      // which page asked; the aggregate endpoint returns exactly that at once.
      //
      // The per-slug path is kept as a fallback for a server that predates
      // `/destinations/all`. A 404 there means a version mismatch, not a
      // missing destination, so falling through is correct rather than masking
      // a genuine failure.
      let records;
      try {
        const payload = await content.allDestinations();
        records = payload?.destinations ?? [];
      } catch (err) {
        if (err?.status !== 404) throw err;
        console.warn(
          '[solen] /destinations/all unavailable; falling back to per-destination reads',
        );
        const list = (await content.destinations())?.destinations ?? [];
        records = await Promise.all(
          list.map((item) => content.destination(item.slug)),
        ).then((results) => results.map(({ destination }) => destination));
      }

      if (records.length === 0) {
        // An empty set is not valid content — every locked page depends on
        // there being destinations. Treating it as success would blank the
        // homepage, so it falls through to the bundle like any other failure.
        throw new Error('API returned no destinations');
      }

      const editorial = {};
      const itinerary = {};
      for (const destination of records) {
        editorial[destination.slug] = toEditorial(destination);
        itinerary[destination.name] = toItinerary(destination);
      }

      // Point every legacy slug at its canonical record so a lookup by either
      // name resolves, whichever source the cache is currently holding.
      for (const [legacy, canonical] of Object.entries(LEGACY_SLUG_ALIASES)) {
        if (editorial[canonical]) editorial[legacy] = editorial[canonical];
      }

      // Display name -> API row. Both the cards and the globe are rebuilt by
      // walking their BUNDLED order and pulling values from here, so the two
      // locked layouts keep their exact ordering and their marker/card
      // indices never shift. Declared before either block uses it.
      //
      // Keyed off the full records rather than the old list projection: the
      // aggregate rows are a superset of it (they spread `toListItem` first),
      // so every field the two blocks below read is present.
      const byName = new Map(records.map((row) => [row.name, row]));

      cache.editorial = editorial;
      cache.itinerary = itinerary;
      // Same ordering rule as the globe: iterate the bundled list, take the
      // values from the API. The homepage grid is asymmetric and keys its
      // cards to position (`destination-${index + 1}`), so a change in order
      // would rearrange the locked layout even though every string is right.
      cache.homeDestinations = fallbackHomeDestinations
        .filter((card) => byName.has(card.name))
        .map((card) => {
          const row = byName.get(card.name);
          return {
            name: row.name,
            image: row.image,
            description: row.cardDescription,
            // From the API rather than re-derived from the name. Identical
            // for all seven today, but the slug is canonical data now and
            // should not be recomputed at a call site.
            slug: row.slug,
          };
        });
      // Rebuilt from the API now that `globe_region` / `globe_description`
      // exist. The two dedicated columns carry the globe's own strings, so
      // nothing here is reformatted or borrowed from another field.
      //
      // ORDER IS DELIBERATELY THE BUNDLED ORDER, not the API's (name-sorted).
      // The globe keys its markers by array index (`id: index + 1`) and renders
      // its label and chip rows in array order, so re-sorting would renumber
      // markers and reorder the keyboard/tab sequence on a locked page.
      cache.globe = fallbackGlobe
        .filter((entry) => byName.has(entry.name))
        .map((entry) => {
          const row = byName.get(entry.name);
          return {
            name: row.name,
            // The canonical route slug, not the globe's legacy `amalfi`.
            // This is what fixes the 404 the Amalfi Coast marker used to hit.
            slug: row.slug,
            region: row.globeRegion ?? entry.region,
            description: row.globeDescription ?? entry.description,
            lat: row.lat,
            lng: row.lng,
            image: row.image,
          };
        });
      source = 'api';
    } catch (err) {
      console.warn(
        '[solen] destination content served from the bundle; API unavailable:',
        err?.message,
      );
      source = 'bundled';
    }
    // Notify even on the failure path: the cache contents are unchanged, but
    // a subscriber that also renders `source` should still settle. Harmless
    // either way, and it keeps the contract simple: one notify per load.
    settled = true;
    notify();
    return cache;
  })();

  return loaded;
}

/* ------------------------------------------------------------- accessors */

/** Which source the cache currently holds: 'api' or 'bundled'. */
export function getSource() {
  return source;
}

/**
 * Whether a load has completed, successfully or not.
 *
 * A page that 404s on a missing record must wait for this before deciding.
 * Otherwise a destination that exists in the API but not yet in the bundle
 * would flash the not-found page and then swap in real content — the exact
 * "confidently wrong content on a truthful URL" bug the detail page was
 * rebuilt to avoid.
 */
export function isSettled() {
  return settled;
}

/**
 * Monotonic counter, incremented once per completed load. Useful as a
 * `useMemo` dependency for components that read the cache during render.
 */
export function getVersion() {
  return version;
}

/**
 * Synchronous reads. Always return usable data — these are called from
 * render paths and event handlers, so they cannot be promises.
 */

export function getItinerary() {
  return cache.itinerary;
}

export function getEditorial() {
  return cache.editorial;
}

export function getHomeDestinations() {
  return cache.homeDestinations;
}

export function getGlobeDestinations() {
  return cache.globe;
}

export function getExperiences() {
  return cache.experiences;
}

export function getFeelings() {
  return cache.feelings;
}

/**
 * One editorial record by slug, or undefined.
 *
 * Falls back to the canonical slug, so `/destinations/amalfi` resolves even
 * before the API has loaded and the cache still holds the bundled file.
 */
export function getEditorialBySlug(slug) {
  const canonical = LEGACY_SLUG_ALIASES[slug] ?? slug;
  return cache.editorial[canonical];
}
