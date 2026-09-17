import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { env } from '../config/env.js';
import { db } from '../database/db.js';
import * as schema from '../database/schema.js';

/**
 * SOLEN authentication (scope doc §47).
 *
 * - Sessions live in the database (revocable), delivered via httpOnly
 *   cookies — no tokens in localStorage, by design.
 * - Email/password for now; social OAuth and email verification are
 *   Better Auth plugins we can switch on later.
 * - Mounted on the Express app at /api/auth (see app.ts).
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema,
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  secret: env.betterAuthSecret,
  baseURL: env.betterAuthUrl,

  // The Vite dev server (and sandbox previews) call the API same-origin
  // through the /api proxy, but browsers still send an Origin header that
  // Better Auth's CSRF check validates against this list.
  trustedOrigins: ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://*.e2b.app'],

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh expiry at most once a day
  },
});
