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

/**
 * Graceful shutdown.
 *
 * Without this, `docker stop` (or any orchestrator's SIGTERM) kills the
 * process immediately: in-flight requests are severed and a journey save can
 * be cut off mid-transaction. better-sqlite3 is synchronous so each statement
 * completes on its own, but a request part-way through a multi-statement
 * sequence is not a safe place to stop.
 *
 * The timeout is a backstop — if connections refuse to drain we exit anyway,
 * because a container that ignores SIGTERM gets SIGKILLed after a grace
 * period regardless, and a slow shutdown is worse than a bounded one.
 */
let isShuttingDown = false;

function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`[solen-api] ${signal} received — draining connections`);

  const forceExit = setTimeout(() => {
    console.warn('[solen-api] drain timed out — forcing exit');
    process.exit(1);
  }, 10_000);

  // Don't let the forceExit timer itself hold the event loop open.
  forceExit.unref();

  server.close((err) => {
    if (err) {
      console.error('[solen-api] error while closing server:', err);
      process.exit(1);
    }

    console.log('[solen-api] closed cleanly');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

