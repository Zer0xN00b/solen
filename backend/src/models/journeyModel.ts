import crypto from 'node:crypto';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '../database/db.js';
import { journey } from '../database/schema.js';
import type { JourneyInput } from '../services/journeyValidation.js';
import { ValidationError } from '../services/journeyValidation.js';

/**
 * Journey persistence (scope doc §48).
 *
 * Every read and write goes through an ownership predicate. A row is
 * visible when it belongs to the signed-in user OR, for anonymous saves,
 * to the caller's owner-token cookie. There is deliberately no
 * "fetch by id and return it" path — that shape is how IDOR bugs happen.
 */

export type JourneyRow = typeof journey.$inferSelect;

export interface Owner {
  userId: string | null;
  ownerToken: string | null;
}

/** The predicate every journey query must include. */
function ownedBy(owner: Owner) {
  if (owner.userId) {
    // Signed in: only their own rows, including ones they claimed from
    // an anonymous session. Never fall back to ownerToken here or a
    // signed-in user could read a stranger's cookie-scoped row.
    return eq(journey.userId, owner.userId);
  }
  if (owner.ownerToken) {
    return and(isNull(journey.userId), eq(journey.ownerToken, owner.ownerToken));
  }
  // Neither: an ownerless request owns nothing, so match nothing.
  // Expressed as a contradiction rather than an empty list so drizzle
  // still produces a valid statement.
  return and(isNull(journey.userId), eq(journey.id, '__no_owner__'));
}

function toId() {
  return crypto.randomUUID();
}

/** Newest first, so the Journey Library shows the most recent save. */
export async function listJourneys(owner: Owner): Promise<JourneyRow[]> {
  return db
    .select()
    .from(journey)
    .where(ownedBy(owner))
    .orderBy(desc(journey.createdAt));
}

export async function getJourney(id: string, owner: Owner): Promise<JourneyRow | null> {
  const rows = await db
    .select()
    .from(journey)
    .where(and(eq(journey.id, id), ownedBy(owner)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createJourney(
  owner: Owner,
  input: JourneyInput,
): Promise<JourneyRow> {
  const rows = await db
    .insert(journey)
    .values({
      id: toId(),
      // A signed-in save is owned by the account; an anonymous one by the
      // cookie only. Never both, or a later logout would strand rows.
      userId: owner.userId,
      ownerToken: owner.userId ? null : owner.ownerToken,
      title: input.title,
      destination: input.destination,
      duration: input.duration,
      travelStyle: input.travelStyle,
      budget: input.budget,
      currency: input.currency,
      isPremiumPlus: input.isPremiumPlus,
      data: JSON.stringify(input.data),
    })
    .returning();

  const created = rows[0];
  if (!created) {
    throw new Error('Journey insert returned no row');
  }
  return created;
}

export async function updateJourney(
  id: string,
  owner: Owner,
  input: JourneyInput,
): Promise<JourneyRow | null> {
  const existing = await getJourney(id, owner);
  if (!existing) return null;

  const rows = await db
    .update(journey)
    .set({
      title: input.title,
      destination: input.destination,
      duration: input.duration,
      travelStyle: input.travelStyle,
      budget: input.budget,
      currency: input.currency,
      isPremiumPlus: input.isPremiumPlus,
      data: JSON.stringify(input.data),
      updatedAt: new Date(),
    })
    .where(and(eq(journey.id, id), ownedBy(owner)))
    .returning();

  return rows[0] ?? null;
}

export async function deleteJourney(id: string, owner: Owner): Promise<boolean> {
  const existing = await getJourney(id, owner);
  if (!existing) return false;

  await db.delete(journey).where(and(eq(journey.id, id), ownedBy(owner)));
  return true;
}

/**
 * Claims cookie-scoped anonymous rows for a newly signed-in user, so a
 * journey saved before signup stays visible afterwards. Best-effort and
 * idempotent — safe to call on every sign-in.
 */
export async function claimAnonymousJourneys(
  ownerToken: string,
  userId: string,
): Promise<number> {
  if (!ownerToken) return 0;

  // .returning() gives us the rows actually touched, so the caller can
  // report the true count rather than assuming every anonymous row moved.
  const claimed = await db
    .update(journey)
    .set({ userId })
    .where(and(isNull(journey.userId), eq(journey.ownerToken, ownerToken)))
    .returning({ id: journey.id });

  return claimed.length;
}

export { ValidationError };
