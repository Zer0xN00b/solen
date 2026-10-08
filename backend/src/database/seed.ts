/**
 * Seeds the `destination` and `itinerary_day` tables from the frontend data
 * files. Idempotent — safe to run repeatedly.
 *
 *   npm run db:seed -w backend
 *
 * WHY IT IMPORTS THE FRONTEND FILES INSTEAD OF HOLDING ITS OWN COPY
 *
 * The seven destinations and their 49 day blocks are authored by hand in
 * `frontend/src/data/`. Restating them here would create a second source of
 * truth that silently drifts: an editor fixes a typo in the planner and the
 * database keeps serving the old string. So the canonical slug comes from
 * `destinationEditorial.js` — that object is keyed by route slug and drives
 * `/destinations/:slug`; if the seed invented its own slugs the detail pages
 * would 404.
 *
 * The files are loaded through a runtime `import()` of a computed file URL
 * rather than a static `import`. Two reasons: they are `.js` outside this
 * package's `rootDir: "src"` (a static import fails typecheck), and keeping
 * the specifier non-literal is what stops tsc trying to resolve it at all.
 * Both packages declare `"type": "module"`, so Node loads them as ESM.
 *
 * IDEMPOTENCY
 *
 * Ids are deterministic (`destination:<slug>`, `day:<slug>:<index>`) rather
 * than random, so a re-run updates rows in place instead of accumulating
 * duplicates. Day blocks additionally conflict on the
 * (destinationId, dayIndex) unique index, and any day that has since been
 * deleted from the source file is pruned — otherwise a re-seed would leave
 * orphaned day blocks that the planner would still serve.
 */

import path from 'node:path';
import { and, eq, gt } from 'drizzle-orm';
import { pathToFileURL } from 'node:url';
import { db } from './db.js';
import { destination, itineraryDay } from './productSchema.js';
import { backendRoot } from '../config/env.js';

/**
 * Mirrors the shape of the four frontend data files. Declared locally
 * because they are untyped JS outside this package; the seed is the boundary
 * where that data becomes typed, so the expectations live here rather than
 * being spread across the function.
 */
interface SourceDay {
  title: string;
  description: string;
  activities: string[];
  budget: number;
}

interface SourceItinerary {
  image: string;
  weather: string;
  accommodation: { standard: string; premium: string };
  dining: { standard: string; premium: string };
  days: SourceDay[];
}

interface SourceEditorial {
  name: string;
  region: string;
  image: string;
  description: string;
  introTitle: string;
  intro: string;
  bestTime: string;
  experiences: string[];
  styles: string[];
}

interface SourceCard {
  name: string;
  image: string;
  description: string;
}

interface SourceGlobeEntry {
  name: string;
  slug: string;
  region: string;
  description: string;
  lat: number;
  lng: number;
  image: string;
}

const frontendDataDir = path.resolve(
  backendRoot,
  '..',
  'frontend',
  'src',
  'data',
);

async function loadSource<T>(file: string): Promise<T> {
  const specifier = pathToFileURL(path.join(frontendDataDir, file)).href;
  return (await import(specifier)) as T;
}

async function main(): Promise<void> {
  const [itinerary, editorial, home, globe] = await Promise.all([
    loadSource<{ itineraryData: Record<string, SourceItinerary> }>(
      'destinations.js',
    ),
    loadSource<{ destinationEditorial: Record<string, SourceEditorial> }>(
      'destinationEditorial.js',
    ),
    loadSource<{ destinations: SourceCard[] }>('homeContent.js'),
    loadSource<{ globeDestinations: SourceGlobeEntry[] }>(
      'globeDestinations.js',
    ),
  ]);

  // The four files key the same seven destinations three different ways:
  // `destinations.js` and `homeContent.js` use the display name
  // ("Amalfi Coast"), `destinationEditorial.js` uses the route slug
  // ("amalfi-coast"), and `globeDestinations.js` uses its own slug.
  // `destinationEditorial` is the join key because it is what the route
  // resolves against.
  const cardsByName = new Map(home.destinations.map((c) => [c.name, c]));
  const globeByName = new Map(globe.globeDestinations.map((g) => [g.name, g]));

  const slugs = Object.keys(editorial.destinationEditorial);
  if (slugs.length === 0) {
    throw new Error('[seed] destinationEditorial.js produced no destinations');
  }

  let totalDays = 0;
  let totalPruned = 0;

  for (const slug of slugs) {
    const ed = editorial.destinationEditorial[slug];
    if (!ed) continue;

    // Guard against the two files drifting apart: every destination needs
    // itinerary content or the planner has nothing to personalize from.
    const itin = itinerary.itineraryData[ed.name];
    if (!itin) {
      throw new Error(
        `[seed] destinations.js has no entry named "${ed.name}" (slug "${slug}"). ` +
          'Every editorial destination needs an itinerary entry.',
      );
    }

    const card = cardsByName.get(ed.name);
    if (!card) {
      throw new Error(
        `[seed] homeContent.js has no card for "${ed.name}" (slug "${slug}")`,
      );
    }

    // Coordinates are optional — a destination can be seeded before its
    // globe position is known, and the schema keeps them nullable.
    const g = globeByName.get(ed.name);
    if (g && g.slug !== slug) {
      // Not fatal: the globe slug is display-side routing that the frontend
      // migration will reconcile. Worth surfacing, because it means two
      // different URLs exist for one destination today.
      console.warn(
        `[seed] note: globe slug "${g.slug}" != route slug "${slug}" for ${ed.name}`,
      );
    }

    const values = {
      slug,
      name: ed.name,
      region: ed.region,
      image: ed.image,
      // Two different descriptions, both intentional. The card line is the
      // short homepage teaser; the hero line is the detail-page sentence.
      cardDescription: card.description,
      heroDescription: ed.description,
      introTitle: ed.introTitle,
      intro: ed.intro,
      bestTime: ed.bestTime,
      travelStyles: ed.styles,
      experiences: ed.experiences,
      // The globe's own strings, which differ from `region` and from both
      // description columns for 3 of 7 destinations. Stored verbatim so the
      // globe can be served from the API without restyling a locked page.
      globeRegion: g?.region ?? null,
      globeDescription: g?.description ?? null,
      lat: g?.lat ?? null,
      lng: g?.lng ?? null,
      weatherSummary: itin.weather,
      accommodationStandard: itin.accommodation.standard,
      accommodationPremium: itin.accommodation.premium,
      diningStandard: itin.dining.standard,
      diningPremium: itin.dining.premium,
    };

    await db
      .insert(destination)
      .values({ id: `destination:${slug}`, ...values })
      .onConflictDoUpdate({ target: destination.slug, set: values });

    // Read the id back rather than rebuilding the key, so the destination
    // row and its day rows can never disagree about the foreign key.
    const [row] = await db
      .select({ id: destination.id })
      .from(destination)
      .where(eq(destination.slug, slug))
      .limit(1);
    const destinationId = row.id;

    for (const [index, day] of itin.days.entries()) {
      await db
        .insert(itineraryDay)
        .values({
          id: `day:${slug}:${index}`,
          destinationId,
          dayIndex: index,
          title: day.title,
          description: day.description,
          activities: day.activities,
          budget: day.budget,
        })
        .onConflictDoUpdate({
          target: [itineraryDay.destinationId, itineraryDay.dayIndex],
          set: {
            title: day.title,
            description: day.description,
            activities: day.activities,
            budget: day.budget,
          },
        });
    }

    // Prune any day beyond the current source length, which is how a
    // shortened itinerary in destinations.js actually reaches the database.
    const pruned = await db
      .delete(itineraryDay)
      .where(
        and(
          eq(itineraryDay.destinationId, destinationId),
          gt(itineraryDay.dayIndex, itin.days.length - 1),
        ),
      )
      .returning({ id: itineraryDay.id });

    totalDays += itin.days.length;
    totalPruned += pruned.length;

    // Per-destination counts so a partial seed is visible at a glance
    // rather than hidden behind a single total.
    const stored = await db
      .select({ id: itineraryDay.id })
      .from(itineraryDay)
      .where(eq(itineraryDay.destinationId, destinationId));

    const status =
      stored.length === itin.days.length ? 'ok' : `MISMATCH expected ${itin.days.length}`;
    console.log(
      `  ${slug.padEnd(14)} ${String(stored.length).padStart(2)} days  ${status}`,
    );
  }

  const stored = await db.select({ id: destination.id }).from(destination);
  console.log(
    `[seed] ${stored.length} destinations, ${totalDays} itinerary days` +
      (totalPruned ? `, ${totalPruned} stale day rows pruned` : ''),
  );

  if (stored.length !== slugs.length) {
    throw new Error(
      `[seed] expected ${slugs.length} destinations, found ${stored.length}`,
    );
  }
}

main().catch((error: unknown) => {
  console.error('[seed] failed:', error);
  process.exitCode = 1;
});

