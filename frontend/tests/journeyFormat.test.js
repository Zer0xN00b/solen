import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  describe,
  formatBudget,
  formatDate,
  headingFor,
  isDerivedTitle,
} from '../src/pages/journeys/journeyFormat.js';

// Every assertion here traces to something that actually broke during
// development. The `0` budget and the singular "1 day" cases are both real:
// `budget || null` would swallow the first, and a naive plural would print
// "1 days".

test('formatBudget renders a real API row in the stored currency', () => {
  // A row fetched from the live endpoint during development.
  assert.equal(formatBudget(250000, 'INR'), '₹2,50,000');
});

test('formatBudget never re-converts', () => {
  // The budget is ALREADY expressed in `currency`. Multiplying by the FX
  // rate here would print a number that was never saved. Same input, two
  // currencies, two different stored values — never one converted value.
  assert.equal(formatBudget(1000, 'USD'), '$1,000');
  assert.equal(formatBudget(1000, 'EUR'), '€1,000');
});

test('formatBudget prints a zero budget', () => {
  // A trip budgeted at nothing is a real value. `budget || null` hides it.
  assert.equal(formatBudget(0, 'INR'), '₹0');
});

test('formatBudget rejects non-numbers rather than printing NaN', () => {
  assert.equal(formatBudget(null, 'INR'), null);
  assert.equal(formatBudget(undefined, 'INR'), null);
  assert.equal(formatBudget('250000', 'INR'), null);
  assert.equal(formatBudget(Number.NaN, 'INR'), null);
  assert.equal(formatBudget(Number.POSITIVE_INFINITY, 'INR'), null);
});

test('formatBudget falls back to the bare code for an unknown currency', () => {
  // Honest rather than clever: "XYZ1,000" tells the truth, a missing
  // symbol would look like a bug.
  assert.equal(formatBudget(250000, 'XYZ'), 'XYZ2,50,000');
});

test('formatDate formats a real timestamp', () => {
  assert.equal(formatDate('2026-10-02T04:27:17.602Z'), '2 Oct 2026');
});

test('formatDate returns null rather than "Invalid Date"', () => {
  assert.equal(formatDate(null), null);
  assert.equal(formatDate(undefined), null);
  assert.equal(formatDate(''), null);
  assert.equal(formatDate('not-a-date'), null);
});

test('describe joins duration, style and budget', () => {
  const journey = {
    destination: 'Amalfi Coast',
    duration: 7,
    travelStyle: 'Luxury',
    budget: 250000,
    currency: 'INR',
  };

  assert.deepEqual(describe(journey), ['7 days', 'Luxury', '₹2,50,000']);
});

test('describe uses the singular for a one-day journey', () => {
  assert.deepEqual(describe({ duration: 1, travelStyle: 'Slow Travel' }), ['1 day', 'Slow Travel']);
});

test('describe omits every missing field instead of printing undefined', () => {
  assert.deepEqual(describe({}), []);
  assert.deepEqual(describe({ duration: 3 }), ['3 days']);
});

test('isDerivedTitle recognises the API-generated form', () => {
  // journeyValidation.ts deriveTitle() produces exactly this when the
  // client sends no title.
  assert.equal(isDerivedTitle({ title: 'Maldives — 10 days', destination: 'Maldives' }), true);
  assert.equal(
    isDerivedTitle({ title: 'Amalfi Coast — 7 days', destination: 'Amalfi Coast' }),
    true,
  );
});

test('isDerivedTitle does not swallow a genuine custom title', () => {
  // The regression this guards: matching too loosely would replace a title
  // the user actually chose with a bare destination name.
  assert.equal(isDerivedTitle({ title: 'Kyoto in autumn', destination: 'Kyoto' }), false);
  assert.equal(isDerivedTitle({ title: 'Maldives, but the atolls', destination: 'Maldives' }), false);
});

test('isDerivedTitle handles a title equal to the destination', () => {
  assert.equal(isDerivedTitle({ title: 'Paris', destination: 'Paris' }), true);
});

test('isDerivedTitle is false when there is nothing to compare', () => {
  assert.equal(isDerivedTitle({ destination: 'Kyoto' }), false);
  assert.equal(isDerivedTitle({ title: 'Kyoto' }), false);
  assert.equal(isDerivedTitle({}), false);
});

test('headingFor drops the derived title, keeping the destination', () => {
  // This is the "Maldives — to days" fix: Cormorant's oldstyle figures
  // render "10" as "to", and the destination alone is what the reader wants.
  assert.equal(headingFor({ title: 'Maldives — 10 days', destination: 'Maldives' }), 'Maldives');
});

test('headingFor keeps a custom title', () => {
  assert.equal(headingFor({ title: 'Kyoto in autumn', destination: 'Kyoto' }), 'Kyoto in autumn');
});

test('headingFor never returns undefined', () => {
  // An empty <h2> is worse than a generic one; the row still has an id.
  assert.equal(headingFor({}), 'Untitled journey');
  assert.equal(headingFor({ destination: 'Paris' }), 'Paris');
});