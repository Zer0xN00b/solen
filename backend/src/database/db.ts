import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { backendRoot, env } from '../config/env.js';
import * as schema from './schema.js';

// Single shared SQLite connection (better-sqlite3 is synchronous and
// serialized internally — one connection is the recommended pattern).
fs.mkdirSync(path.dirname(env.dbFile), { recursive: true });

const sqlite = new Database(env.dbFile);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

/** Folder holding the generated SQL migrations (drizzle-kit output). */
export const migrationsFolder = path.join(backendRoot, 'drizzle');
