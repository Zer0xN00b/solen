import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { env } from '../config/env.js';

let db;

/**
 * Lazily opens the SQLite database (scope doc §46).
 * The schema itself is created in Phase 2 — this helper only owns
 * the connection so every model talks to the same instance.
 */
export function getDb() {
  if (!db) {
    fs.mkdirSync(path.dirname(env.dbFile), { recursive: true });
    db = new Database(env.dbFile);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}
