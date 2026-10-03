import { Router } from 'express';
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

// Journey persistence (scope doc §48) — mounted, works signed-in or
// anonymous. Remaining modules mount alongside it:
//   router.use('/weather', weatherRoutes);
// (Auth lives separately at /api/auth — see app.ts.)
router.use(journeyRoutes);

// Curated destination content (scope doc §7, §10) — public read-only,
// replacing the four duplicated frontend data files.
router.use(destinationRoutes);


export default router;
