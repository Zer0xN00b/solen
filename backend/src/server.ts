import http from 'node:http';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { db, migrationsFolder } from './database/db.js';

// Apply pending migrations on boot (idempotent — tracked per migration).
migrate(db, { migrationsFolder });

const app = createApp();
const server = http.createServer(app);

server.listen(env.port, () => {
  console.log(`[solen-api] ${env.nodeEnv} server listening on http://localhost:${env.port}`);
  console.log(`[solen-api] health check: http://localhost:${env.port}/api/health`);
  console.log(`[solen-api] auth endpoints: http://localhost:${env.port}/api/auth/*`);
});
