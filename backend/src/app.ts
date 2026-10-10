import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth/auth.js';
import { authRateLimit, apiRateLimit } from './middleware/rateLimit.js';
import apiRouter from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { env, backendRoot } from './config/env.js';

/**
 * Default export for Vercel's Express auto-detection.
 *
 * Vercel scans fixed candidate paths (app, index, server, src/app, … —
 * `.mts` included) and bundles the entrypoint to /var/task/app.js, which
 * Node loads WITHOUT consulting backend/package.json "type": "module"
 * (that boundary doesn't survive bundling) — so a `.ts` entry always
 * crashes with `Cannot use import statement outside a module`. The `.mts`
 * extension forces always-ESM output, which is the entire point of this
 * filename. So instead of fighting discovery, this
 * module IS the entrypoint: it builds the serverless-safe app (no
 * boot-time migration — N concurrent cold starts would race on
 * __drizzle_migrations; migrate explicitly at deploy time) and default
 * exports it, which is the shape Vercel's Node runtime routes requests
 * to. Local dev and Docker still boot via server.ts → createApp().
 */
const app = createApp();

export default app;

// Escapes everything RegExp-special EXCEPT '*', which trustedOriginPatterns
// (above) splits on first and turns into '.*' itself.
function escapeRegExp(segment: string): string {
  return segment.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
}

export function createApp() {
  const app = express();

  // Behind a reverse proxy (any real deployment) `req.ip` is the proxy's
  // address unless Express is told to trust the forwarded header — which
  // then makes every visitor look like one client to the rate limiter.
  // TRUST_PROXY is the standard hop count; 'true' trusts one hop.
  if (env.trustProxy) {
    app.set('trust proxy', env.trustProxy);
  }

  const isProduction = env.nodeEnv === 'production';

  // Security headers. Only meaningful once this process is serving the
  // browser; in development it just adds noise to the log.
  if (isProduction) {
    app.use(helmet());
  }

  // CORS. Frontend and backend can be on different origins (e.g. frontend
  // on Vercel, backend on Railway/Render) — single-origin deployment
  // through serveClientBuild() below still works too, where this is simply
  // a no-op match on the one origin in play.
  //
  // Reuses env.trustedOrigins (the same list Better Auth's own CSRF check
  // already validates against), with '*' wildcard support since that list
  // contains entries like 'https://*.e2b.app'.
  //
  // credentials: true is required for the httpOnly session cookie to be
  // sent/received cross-origin at all; it also means origin can never be
  // '*' (the spec forbids combining the two), hence the explicit matcher.
  // Placed before every route, including /api/auth, so the browser's
  // preflight OPTIONS request is answered rather than falling through to
  // a 404 (which has no CORS headers, so the browser blocks the real
  // request before it is ever sent).
  const trustedOriginPatterns = env.trustedOrigins.map(
    (pattern) => new RegExp(`^${pattern.split('*').map(escapeRegExp).join('.*')}$`),
  );

  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header = same-origin request (e.g. curl, a server,
        // or the SPA served by this same process) — always allowed.
        callback(null, !origin || trustedOriginPatterns.some((re) => re.test(origin)));
      },
      credentials: true,
    }),
  );

  // Better Auth BEFORE express.json(): its handler reads the raw request
  // body itself, so the JSON parser must not consume it first.
  //
  // The rate limiter goes in front of it: auth is the expensive, guessable
  // surface (credential stuffing, email enumeration) and this is the only
  // place it is reachable.
  app.use('/api/auth', authRateLimit, toNodeHandler(auth));

  app.use(express.json());

  // A loose ceiling on the content API too — it is public and unauthenticated,
  // so it is the other half of an amplification/abuse surface.
  app.use('/api', apiRateLimit, apiRouter);

  // Production only. In development Vite serves the SPA and proxies /api
  // here, so serving a second copy from this process would just be a stale
  // build sitting next to the live one.
  if (isProduction) {
    serveClientBuild(app);
  }

  // AFTER the SPA fallback, and only reachable by what it declined. This is
  // what keeps an unknown /api/* path a JSON 404 instead of an HTML page the
  // client would try to parse as JSON.
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

/**
 * Serves the built frontend from the same origin as the API.
 *
 * One origin for both is the whole point: it is what lets the httpOnly
 * session cookie keep working with no CORS setup and no token in JS — the
 * same property the Vite dev proxy provides in development. Two origins would
 * mean CORS, a CSRF origin allowlist, and a second deployment to keep in
 * sync, for no benefit here.
 *
 * The catch-all skips /api/* so unknown API paths fall through to the JSON
 * 404 handler, while client routes (/journeys, /auth, /destinations/:slug)
 * return index.html for React Router.
 */
function serveClientBuild(app: express.Express): void {
  // backendRoot is <repo>/backend (env.ts resolves it from its own module
  // location, and it stays correct whether running from src/ or dist/).
  // From there the sibling frontend build is one level up. Deriving this
  // from process.cwd() instead would break whenever the server is started
  // from a different directory — which is exactly what a container does.
  const distDir = path.resolve(backendRoot, '..', 'frontend', 'dist');

  if (!existsSync(path.join(distDir, 'index.html'))) {
    console.warn(
      `[solen-api] No frontend build at ${distDir} — serving API only. Run "npm run build" first.`,
    );
    return;
  }

  // Vite fingerprints source assets (`index-BDnBSupJ.js`) but copies
  // everything under frontend/public/ through UNCHANGED
  // (`/assets/destinations/amalfi.webp`). Those are the same destination
  // images, hero and globe textures this site is built from.
  //
  // Caching both immutably for a year would be a real bug: replace a
  // photo under the same filename, redeploy, and browsers keep serving the
  // old one with no way to bust it. So only fingerprinted names get the
  // long cache; everything else is revalidated.
  const FINGERPRINTED = /-[A-Za-z0-9_-]{8}\.[a-z0-9]+$/i;

  app.use(
    express.static(distDir, {
      index: false,
      setHeaders(res, filePath) {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache');
          return;
        }

        if (FINGERPRINTED.test(path.basename(filePath))) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=3600');
        }
      },
    }),
  );

  // A bare `app.use` rather than `app.get('*')`: Express 5 moved to
  // path-to-regexp v8, where a bare '*' is a syntax error (it now needs a
  // named wildcard such as '*splat'). A middleware with no path pattern
  // sidesteps that entirely, and is what we want anyway — this runs after
  // the API and only for requests that got this far.
  app.use((req, res, next) => {
    // Only GET navigations. A POST to an unknown path is not a client route
    // and must stay a 404 rather than being answered with an HTML page.
    if (req.method !== 'GET') {
      next();
      return;
    }

    // Never let the SPA fallback answer for an API path.
    if (req.path.startsWith('/api/')) {
      next();
      return;
    }

    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(distDir, 'index.html'));
  });

  console.log(`[solen-api] serving frontend build from ${distDir}`);
}
