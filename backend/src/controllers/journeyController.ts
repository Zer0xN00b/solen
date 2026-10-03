import type { Request, Response } from 'express';
import { ensureOwnerToken, readOwnerToken } from '../middleware/ownerToken.js';
import {
  claimAnonymousJourneys,
  createJourney,
  deleteJourney,
  getJourney,
  listJourneys,
  updateJourney,
  type Owner,
} from '../models/journeyModel.js';
import { parseJourneyInput } from '../services/journeyValidation.js';

/**
 * Journey endpoints (scope doc §48).
 *
 * All five verbs work for both signed-in and anonymous callers, so public
 * trip planning stays usable without an account (§47). Ownership comes
 * from the session when there is one, otherwise from the owner cookie.
 */

type SessionedRequest = Request & {
  session?: { user: { id: string; email: string; name: string } };
};

/**
 * Resolves the caller's owner scope.
 *
 * `mintCookie` is true only for writes, so a first-time GET never sets a
 * cookie — an anonymous reader that hasn't saved anything shouldn't be
 * handed persistent state as a side effect of browsing.
 */
function resolveOwner(req: SessionedRequest, res: Response, mintCookie: boolean): Owner {
  const userId = req.session?.user?.id ?? null;

  if (userId) {
    return { userId, ownerToken: null };
  }

  return {
    userId: null,
    ownerToken: mintCookie ? ensureOwnerToken(req, res) : readOwnerToken(req),
  };
}

/**
 * Shapes a row for the wire.
 *
 * The `data` column holds the request body exactly as sent — for the
 * planner's `{ journey, isPremiumPlus, favoriteDays }` shape or a flat
 * journey object. It is returned under `data` verbatim rather than being
 * re-nested, so the client can hand it straight back to its resume logic
 * without knowing which shape it used when saving.
 */
function serialize(row: Awaited<ReturnType<typeof getJourney>>) {
  if (!row) return null;

  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(row.data) as Record<string, unknown>;
  } catch {
    // A corrupt snapshot shouldn't 500 the whole list. Serve the
    // column fields so the entry is still identifiable and deletable.
    console.error(`[solen-api] journey ${row.id} has unparseable data`);
  }

  return {
    id: row.id,
    title: row.title,
    destination: row.destination,
    duration: row.duration,
    travelStyle: row.travelStyle,
    budget: row.budget,
    currency: row.currency,
    isPremiumPlus: row.isPremiumPlus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    data,
  };
}

export async function listJourneysHandler(req: Request, res: Response): Promise<void> {
  const typed = req as SessionedRequest;
  const owner = resolveOwner(typed, res, false);
  const rows = await listJourneys(owner);

  res.json({ journeys: rows.map((row) => serialize(row)) });
}

export async function getJourneyHandler(req: Request, res: Response): Promise<void> {
  const typed = req as SessionedRequest;
  const owner = resolveOwner(typed, res, false);
  const row = await getJourney(String(req.params.id), owner);

  if (!row) {
    // 404, not 403 — don't confirm that someone else's journey exists.
    res.status(404).json({ error: 'Journey not found' });
    return;
  }

  res.json({ journey: serialize(row) });
}

export async function createJourneyHandler(req: Request, res: Response): Promise<void> {
  const typed = req as SessionedRequest;
  const input = parseJourneyInput(req.body);
  const owner = resolveOwner(typed, res, true);
  const row = await createJourney(owner, input);

  res.status(201).json({ journey: serialize(row) });
}

export async function updateJourneyHandler(req: Request, res: Response): Promise<void> {
  const typed = req as SessionedRequest;
  const input = parseJourneyInput(req.body);
  const owner = resolveOwner(typed, res, false);
  const row = await updateJourney(String(req.params.id), owner, input);

  if (!row) {
    res.status(404).json({ error: 'Journey not found' });
    return;
  }

  res.json({ journey: serialize(row) });
}

export async function deleteJourneyHandler(req: Request, res: Response): Promise<void> {
  const typed = req as SessionedRequest;
  const owner = resolveOwner(typed, res, false);
  const deleted = await deleteJourney(String(req.params.id), owner);

  if (!deleted) {
    res.status(404).json({ error: 'Journey not found' });
    return;
  }

  res.status(204).send();
}

/**
 * POST /api/journeys/claim
 *
 * Called after sign-in to adopt the anonymous journeys saved in this
 * browser. Idempotent — a second call simply matches nothing.
 */
export async function claimJourneysHandler(req: Request, res: Response): Promise<void> {
  const typed = req as SessionedRequest;
  const userId = typed.session?.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Sign in required' });
    return;
  }

  const ownerToken = readOwnerToken(req);
  // No owner cookie means there is nothing anonymous to claim — a
  // signed-in caller with no prior saves. Succeed with 0 rather than
  // 401, so the frontend can call this unconditionally after sign-in.
  const claimed = ownerToken
    ? await claimAnonymousJourneys(ownerToken, userId)
    : 0;

  res.json({ claimed });
}