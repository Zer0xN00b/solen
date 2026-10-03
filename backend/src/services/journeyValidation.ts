/**
 * Journey input validation (scope doc §48).
 *
 * Hand-rolled rather than pulled from a schema library: the backend has
 * no validation dependency today, and the rules here are small and
 * specific. Kept dependency-free so adding Zod is a deliberate choice,
 * not an accident of this one route.
 *
 * The planner sends a large nested object. We validate the fields the
 * database actually stores as columns (those must be trustworthy for
 * sorting/filtering) and only require the rest of the snapshot to be a
 * plain object — its internals are opaque to the API.
 */

export class ValidationError extends Error {
  status = 400;
}

const MAX_TITLE = 120;
const MAX_DESTINATION = 120;
const MAX_TRAVEL_STYLE = 60;
const MAX_CURRENCY = 8;
const MAX_DURATION_DAYS = 365;
const MAX_BUDGET = 100_000_000;
// Generous ceiling for the JSON snapshot. A 7-day itinerary is a few
// tens of KB; 1 MB leaves headroom without allowing unbounded rows.
const MAX_SNAPSHOT_BYTES = 1_000_000;

function fail(message: string): never {
  throw new ValidationError(message);
}

function requireString(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(`\`${field}\` is required and must be a non-empty string`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    fail(`\`${field}\` must be ${max} characters or fewer`);
  }
  return trimmed;
}

function optionalString(value: unknown, field: string, max: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') fail(`\`${field}\` must be a string when provided`);
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (trimmed.length > max) fail(`\`${field}\` must be ${max} characters or fewer`);
  return trimmed;
}

/** Durations in the planner are small integers, but cap them anyway. */
function requireDuration(value: unknown): number {
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (typeof numeric !== 'number' || !Number.isFinite(numeric)) {
    fail('`duration` must be a number of days');
  }
  const whole = Math.trunc(numeric);
  if (whole < 1 || whole > MAX_DURATION_DAYS) {
    fail(`\`duration\` must be between 1 and ${MAX_DURATION_DAYS} days`);
  }
  return whole;
}

function optionalBudget(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (typeof numeric !== 'number' || !Number.isFinite(numeric)) {
    fail('`budget` must be a number when provided');
  }
  if (numeric < 0 || numeric > MAX_BUDGET) {
    fail(`\`budget\` must be between 0 and ${MAX_BUDGET}`);
  }
  return Math.trunc(numeric);
}

function requireSnapshot(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail('`journey` must be an object');
  }
  const snapshot = value as Record<string, unknown>;
  const bytes = Buffer.byteLength(JSON.stringify(snapshot), 'utf8');
  if (bytes > MAX_SNAPSHOT_BYTES) {
    fail(`\`journey\` is too large (${bytes} bytes, max ${MAX_SNAPSHOT_BYTES})`);
  }
  return snapshot;
}

export interface JourneyInput {
  title: string;
  destination: string;
  duration: number;
  travelStyle: string | null;
  budget: number | null;
  currency: string;
  isPremiumPlus: boolean;
  data: Record<string, unknown>;
}

/**
 * Validates a create/update body.
 *
 * Accepts either shape: `{ journey: {...}, ... }` (what the planner
 * already has in hand) or a flat journey object. The planner currently
 * saves `{ journey, isPremiumPlus, favoriteDays }`, so this maps that
 * directly onto the API without a frontend reshape.
 */
export function parseJourneyInput(body: unknown): JourneyInput {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    fail('Request body must be a JSON object');
  }

  const bodyObj = body as Record<string, unknown>;

  // Two different questions, two different sources:
  //
  // 1. What do we PERSIST? The whole body, either shape. The planner
  //    writes `{ journey, isPremiumPlus, favoriteDays }`, and resume
  //    needs all three back — so favoriteDays must not be dropped just
  //    because it sits outside `journey`.
  // 2. What do we read the promoted COLUMNS from? For the wrapped shape
  //    that is the journey object with envelope fields layered on top as
  //    overrides, since an explicit top-level value beats the snapshot.
  const hasWrapper = typeof bodyObj.journey === 'object' && bodyObj.journey !== null;
  const snapshot = bodyObj.journey as Record<string, unknown> | undefined;

  const source = (
    hasWrapper && snapshot
      ? { ...snapshot, ...omitKey(bodyObj, 'journey') }
      : bodyObj
  ) as Record<string, unknown>;

  const title = optionalString(source.title, 'title', MAX_TITLE) ??
    deriveTitle(source.destination, source.duration);

  return {
    title,
    destination: requireString(source.destination, 'destination', MAX_DESTINATION),
    duration: requireDuration(source.duration),
    travelStyle: optionalString(source.travelStyle, 'travelStyle', MAX_TRAVEL_STYLE),
    budget: optionalBudget(source.budget),
    currency:
      optionalString(source.currency, 'currency', MAX_CURRENCY)?.toUpperCase() ?? 'INR',
    isPremiumPlus: Boolean(source.isPremiumPlus),
    data: requireSnapshot(bodyObj),
  };
}

/** A shallow copy of `body` without one key. */
function omitKey(body: Record<string, unknown>, key: string): Record<string, unknown> {
  const rest: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(body)) {
    if (name !== key) rest[name] = value;
  }
  return rest;
}

function deriveTitle(destination: unknown, duration: unknown): string {
  if (typeof destination !== 'string' || destination.trim() === '') {
    fail('`title` is required when `destination` is absent');
  }
  const days = typeof duration === 'number' && Number.isFinite(duration) ? duration : null;
  return days
    ? `${destination.trim()} — ${days} ${days === 1 ? 'day' : 'days'}`
    : destination.trim();
}
