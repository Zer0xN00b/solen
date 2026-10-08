// Vercel serverless entry — a thin wrapper, not a second server.
//
// Lives at backend/api/index.mjs so the services-mode `api` service
// (root: backend/) resolves it relative to its own root.
//
// Locally this app boots from src/server.ts: an http.createServer that
// listen()s on a port. Serverless platforms have no long-lived process
// to listen — instead Vercel imports this module and routes requests to
// it. (.mjs so it always parses as ESM: the top-level await below would
// fail under CommonJS.)
//
// The backend graph contains top-level await (database/db.ts issues its
// WAL + foreign-key PRAGMAs at import time), and Node refuses to
// require() any graph containing TLA (ERR_REQUIRE_ASYNC_MODULE). A
// dynamic import() is async by design, so it loads the same graph
// without complaint. The default export is the Express app — Vercel's
// Node runtime accepts an exported app instance and routes incoming
// requests to it.
//
// `dist/` is produced by the api service's buildCommand (tsc) before
// deployment: src/api/vercel.ts compiles to dist/api/vercel.js, a
// sibling of this file's parent (api/ → ../dist/api/vercel.js).
//
// This entry deliberately does NOT run migrations (server.ts does on
// long-lived hosts). N concurrent cold starts would race on the
// __drizzle_migrations table — migrate explicitly at deploy time:
//   DB_URL=… DB_AUTH_TOKEN=… npm run db:migrate -w backend
const { createServerlessApp } = await import(
  '../dist/api/vercel.js'
);

const app = createServerlessApp();

export default app;
