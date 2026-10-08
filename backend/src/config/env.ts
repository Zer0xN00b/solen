import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

// src/config/env.ts → src/config → src → backend
export const backendRoot = path.dirname(
  path.dirname(path.dirname(fileURLToPath(import.meta.url)))
);

function requireSecret(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[solen-api] Missing ${name}. Copy backend/.env.example to backend/.env and fill it in.`
    );
  }
  return value;
}

const frontendPort = Number(process.env.FRONTEND_PORT) || 5199;

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  dbFile: process.env.DB_FILE
    ? path.resolve(process.cwd(), process.env.DB_FILE)
    : path.join(backendRoot, 'data', 'solen.db'),

  // Remote libSQL (Turso) endpoint. When set, the app talks to it instead
  // of the local file (see database/db.ts) — that is what makes the same
  // codebase deployable to serverless platforms (Vercel), where there is
  // no writable disk. Unset → local file, development unchanged.
  dbUrl: process.env.DB_URL || '',
  // Auth token for the remote endpoint. Required by Turso when DB_URL is set.
  dbAuthToken: process.env.DB_AUTH_TOKEN || '',

  // Better Auth (scope doc §47) — secret signs session tokens, URL is the
  // API's own base URL (the frontend reaches it through the Vite /api proxy).
  betterAuthSecret: requireSecret('BETTER_AUTH_SECRET'),
  betterAuthUrl: process.env.BETTER_AUTH_URL || 'http://localhost:4000',

  // Origins allowed to call the auth endpoints. Better Auth checks the
  // browser's Origin header against this list (CSRF protection), and the
  // browser sends the *frontend* origin even though the request is proxied.
  //
  // FRONTEND_PORT is a single source of truth shared with the pinned port
  // in frontend/vite.config.js — the two must not drift, or sign-in fails
  // with an origin-mismatch error. Override it via .env for a non-default
  // setup; anything extra can be appended as a comma-separated list.
  // Express `trust proxy`. Required behind any reverse proxy: without it
  // `req.ip` is the proxy's address, so the rate limiter would see every
  // visitor as one client (locking everyone out at once) or, set wrongly,
  // could be bypassed by forging X-Forwarded-For.
  //
  // Accepts a hop count ('1'), a boolean ('true'), or nothing. Left unset
  // in development so local IP spoofing can't quietly disable limiting.
  trustProxy: process.env.TRUST_PROXY || '',

  trustedOrigins: [
    `http://localhost:${frontendPort}`,
    `http://127.0.0.1:${frontendPort}`,
    process.env.BETTER_AUTH_URL || 'http://localhost:4000',
    'https://*.e2b.app',
    ...(process.env.TRUSTED_ORIGINS_EXTRA || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ],
};
