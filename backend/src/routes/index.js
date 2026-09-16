import { Router } from 'express';

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

// Future route modules mount here (scope doc §45):
//   router.use('/auth', authRoutes);
//   router.use('/destinations', destinationRoutes);
//   router.use('/journeys', journeyRoutes);
//   router.use('/weather', weatherRoutes);

export default router;
