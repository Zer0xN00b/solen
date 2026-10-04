import { Router } from 'express';
import {
  claimJourneysHandler,
  createJourneyHandler,
  deleteJourneyHandler,
  getJourneyHandler,
  listJourneysHandler,
  shareJourneyHandler,
  unshareJourneyHandler,
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

// Share verbs sit BEFORE `/journeys/:id`. Express matches in declaration
// order, so `POST /journeys/abc/share` would otherwise be read as an update
// on an id of "abc/share".
router.post('/journeys/:id/share', shareJourneyHandler);
router.delete('/journeys/:id/share', unshareJourneyHandler);

router.get('/journeys/:id', getJourneyHandler);
router.put('/journeys/:id', updateJourneyHandler);
router.delete('/journeys/:id', deleteJourneyHandler);

export default router;