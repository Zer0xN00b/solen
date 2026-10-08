import { createApp } from '../app.js';

/**
 * Serverless-safe Express factory for Vercel (`api/index.mjs` imports the
 * compiled output of this file).
 *
 * Differs from server.ts in exactly one way: no boot-time migration. On a
 * long-lived host (local dev, Docker) running migrations at startup is
 * correct — one process, one writer. On serverless, every cold start is a
 * fresh process, and N concurrent cold starts would race on the
 * __drizzle_migrations table. So here: no migrate() call. Schema changes
 * are applied explicitly at deploy time instead:
 *
 *   DB_URL=… DB_AUTH_TOKEN=… npm run db:migrate -w backend
 *
 * Everything else — routes, auth, rate limits, error handlers — is the
 * same createApp() the long-lived server uses. One assembly, two hosts.
 */
export function createServerlessApp() {
  return createApp();
}
