import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db, migrationsFolder } from './db.js';

/**
 * Applies all pending drizzle migrations. Idempotent — applied migrations
 * are tracked in the __drizzle_migrations table, so running this on every
 * server boot is safe (and exactly what server.ts does in development).
 */
migrate(db, { migrationsFolder });
console.log('[solen-api] database migrations up to date');
