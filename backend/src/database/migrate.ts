import { migrate } from 'drizzle-orm/libsql/migrator';
import { db, migrationsFolder } from './db.js';

/**
 * Applies all pending drizzle migrations. Idempotent — applied migrations
 * are tracked in the __drizzle_migrations table, so running this on every
 * server boot is safe (and exactly what server.ts does in development).
 *
 * The libsql migrator is async, hence the top-level await (this file is
 * ESM; package.json declares "type": "module").
 */
await migrate(db, { migrationsFolder });
console.log('[solen-api] database migrations up to date');
