import type { Request, Response } from 'express';
import { canonicalizeSlug, getDestinationWithDays } from '../models/destinationModel.js';
import { getWeather } from '../services/weatherService.js';

/**
 * Live conditions for one destination (scope doc §52).
 *
 * Public and unauthenticated, like `/destinations`: weather is the same for
 * every visitor and mints no state.
 *
 * Note what this endpoint does NOT do. It does not fail when the provider is
 * down — it answers `200` with `isLive: false` and the curated prose, because
 * a 500 here would turn a decorative enhancement into a broken planner. The
 * client already has the curated string (it came from the destination record),
 * so `curated` is echoed for callers that fetch weather on its own.
 */
export async function getWeatherHandler(req: Request, res: Response): Promise<void> {
  const slug = canonicalizeSlug(String(req.params.slug));

  if (!slug) {
    res.status(404).json({ error: 'Destination not found' });
    return;
  }

  const found = await getDestinationWithDays(slug);

  // Same rule as the destination read: an unknown slug is a 404, not a
  // fallback reading. Inventing weather for a destination that does not exist
  // would be the kind of small lie this API refuses elsewhere.
  if (!found) {
    res.status(404).json({ error: 'Destination not found' });
    return;
  }

  const result = await getWeather(
    slug,
    found.destination.lat,
    found.destination.lng,
    found.destination.weatherSummary ?? '',
  );

  res.json({ weather: { slug, ...result } });
}