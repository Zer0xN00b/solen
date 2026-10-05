/**
 * Live conditions via Open-Meteo (scope doc §52).
 *
 * This is the ONE piece of third-party data in the product, and the whole
 * design follows from that: the provider is an enhancement, never a
 * dependency. Every failure path — timeout, DNS failure, malformed payload,
 * destination with no coordinates — resolves to the curated `weather_summary`
 * that was already serving this role, so the planner can never fail where it
 * previously couldn't. That property is the whole reason this lives behind a
 * cache with a short TTL and an aggressive timeout rather than being fetched
 * inline.
 *
 * No API key: Open-Meteo is free without registration, which is why the
 * descoped engine could never have had a "secret to protect" (scope §50).
 */

const OPEN_METEO_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

/**
 * Hard ceiling on the upstream call.
 *
 * Short on purpose. The caller is a planner render waiting on a decorative
 * snippet; holding the request open to chase a slow upstream would be a worse
 * failure than showing the curated string. Anything slower is unreachable.
 */
const UPSTREAM_TIMEOUT_MS = 4000;

/**
 * How long a successful reading is reused, in ms.
 *
 * Conditions do not change meaningfully in ten minutes, and this is a
 * publicly reachable endpoint on a rate-limited API — so caching is both
 * cheaper and politer.
 */
const CACHE_TTL_MS = 10 * 60 * 1000;

/** WMO weather interpretation codes -> the words we show. */
const WMO_LABELS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Freezing drizzle',
  57: 'Freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Light showers',
  81: 'Showers',
  82: 'Violent showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with hail',
};
interface CacheEntry {
  expiresAt: number;
  reading: LiveReading | null;
}

/**
 * Process-local cache.
 *
 * Deliberately in-memory and not a table. Weather is a regenerable
 * convenience: persisting it would add a migration and a staleness column to
 * store something refetchable in milliseconds, and a restart simply means the
 * next request refetches. A single-process API is what makes this sufficient —
 * a multi-instance deployment would move this to Redis, which is only worth
 * doing if it becomes a real bottleneck.
 */
const cache = new Map<string, CacheEntry>();

/** A reading we actually trust enough to show. */
export interface LiveReading {
  temperatureC: number;
  description: string;
  /** ISO timestamp from the provider, local to the destination. */
  observedAt: string;
  /** Which code produced `description`, for tests and future icons. */
  weatherCode: number;
}

/** What the endpoint answers, live or not. Always carries the fallback. */
export interface WeatherResult {
  live: LiveReading | null;
  /** The curated prose — always present, and the answer when `live` is null. */
  curated: string;
  /** True when `live` is a real reading rather than a fallback. */
  isLive: boolean;
}

export function describeWeatherCode(code: number): string {
  return WMO_LABELS[code] ?? 'Current conditions';
}

export function clearWeatherCache(): void {
  cache.clear();
}

/**
 * Reads current conditions for a coordinate pair.
 *
 * Resolves to `null` rather than throwing for every expected failure. A
 * throwing version would need a try/catch at the only call site anyway, and
 * making "the provider is down" a normal return value keeps the route code a
 * single readable branch.
 */
async function fetchLive(lat: number, lng: number): Promise<LiveReading | null> {
  const url =
    `${OPEN_METEO_ENDPOINT}?latitude=${lat}&longitude=${lng}` +
    '&current=temperature_2m,weather_code&timezone=auto';

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      headers: { accept: 'application/json' },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      current?: { temperature_2m?: unknown; weather_code?: unknown; time?: unknown };
    };

    const temperature = payload?.current?.temperature_2m;
    const code = payload?.current?.weather_code;
    const time = payload?.current?.time;

    // Shape-validate rather than trust. A provider change must degrade to the
    // curated string, never render "undefined°" in the planner.
    if (typeof temperature !== 'number' || typeof code !== 'number') {
      return null;
    }

    return {
      temperatureC: temperature,
      description: describeWeatherCode(code),
      observedAt: typeof time === 'string' ? time : new Date().toISOString(),
      weatherCode: code,
    };
  } catch {
    // Timeout, DNS failure, offline, JSON parse error — all identical here:
    // there is no live reading, and the curated copy covers the gap.
    return null;
  }
}

/**
 * Live conditions for a destination, with the curated prose as fallback.
 *
 * `lat`/`lng` are nullable because the schema allows it (productSchema). A
 * destination seeded without coordinates has no live reading to fetch, so it
 * is a legitimate miss rather than a bug — it falls back immediately without
 * spending a request.
 */
export async function getWeather(
  slug: string,
  lat: number | null,
  lng: number | null,
  curated: string,
): Promise<WeatherResult> {
  if (lat === null || lng === null) {
    return { live: null, curated, isLive: false };
  }

  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = cache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return { live: cached.reading, curated, isLive: cached.reading !== null };
  }

  const reading = await fetchLive(lat, lng);

  // Only successful readings are cached. Caching a failure would turn one
  // slow upstream into ten minutes of stale fallback.
  if (reading) {
    cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, reading });
  }

  return { live: reading, curated, isLive: reading !== null };
}