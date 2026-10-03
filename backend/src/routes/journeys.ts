import { Router } from 'express';
import {
  claimJourneysHandler,
  createJourneyHandler,
  deleteJourneyHandler,
  getJourneyHandler,
  listJourneysHandler,
  updateJourneyHandler,
} from '../controllers/journeyController.js';
import { attachSession } from '../middleware/requireAuth.js';

// Every journey route is session-optional: a valid session narrows
// ownership to the account, no session falls back to the owner cookie.
const router = Router();

router.use('/journeys', attachSession);
router.post('/journeys/claim', claimJourneysHandler);
router.get('/journeys', listJourneysHandler);
router.post('/journeys', createJourneyHandler);
router.get('/journeys/:id', getJourneyHandler);
router.put('/journeys/:id', updateJourneyHandler);
router.delete('/journeys/:id', deleteJourneyHandler);

export default router;