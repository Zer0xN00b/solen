import type { Request, Response } from 'express';
import {
  canonicalizeSlug,
  getDestinationWithDays,
  listDestinations,
  listDestinationsWithDays,
  type DestinationRow,
  type ItineraryDayRow,
} from '../models/destinationModel.js';

/**
 * Public destination reads (scope doc §7, §10).
 *
 * No auth: this is marketing content, identical for every visitor, so there
 * is nothing to scope and no owner cookie is minted. Browsing destinations
 * should not hand a first-time visitor persistent state.
 */

/**
 * The list shape.
 *
 * Deliberately a projection, not the whole row. It carries exactly what the
 * three list consumers need — homepage cards (name, image, cardDescription),
 * the globe (region, lat, lng, heroDescription) and the planner's destination
 * picker (name) — and omits the long-form editorial prose, the accommodation
 * and dining tiers, and the timestamps, which the list never renders.
 */
function toListItem(row: DestinationRow) {
  return {
    slug: row.slug,
    name: row.name,
    region: row.region,
    image: row.image,
    cardDescription: row.cardDescription,
    heroDescription: row.heroDescription,
    lat: row.lat,
    lng: row.lng,
    // The globe's own region label and one-liner, kept separate because they
    // are different strings from `region` / `heroDescription` for several
    // destinations. Serving them here lets the globe move to this API without
    // a visual change.
    globeRegion: row.globeRegion,
    globeDescription: row.globeDescription,
  };
}

/**
 * One day block. `dayIndex` is 0-based (see `productSchema`), so the
 * client-facing day number is `dayIndex + 1` — the planner labels days from
 * 1, and silently shifting every itinerary by a day would be a quiet
 * off-by-one in the generated journey.
 */
function toDay(row: ItineraryDayRow) {
  return {
    dayIndex: row.dayIndex,
    dayNumber: row.dayIndex + 1,
    title: row.title,
    description: row.description,
    activities: row.activities ?? [],
    budget: row.budget,
  };
}

/**
 * The full record plus its day blocks.
 *
 * Shared by the single-destination and the all-destinations handler so the
 * two can never drift: a client that switches between them must not see a
 * field appear in one shape and go missing in the other.
 */
function toDetailItem(row: DestinationRow, days: ItineraryDayRow[]) {
  return {
    ...toListItem(row),
    introTitle: row.introTitle,
    intro: row.intro,
    bestTime: row.bestTime,
    travelStyles: row.travelStyles ?? [],
    experiences: row.experiences ?? [],
    weatherSummary: row.weatherSummary,
    accommodation: {
      standard: row.accommodationStandard,
      premium: row.accommodationPremium,
    },
    dining: {
      standard: row.diningStandard,
      premium: row.diningPremium,
    },
    days: days.map(toDay),
  };
}

export async function listDestinationsHandler(
  _req: Request,
  res: Response,
): Promise<void> {
  const rows = await listDestinations();
  res.json({ destinations: rows.map(toListItem) });
}

/**
 * Every destination at full depth, in one request.
 *
 * The frontend's shared content cache needs all destinations on any page, so
 * the previous list-then-fetch-each pattern cost one request per destination
 * before the first paint could settle. This trades a larger single response
 * for a much shorter critical path; the payload is still well under a
 * megabyte, which is why it beats seven sequential small ones.
 */
export async function listAllDestinationsHandler(
  _req: Request,
  res: Response,
): Promise<void> {
  const rows = await listDestinationsWithDays();
  res.json({ destinations: rows.map(({ destination, days }) => toDetailItem(destination, days)) });
}

export async function getDestinationHandler(req: Request, res: Response): Promise<void> {
  const slug = canonicalizeSlug(String(req.params.slug));

  if (!slug) {
    res.status(404).json({ error: 'Destination not found' });
    return;
  }

  const found = await getDestinationWithDays(slug);

  if (!found) {
    res.status(404).json({ error: 'Destination not found' });
    return;
  }

  res.json({
    destination: toDetailItem(found.destination, found.days),
  });
}
