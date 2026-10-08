import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { backendRoot, env } from '../config/env.js';
import * as schema from './schema.js';

/**
 * Single shared connection, in one of two modes:
 *
 *   DB_URL unset  → local file (a file: URL at env.dbFile). Development and
 *                   the Docker container run this way; behaviour matches the
 *                   old better-sqlite3 database, WAL included. This is what
 *                   keeps "npm run dev" working with zero configuration.
 *
 *   DB_URL set    → remote libSQL (Turso) authenticated by DB_AUTH_TOKEN.
 *                   No local disk involved, which is what makes the app safe
 *                   on serverless platforms (Vercel functions have a
 *                   read-only, ephemeral filesystem — a file database there
 *                   would crash on boot and lose data between cold starts).
 *
 * The driver is @libsql/client in both modes, so there is exactly one code
 * path and one set of SQL — SQLite dialect either way.
 */
const isRemote = Boolean(env.dbUrl);

if (!isRemote) {
  fs.mkdirSync(path.dirname(env.dbFile), { recursive: true });
}

export const client = createClient(
  isRemote
    ? { url: env.dbUrl, authToken: env.dbAuthToken }
    : { url: pathToFileURL(env.dbFile).href },
);

// File-mode only: WAL for concurrent reads, foreign keys per connection.
// A remote libSQL database manages its own durability and enforces
// references server-side — issuing these against Turso is meaningless.
if (!isRemote) {
  await client.execute('PRAGMA journal_mode = WAL');
  await client.execute('PRAGMA foreign_keys = ON');
}

export const db = drizzle(client, { schema });

/** Folder holding the generated SQL migrations (drizzle-kit output). */
export const migrationsFolder = path.join(backendRoot, 'drizzle');
