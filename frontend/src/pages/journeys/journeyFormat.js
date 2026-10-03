import { currencies } from '../../data/plannerOptions.js';

/**
 * Journey row formatting for the library page.
 *
 * Pure functions in their own module rather than inside JourneysPage.jsx,
 * for two reasons: a JSX file that exports non-components breaks Vite's
 * fast refresh, and keeping them separate means they can be exercised
 * against a real API payload without rendering the page.
 */

/**
 * Formats a budget with its currency symbol.
 *
 * The symbol comes from the `currencies` table rather than `Intl`, because
 * the planner stores the budget already expressed in the chosen currency —
 * re-converting here would apply the fake FX rates in plannerOptions.js a
 * second time and print a number that never existed. An unknown code falls
 * back to the bare code, which is still honest.
 *
 * A budget of 0 is a real value (a trip budgeted at nothing) and must
 * print, so the guard is on type rather than truthiness — `budget || null`
 * would silently swallow it.
 */
export function formatBudget(budget, currency) {
  if (typeof budget !== 'number' || !Number.isFinite(budget)) return null;

  const match = currencies.find((c) => c.code === currency);
  const symbol = match ? match.symbol : currency || '';
  const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(budget);

  return symbol ? `${symbol}${formatted}` : formatted;
}

/**
 * A short, human date. Guards against an unparseable value rather than
 * rendering "Invalid Date" — the snapshot is opaque and a bad timestamp
 * shouldn't be able to break the whole list.
 */
export function formatDate(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * True when the API derived the title rather than the client supplying one.
 *
 * `journeyValidation.ts` falls back to `"<destination> — <n> days"` when the
 * request body carries no title. That form adds nothing to a list row, and
 * its digits render badly in the display face (see `headingFor`).
 *
 * Matched structurally rather than by string equality so a client-supplied
 * title that happens to read the same way is still treated as its own.
 */
export function isDerivedTitle(journey) {
  if (!journey.title || !journey.destination) return false;
  if (journey.title === journey.destination) return true;

  return journey.title.startsWith(`${journey.destination} —`);
}

/**
 * The heading for a list row.
 *
 * A derived title is dropped in favour of the destination name alone,
 * because the facts row underneath already states duration, style and budget
 * — in Inter, where the digits are unambiguous. Cormorant Garamond's
 * oldstyle figures render "10" in a way that reads as "to" at this size,
 * which is how "Maldives — 10 days" became "Maldives — to days" on the page.
 * A custom title is kept: it says something the destination doesn't.
 */
export function headingFor(journey) {
  if (isDerivedTitle(journey)) return journey.destination;

  // A row with neither a usable title nor a destination would render an
  // empty <h2>. Falling back keeps the heading legible; the destination is
  // the only other thing this row knows about itself.
  return journey.title || journey.destination || 'Untitled journey';
}

/** Row-level facts, with anything missing simply omitted. */
export function describe(journey) {
  const parts = [];

  if (journey.duration) {
    parts.push(`${journey.duration} ${journey.duration === 1 ? 'day' : 'days'}`);
  }

  if (journey.travelStyle) parts.push(journey.travelStyle);

  const budget = formatBudget(journey.budget, journey.currency);
  if (budget) parts.push(budget);

  return parts;
}