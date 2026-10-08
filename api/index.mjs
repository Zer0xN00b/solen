// Vercel serverless entry — a thin wrapper, not a second server.
//
// WHY THIS FILE EXISTS
//
// Locally and in Docker this app boots from backend/src/server.ts: an
// http.createServer that listen()s on a port. Serverless platforms have
// no long-lived process to listen — instead Vercel imports a module and
// routes requests to it. That module lives at the repo root as api/index.mjs
// (.mjs because the root package has no "type": "module", so a .js file there
// would be parsed as CommonJS and the top-level await below would fail),
// not inside backend/, because Vercel resolves serverless entry points
// relative to the project root (vercel.json sits there too).
//
// WHY ESM WITH A DYNAMIC IMPORT (not require)
//
// The backend graph contains top-level await (database/db.ts issues its
// WAL + foreign-key PRAGMAs at import time), and Node refuses to require()
// any graph containing TLA (ERR_REQUIRE_ASYNC_MODULE). A dynamic import()
// is async by design, so it loads the same graph without complaint. The
// default export is the Express app — Vercel's Node runtime accepts an
// exported app instance and routes incoming requests to it. `dist/` is
// produced by the build step before deployment.
//
// COLD STARTS AND MIGRATIONS
//
// server.ts auto-migrates on boot. This entry deliberately does NOT:
// a cold start that runs migrations on every invocation risks concurrent
// writers racing on the __drizzle_migrations table. Run migrations
// explicitly (`npm run db:migrate -w backend` with DB_URL set, or
// drizzle-kit push) as part of the deploy, never per-request.
const { createServerlessApp } = await import(
  '../backend/dist/api/vercel.js'
);

const app = createServerlessApp();

export default app;
