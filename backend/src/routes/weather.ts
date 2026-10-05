import { Router } from 'express';
import { getWeatherHandler } from '../controllers/weatherController.js';

/**
 * Live weather (scope doc §52).
 *
 * Public, unauthenticated, read-only, and mounted WITHOUT `attachSession` —
 * like `/destinations`, the reading is identical for everyone, so browsing it
 * should not hand a first-time visitor persistent state.
 *
 * It is a separate router rather than another line in `destinations.ts` so the
 * third-party concern (timeouts, caching, fallback) stays in one file. If the
 * provider is ever swapped, or a second provider added as a fallback, the
 * blast radius is this folder.
 */
const router = Router();

router.get('/weather/:slug', getWeatherHandler);

export default router;