# SOLEN — Deployment

How to get SOLEN off `localhost` and onto a URL other people can visit.

Written 2026-10-03, when the first deployment setup landed.

---

## 1. The shape of it: one container

SOLEN ships as a **single container** serving both the API and the built
frontend from one origin:

```
browser ──► https://solen.example.com
                 │
                 └──► Express ──┬── /api/*           JSON
                                └── everything else → frontend/dist/index.html
```

That is load-bearing, not tidiness. The session is an **httpOnly cookie**,
deliberately — there is no token in JavaScript. A cookie only "just works"
when page and API share an origin. Splitting them means CORS, a CSRF origin
allowlist, and a second deployment to keep in sync, for nothing.

In development the same property comes from the Vite dev proxy on port 5199.
The container just bakes that arrangement into production.

**What this rules out:** serverless. SQLite needs a persistent writable volume,
so the target must be a container or VM platform — Fly.io, Render, Railway, or
any VPS. Not Vercel/Lambda/Workers.

---

## 2. Running it locally first

Always do this before deploying. It runs the *same image*, so what you verify
here is what ships.

```bash
cp .env.example .env
# Generate a real secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Paste into BETTER_AUTH_SECRET in .env

docker compose up --build
```

Then open <http://localhost:4000>.

| Check | Why |
|---|---|
| `/api/health` returns JSON | container is up, not serving a cached page |
| The homepage loads | SPA is in the image; path resolution worked |
| Sign up / sign in / sign out | httpOnly cookie round trip on one origin |
| `/journeys` reachable from the navbar | client-route fallback works |
| Reload `/destinations/kyoto` | SPA fallback, not a 404 |

---

## 3. Deploying

The image is self-contained; `Dockerfile` is the whole definition.

```bash
docker build -t solen:latest .
docker run -p 4000:4000 \
  -e BETTER_AUTH_SECRET=... \
  -e BETTER_AUTH_URL=https://solen.example.com \
  -e TRUST_PROXY=1 \
  -v solen-data:/app/backend/data \
  solen:latest
```

Put TLS in front of it — the platform's load balancer normally does this.

### Environment that matters in production
---

## 4. The database is the only real state

SQLite lives at `/app/backend/data/solen.db` on the named volume `solen-data`.

- **Migrations run automatically on boot** (`server.ts` calls `migrate()`).
  `backend/drizzle` is baked into the image for exactly this.
- **The container runs as unprivileged `node` (uid 1000).** A host bind mount
  needs matching ownership or the process cannot open the file. The named
  volume in `docker-compose.yml` sidesteps this.
- **One writer.** SQLite does not want two app instances on one file. Scale
  vertically. If you need more, that is the moment to move to Postgres — a
  bigger change than this document covers.
- **Seeding is a separate deliberate step**: `npm run db:seed -w backend`.

---

## 5. What changes when NODE_ENV=production

Three behaviours silently switch on:

| Behaviour | Dev | Prod |
|---|---|---|
| Helmet headers (CSP, HSTS, nosniff…) | off | **on** |
| Rate limits | 1000/60s API, 100 auth | **120/60s API, 10/15min auth (failed only)** |
| Frontend served from `frontend/dist` | off (Vite serves it) | **on** |

The auth limiter is strict on purpose and counts only **failed** attempts, so
signing in normally never spends budget. The API limiter is a loose ceiling
against scripted abuse, not a quota.

---

## 6. Caching, and the trap in it

| Path | `Cache-Control` |
|---|---|
| Fingerprinted bundles (`index-BDnBSupJ.js`) | `max-age=31536000, immutable` |
| `frontend/public/**` images (`amalfi.webp`) | `max-age=3600` |
| `index.html` | `no-cache` |

Only fingerprinted names get the long cache. Everything Vite copies through
from `public/` keeps its filename, so caching those immutably would mean a
replaced photo could never reach anyone — the classic stale-asset deployment
bug. `index.html` must never be cached hard, or a deploy keeps serving the
previous bundle's filenames.

---

## 7. Known gaps

Honest list, not reassurance:

- **The container image has never been built.** The code it runs *has* been
  run in production mode and verified route by route (client routes → HTML,
  `/api/*` → JSON, unknown `/api/*` → JSON 404, cache headers per the table
  above). The `Dockerfile` was written with no Docker available to execute, so
  the build itself is unexercised. Expect to fix something small on the first
  `docker compose up --build` — most likely `better-sqlite3`'s native build.
- **Graceful shutdown is wired but unproven.** `SIGTERM`/`SIGINT` drain
  connections with a 10s backstop. It could not be exercised on Windows, where
  signals are not delivered to another process. It will run on Linux in the
  container, and the first `docker stop` is the real test.
- **No CI.** Builds and typechecks run locally only.
- **No backups.** The volume *is* the database. Anything that would cost you
  data needs a plan before real users arrive.

| Variable | If wrong |
|---|---|
| `BETTER_AUTH_SECRET` | Signs session cookies. Wrong or rotated → everyone signed out. |
| `BETTER_AUTH_URL` | Validated against the browser `Origin`. Mismatch → **sign-in fails with an origin error that does not name the cause.** Must match the URL people type, exactly. |
| `TRUST_PROXY` | Proxy count, usually `1`. Wrong in the lenient direction and the rate limiter sees every visitor as one IP, so one person's burst locks out everyone. |
| `DB_FILE` | Point at the mounted volume. In the container filesystem it is wiped on every rebuild. |