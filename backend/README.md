# SOLEN Backend

Express 5 + TypeScript + Drizzle ORM + **Better Auth** + SQLite.

Authentication is fully wired (email/password, DB-backed sessions via
httpOnly cookies — no localStorage tokens). The journeys API (scope §48)
is live and works both signed-in and anonymously. The destinations API is
built in a later phase.

## Commands

```bash
npm run dev              # from repo root: frontend + backend together
npm run dev -w backend   # backend only
npm run lint -w backend  # ESLint (TS-aware)
npm run db:generate -w backend   # after editing schema.ts → new SQL migration
npm run db:migrate -w backend    # apply migrations manually (server also auto-applies on boot)
```

Server: http://localhost:4000
- Health: `GET /api/health`
- Auth: `/api/auth/*` (sign-up/email, sign-in/email, sign-out, get-session, …)
- Journeys: `/api/journeys` (see below)

## Journeys API (scope §48)

```text
POST   /api/journeys          create (signed-in or anonymous)
GET    /api/journeys          list, newest first
GET    /api/journeys/:id      fetch one
PUT    /api/journeys/:id      replace
DELETE /api/journeys/:id      delete (204)
POST   /api/journeys/claim    adopt this browser's anonymous saves (auth only)
```

**Ownership.** A valid session scopes every row to that account. Without
one, rows are scoped to a random `solen_owner` httpOnly cookie, so a
browser still gets private storage without an account — which §47
requires. A non-owner gets `404`, never `403`, on read/write/delete, so
the API does not confirm that someone else's journey exists.

**Request body.** Either a flat journey object, or the planner's existing
`{ journey, isPremiumPlus, favoriteDays }` envelope. The whole body is
stored verbatim in the `data` column and returned under `data`, so
save→resume round-trips without the client reshaping anything. Fields
worth filtering on (`title`, `destination`, `duration`, `travelStyle`,
`budget`, `currency`, `isPremiumPlus`) are promoted to real columns.

**Calling it from the frontend.** The Vite dev server proxies `/api` →
`localhost:4000`, so use relative URLs and `credentials: 'include'`:

```js
const res = await fetch('/api/journeys', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ journey, isPremiumPlus, favoriteDays }),
});
```

## Configuration

Copy `.env.example` → `.env`. Required variables:

| Variable             | Purpose                                        |
| -------------------- | ---------------------------------------------- |
| `PORT`               | API port (default 4000)                        |
| `DB_FILE`            | SQLite file (default `./data/solen.db`)        |
| `BETTER_AUTH_SECRET` | signs session tokens — generate a long random string |
| `BETTER_AUTH_URL`    | the API's own base URL                         |
| `FRONTEND_PORT`      | frontend dev port, default `5199` — **must match** the port pinned in `frontend/vite.config.js`, or sign-in fails with a CSRF origin error |
| `TRUSTED_ORIGINS_EXTRA` | comma-separated extra origins, if you need any |

## Structure (scope doc §44)

```text
backend/
├── .env.example
├── drizzle/               ← generated SQL migrations (committed)
├── data/                  ← local SQLite file (git-ignored)
└── src/
    ├── server.ts          ← entry: auto-migrates DB, starts HTTP server
    ├── app.ts             ← express assembly (auth handler → json → routes)
    ├── auth/
    │   └── auth.ts        ← Better Auth config (email/password, 30-day sessions)
    ├── config/env.ts      ← typed environment access
    ├── database/
    │   ├── schema.ts      ← Drizzle schema (GENERATED — see below)
    │   ├── db.ts          ← shared SQLite connection + drizzle instance
    │   └── migrate.ts     ← standalone migration runner
    ├── routes/            ← /api routes (health today; journeys next)
    ├── controllers/  services/  models/   ← product code lands here
    └── middleware/        ← notFound + errorHandler
```

## The auth schema is generated, not hand-written

`src/database/schema.ts` contains the Better Auth tables (`user`,
`session`, `account`, `verification`) and is produced by:

```bash
npm run auth:generate-schema -w backend
```

Re-run it only after enabling new Better Auth plugins (OAuth, email
verification, organizations…) — they add fields/tables.

⚠️ **The generator rewrites the whole file and will delete the hand-written
`journey` table.** The file is deliberately split into two zones —
generated auth tables, then a `JOURNEY ZONE` of hand-written product code.
Copy the journey section out before regenerating and paste it back after.
Product tables (journeys, user_preferences) are added by hand below that
marker and managed through normal drizzle migrations.

## Why this stack

- **Better Auth** — framework-agnostic, DB-backed revocable sessions,
  httpOnly cookies; social OAuth + email verification are one-line
  plugins later.
- **Drizzle ORM** — typed queries + SQL migrations; the Better Auth
  drizzle adapter supports SQLite and PostgreSQL alike, keeping the
  scope doc's long-term Postgres migration straightforward.
- **SQLite (better-sqlite3)** — zero-setup local database for this
  workspace; schema designed to stay portable.
