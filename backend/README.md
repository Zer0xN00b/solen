# SOLEN Backend

Express + SQLite API scaffold (scope doc §43–58). The server runs and
exposes a health endpoint — the product features (schema, auth, journeys,
itinerary engine) are built here in Phases 2–4.

## Commands

```bash
npm run dev     # from the repo root: starts frontend + backend together
# or, backend only:
npm run dev -w backend
npm run lint -w backend
```

Server: http://localhost:4000 · health check: `GET /api/health`

Configuration lives in `.env` (copy `.env.example`). The SQLite file is
created at `data/solen.db` on first real use and is git-ignored.

## Structure (scope doc §44)

```text
backend/
├── .env.example         ← documented environment variables
├── data/                ← local SQLite database file (git-ignored)
└── src/
    ├── server.js        ← entry point: starts the HTTP server
    ├── app.js           ← express app assembly (middleware + routes)
    ├── config/
    │   └── env.js       ← typed environment access
    ├── routes/          ← /api route modules (§45)
    ├── controllers/     ← request handling        (Phase 2+)
    ├── services/        ← business logic          (Phase 4: port of
    │                      frontend/src/engine/*)
    ├── models/          ← database access         (Phase 2–3)
    ├── middleware/      ← notFound, errorHandler  (auth comes in Phase 3)
    └── database/
        └── connection.js ← lazy SQLite connection (schema in Phase 2)
```

## Stack decisions

- **Express 5** — scope §44 suggestion, most beginner-friendly.
- **SQLite via better-sqlite3** — zero-setup local database for this
  workspace; the schema is being designed portable so a later move to
  PostgreSQL (scope's long-term target) stays straightforward.
- **ES Modules** everywhere (`"type": "module"`), matching the frontend.

## Build order (scope §62)

1. Phase 2 — DB schema: users, preferences, destinations, journeys,
   journey days (§46)
2. Phase 3 — authentication + journey CRUD (§47–48)
3. Phase 4 — itinerary engine, weather API, route data (§50–53)
4. Phase 5 — public journey IDs & share URLs (§49)
5. Phase 6 — security, testing, deployment (§55, §57–58)
