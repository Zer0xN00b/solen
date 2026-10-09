/**
 * SOLEN API client.
 *
 * Thin, dependency-free wrapper over the backend. By default every call
 * goes to a relative `/api/...` URL so the Vite dev server proxies it to
 * localhost:4000 (see vite.config.js), keeping frontend and backend on one
 * origin with no CORS setup.
 *
 * When frontend and backend are deployed on DIFFERENT domains (e.g.
 * frontend on Vercel, backend on Railway/Render), set VITE_API_BASE at
 * build time to the backend's full URL, e.g.
 *   VITE_API_BASE=https://solen-api.up.railway.app/api
 * and add the frontend's deployed origin to the backend's
 * TRUSTED_ORIGINS_EXTRA env var, or sign-in will fail with a CORS/origin
 * error.
 *
 * `credentials: 'include'` is required on every request. Without it the
 * session cookie is not attached and the user silently reads as signed
 * out — the single most confusing failure mode in an httpOnly-cookie
 * setup, so it is set centrally here rather than at each call site.
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  // 204 and other empty responses have no JSON to parse.
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(payload?.error || payload?.message || 'Something went wrong', response.status, payload);
  }

  return payload;
}

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

/* ---------------------------------------------------------------- auth */

export const auth = {
  /** Current session, or null when signed out. */
  getSession: () => request('/auth/get-session').catch(() => null),

  signUp: ({ name, email, password }) =>
    request('/auth/sign-up/email', { method: 'POST', body: { name, email, password } }),

  signIn: ({ email, password }) =>
    request('/auth/sign-in/email', { method: 'POST', body: { email, password } }),

  signOut: () => request('/auth/sign-out', { method: 'POST' }),
};

/* ------------------------------------------------------------ journeys */

export const journeys = {
  list: () => request('/journeys'),

  get: (id) => request(`/journeys/${id}`),

  create: (payload) => request('/journeys', { method: 'POST', body: payload }),

  update: (id, payload) => request(`/journeys/${id}`, { method: 'PUT', body: payload }),

  remove: (id) => request(`/journeys/${id}`, { method: 'DELETE' }),

  /**
   * Adopts this browser's anonymous saved journeys for the signed-in
   * account. Safe to call on every sign-in — it matches nothing the
   * second time. Returns how many rows moved.
   */
  claim: () => request('/journeys/claim', { method: 'POST' }),

  /**
   * Publishes a journey and returns its public slug.
   *
   * Idempotent server-side: calling twice returns the same slug rather than
   * burning a URL that has already been sent to someone.
   */
  share: (id) => request(`/journeys/${encodeURIComponent(id)}/share`, { method: 'POST' }),

  /** Revokes sharing. The slug is cleared, so the old URL stops working. */
  unshare: (id) => request(`/journeys/${encodeURIComponent(id)}/share`, { method: 'DELETE' }),
};

/* ------------------------------------------------------------- shared */

/**
 * Public shared-journey read (scope doc §48).
 *
 * Separate from `journeys` because this one is NOT user data and carries no
 * session: a shared link must open for someone with no account and no
 * cookies. It is also the only read on this client that a stranger can make,
 * which is why the server answers it with an allowlist rather than the row.
 */
export const shared = {
  journey: (slug) => request(`/shared/${encodeURIComponent(slug)}`),
};

/* -------------------------------------------------- destination content */

/**
 * Curated destination content — public, read-only, no ownership.
 *
 * Kept separate from `journeys` because these reads are not user data: they
 * are identical for every visitor and never carry a session.
 */
export const content = {
  /** List projection: slug, name, region, image, both descriptions, lat/lng. */
  destinations: () => request('/destinations'),

  /**
   * Every destination at full depth, with day blocks, in one response.
   *
   * Preferred over `destinations()` plus a `destination()` per entry: the
   * shared content cache needs all of them anyway, so the per-slug fan-out
   * was pure overhead on the critical path.
   */
  allDestinations: () => request('/destinations/all'),

  /** Full record plus its curated day blocks. 404s on an unknown slug. */
  destination: (slug) => request(`/destinations/${encodeURIComponent(slug)}`),
};

/* --------------------------------------------------------- live weather */

/**
 * Live conditions proxy (scope doc §52).
 *
 * Resolves to the curated fallback rather than rejecting when the upstream
 * provider is unreachable — see the note in `request` callers. Callers should
 * therefore branch on `isLive`, not on whether the promise settled: a settled
 * result with `isLive: false` is a normal, expected outcome, not an error.
 */
export const weather = {
  /** `{ live, curated, isLive }`. 404s only on an unknown destination slug. */
  destination: (slug) => request(`/weather/${encodeURIComponent(slug)}`),
};
