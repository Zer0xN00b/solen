import { Router } from 'express';
import { getSharedJourneyHandler } from '../controllers/journeyController.js';
import destinationRoutes from './destinations.js';
import journeyRoutes from './journeys.js';

const router = Router();

// Liveness probe — used to verify the API is running.
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'solen-api',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Public shared-journey read.
//
// Mounted HERE, not inside journeys.ts, and deliberately NOT behind
// `attachSession`: a shared link must work for someone with no account and no
// cookies at all, which is the whole point of sharing. The controller's
// allowlist serializer is what makes that safe — the session middleware would
// add nothing here and would imply the endpoint is owner-scoped, which it
// is not.
//
// Registered before the journey router so `/shared/:slug` can never be
// swallowed by a future `/shared/:somethingElse` declaration.
router.get('/shared/:slug', getSharedJourneyHandler);

// Journey persistence (scope doc §48) — mounted, works signed-in or
// anonymous. Remaining modules mount alongside it:
//   router.use('/weather', weatherRoutes);
// (Auth lives separately at /api/auth — see app.ts.)
router.use(journeyRoutes);

// Curated destination content (scope doc §7, §10) — public read-only,
// replacing the four duplicated frontend data files.
router.use(destinationRoutes);


export default router;
