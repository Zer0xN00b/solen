/**
 * Live-conditions presentation (scope doc §52).
 *
 * Pure functions, no React and no fetch — the same separation the rest of
 * `engine/` keeps, so this is testable without a browser or a network.
 *
 * The governing rule: this decides what to SHOW, never what to claim. A
 * settled response with `isLive: false` is a normal outcome (the provider was
 * unreachable, or the destination has no coordinates), not an error, so every
 * function here returns null for "nothing live to show" rather than throwing
 * or inventing a value. The caller keeps rendering the curated prose it
 * already has.
 */

/**
 * One line of live conditions, e.g. "21°C · Partly cloudy".
 *
 * Returns null unless there is a real reading to describe. In particular it
 * does not fall back to the curated string: that text is already on screen
 * from the destination record, and repeating it beside itself would be noise,
 * not honesty.
 */
export function formatLiveConditions(result) {
  if (!result || !result.isLive || !result.live) return null;

  const { temperatureC, description } = result.live;

  if (typeof temperatureC !== 'number' || !Number.isFinite(temperatureC)) {
    return null;
  }

  const temp = `${Math.round(temperatureC)}°C`;
  return description ? `${temp} · ${description}` : temp;
}

/**
 * The label shown above the reading.
 *
 * "Live" is only ever rendered for an actual live reading. On a fallback the
 * caller should not claim liveness it does not have, so this returns null and
 * the existing WEATHER label stands.
 */
export function liveConditionsLabel(result) {
  return result && result.isLive && result.live ? 'LIVE CONDITIONS' : null;
}