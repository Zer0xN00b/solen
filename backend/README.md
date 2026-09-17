# SOLEN Backend

Express 5 + TypeScript + Drizzle ORM + **Better Auth** + SQLite.

Authentication is fully wired (email/password, DB-backed sessions via
httpOnly cookies — no localStorage tokens). Product APIs (destinations,
journeys) are built here in the coming phases.

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

## Configuration

Copy `.env.example` → `.env`. Required variables:

| Variable             | Purpose                                        |
| -------------------- | ---------------------------------------------- |
| `PORT`               | API port (default 4000)                        |
| `DB_FILE`            | SQLite file (default `./data/solen.db`)        |
| `BETTER_AUTH_SECRET` | signs session tokens — generate a long random string |
| `BETTER_AUTH_URL`    | the API's own base URL                         |

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
verification, organizations…) — they add fields/tables. Product tables
(journeys, user_preferences) will be added by hand in the same file and
managed through normal drizzle migrations.

## Why this stack

- **Better Auth** — framework-agnostic, DB-backed revocable sessions,
  httpOnly cookies; social OAuth + email verification are one-line
  plugins later.
- **Drizzle ORM** — typed queries + SQL migrations; the Better Auth
  drizzle adapter supports SQLite and PostgreSQL alike, keeping the
  scope doc's long-term Postgres migration straightforward.
- **SQLite (better-sqlite3)** — zero-setup local database for this
  workspace; schema designed to stay portable.
