import { asc, eq, inArray } from 'drizzle-orm';
import { db } from '../database/db.js';
import { destination, itineraryDay } from '../database/schema.js';

/**
 * Destination reads (scope doc §7, §10).
 *
 * Public marketing content — no ownership predicate and no session, because
 * there is no per-caller data here. This is the deliberate opposite of
 * `journeyModel`: journeys scope every query to the caller, destinations
 * scope to nothing.
 */

export type DestinationRow = typeof destination.$inferSelect;
export type ItineraryDayRow = typeof itineraryDay.$inferSelect;

/**
 * Slugs that are still live in URLs but are not the canonical route slug.
 *
 * `globeDestinations.js` ships `amalfi` while the detail route is keyed
 * `amalfi-coast`, so clicking the Amalfi Coast marker on the globe today
 * lands on the 404 page. The canonical slug comes from
 * `destinationEditorial.js` (it is what `/destinations/:slug` resolves
 * against), so the globe is the side that is wrong.
 *
 * Rather than leave a broken URL or change a locked frontend page mid-migration,
 * the API answers the legacy slug too. The alias is removed once the globe
 * reads its slug from this API.
 */
const LEGACY_SLUG_ALIASES: Record<string, string> = {
  amalfi: 'amalfi-coast',
};

/** Resolves a requested slug to its canonical form, or null if unknown. */
export function canonicalizeSlug(requested: string): string | null {
  const lowered = requested.toLowerCase();
  return LEGACY_SLUG_ALIASES[lowered] ?? lowered;
}

/**
 * Every destination, ordered by name.
 *
 * Name ordering is not arbitrary: it reproduces the order `homeContent.js`
 * presents on the homepage. The other two source files use different orders
 * (globe is globe-first, editorial is Kyoto-first), but those are display
 * concerns the frontend decides, not storage concerns. Callers that need a
 * specific order sort client-side.
 */
export async function listDestinations(): Promise<DestinationRow[]> {
  return db.select().from(destination).orderBy(asc(destination.name));
}

/**
 * One destination with its curated day blocks, in day order.
 *
 * Returns null when the slug is unknown so the controller can 404 — an
 * unknown destination is a broken route, not a default record.
 */
export async function getDestinationWithDays(
  slug: string,
): Promise<{ destination: DestinationRow; days: ItineraryDayRow[] } | null> {
  const rows = await db
    .select()
    .from(destination)
    .where(eq(destination.slug, slug))
    .limit(1);

  const found = rows[0];
  if (!found) return null;

  const days = await db
    .select()
    .from(itineraryDay)
    .where(eq(itineraryDay.destinationId, found.id))
    .orderBy(asc(itineraryDay.dayIndex));

  return { destination: found, days };
}

/**
 * Every destination with its day blocks, in name order.
 *
 * This exists to collapse an N+1 on the client. The frontend's source layer
 * needs the full record for *every* destination on any page — the homepage
 * cards, the globe, the planner picker and the detail page all read from one
 * shared cache, so a page that needs one destination in depth really needs all
 * of them. Fetching `/destinations` plus one `/destinations/:slug` per entry
 * turned a single page load into eight requests before the first paint could
 * settle.
 *
 * Ordered by name, like `listDestinations`, so the ordering contract holds in
 * both shapes. Callers wanting a different order still sort client-side.
 *
 * Day blocks are fetched in one grouped query rather than one query per
 * destination, so this is two round trips total regardless of content size.
 */
export async function listDestinationsWithDays(): Promise<
  Array<{ destination: DestinationRow; days: ItineraryDayRow[] }>
> {
  const rows = await listDestinations();

  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const allDays = await db
    .select()
    .from(itineraryDay)
    .where(inArray(itineraryDay.destinationId, ids))
    .orderBy(asc(itineraryDay.dayIndex));

  // `inArray` returns rows in arbitrary order, so group client-side rather
  // than assuming the result lines up with the destination ordering.
  const daysById = new Map<string, ItineraryDayRow[]>();
  for (const day of allDays) {
    const existing = daysById.get(day.destinationId);
    if (existing) existing.push(day);
    else daysById.set(day.destinationId, [day]);
  }

  return rows.map((row) => ({ destination: row, days: daysById.get(row.id) ?? [] }));
}

/** Convenience for callers that need the day-block count per destination. */
export async function countDaysByDestination(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      destinationId: itineraryDay.destinationId,
      dayIndex: itineraryDay.dayIndex,
    })
    .from(itineraryDay);

  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.destinationId, (counts.get(row.destinationId) ?? 0) + 1);
  }
  return counts;
}
