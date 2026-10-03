import { Router } from 'express';
import {
  getDestinationHandler,
  listAllDestinationsHandler,
  listDestinationsHandler,
} from '../controllers/destinationController.js';

// Public, unauthenticated, read-only. Unlike /journeys there is no
// attachSession and no owner cookie: the content is identical for everyone,
// and browsing should not mint persistent state for a visitor.
const router = Router();

// `/all` is registered BEFORE `/:slug` on purpose. Express matches in
// declaration order, so putting the param route first would swallow this and
// 404 on a slug called "all". The tradeoff is that a destination may never
// use "all" as its slug; the canonicalizeSlug table is where that would be
// noticed, and `all` is not a plausible destination name.
router.get('/destinations', listDestinationsHandler);
router.get('/destinations/all', listAllDestinationsHandler);
router.get('/destinations/:slug', getDestinationHandler);

export default router;
