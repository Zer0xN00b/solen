# SOLEN — Luxury Travel Concierge

SOLEN is a luxury travel concierge and personalized trip-planning web
application. It combines destination discovery, editorial destination pages,
an interactive globe, and a multi-step journey planner with traveller
profiles, a budget engine, and weather-aware itineraries.

> Full feature inventory, status and roadmap: see
> [`SOLEN_COMPLETE_SCOPE.md`](./SOLEN_COMPLETE_SCOPE.md).

---

## Quick start

```bash
npm ci               # installs frontend + backend (npm workspaces;
                     # never rewrites package-lock.json, unlike npm install)
npm run dev          # runs BOTH servers: frontend :5173, API :4000
```

Other commands:

```bash
npm run dev:frontend   # Vite dev server only
npm run dev:backend    # Express API only
npm run build          # production build of the frontend
npm run lint           # ESLint for frontend + backend
npm run format         # Prettier across the repo
```

**Stack:** React 19 · Vite · React Router 7 · plain CSS (frontend) —
Express 5 · TypeScript · Drizzle ORM · **Better Auth** · SQLite (backend).
Node **20+** required (see `.nvmrc`).

The frontend dev server proxies `/api/*` to the backend on port 4000,
so frontend code can call relative `/api` URLs with no CORS setup.

---

## Repository layout

```text
solen/
├── README.md                        ← you are here
├── SOLEN_COMPLETE_SCOPE.md          ← complete scope, status & roadmap
├── package.json                     ← npm workspaces (frontend + backend)
├── .nvmrc / .editorconfig           ← Node 20 + shared editor conventions
├── .prettierrc.json / .gitignore
│
├── frontend/                        ← React + Vite application (~85–90% done)
│   ├── index.html
│   ├── vite.config.js               ← dev server + /api → :4000 proxy
│   ├── public/
│   │   └── assets/
│   │       ├── brand/               ← logo
│   │       ├── destinations/        ← 7 destination images
│   │       ├── experiences/         ← 4 experience images
│   │       └── hero/                ← homepage hero
│   └── src/
│       ├── main.jsx                 ← entry point (BrowserRouter)
│       ├── AppRoutes.jsx            ← route table + scroll restore
│       │
│       ├── pages/                   ← one folder per route
│       │   ├── home/                ← /                (LOCKED design)
│       │   ├── destination/         ← /destinations/:slug (LOCKED design)
│       │   └── planner/             ← /planner (UI + state only)
│       │
│       ├── components/              ← reusable UI
│       │   ├── globe/               ← custom CSS globe (SolenGlobe)
│       │   └── navbar/              ← reserved for a future shared navbar
│       │
│       ├── data/                    ← application data (no logic)
│       │   ├── destinations.js      ← itinerary content, 7 destinations
│       │   ├── destinationEditorial.js ← editorial detail-page content
│       │   ├── globeDestinations.js ← globe marker positions
│       │   ├── homeContent.js       ← homepage cards & feeling prompts
│       │   └── plannerOptions.js    ← durations, styles, interests, currencies…
│       │
│       ├── engine/                  ← pure business logic (no React/DOM)
│       │   ├── personalization.js   ← traveller profiles, summary, day ranking
│       │   ├── budget.js            ← cost multipliers & daily estimates
│       │   └── journey.js           ← weather notes & journey assembly
│       │
│       └── styles/                  ← global styles
│           ├── index.css
│           └── responsive.css
│
└── backend/                         ← Express + TypeScript + Better Auth (Phase 2–3 merged)
    ├── .env.example
    ├── drizzle/                     ← generated SQL migrations (committed)
    ├── data/                        ← local SQLite file (git-ignored)
    └── src/
        ├── server.ts / app.ts       ← entry point + app assembly (auto-migrates DB)
        ├── auth/auth.ts             ← Better Auth config (email/password, httpOnly cookies)
        ├── config/env.ts            ← environment access
        ├── database/                ← schema.ts (generated), db.ts, migrate.ts
        ├── routes/                  ← /api routes (health today)
        ├── controllers/  services/  models/   ← product code lands here
        └── middleware/              ← notFound + errorHandler
```

### Why `data/` and `engine/` are separate

Everything in `engine/` is **pure functions** and everything in `data/` is
**plain data** — neither touches React or the DOM. This is deliberate:

- The scope's highest-priority work (scope §50, _Dynamic itinerary engine_)
  is moving this exact logic to the backend. Clean modules make that a
  lift-and-shift instead of a rewrite.
- The planner UI (`pages/planner/TripPlanner.jsx`) is now presentation-only,
  which keeps the locked visual design safe while logic evolves.
- Destination content lives in one place per concern instead of being
  hard-coded across four components, preparing the switch to the
  Destination API (scope §54).

---

## Routes

| Route                 | Component           | Notes                                                |
| --------------------- | ------------------- | ---------------------------------------------------- |
| `/`                   | `HomePage`          | Design LOCKED (scope §5)                             |
| `/destinations/:slug` | `DestinationDetail` | Design LOCKED (scope §7)                             |
| `/planner`            | `TripPlanner`       | Accepts `?destination=`, `?experience=`, `?feeling=` |

---

## Status at a glance

- **Frontend:** ~85–90% — homepage, destination pages, globe and planner are
  done and locked. Remaining: packing list, logistics, Journey Library UI,
  shareable journey view, accessibility & final polish (scope §42).
- **Backend:** not started — foundation, database, auth, persistent journeys,
  itinerary engine, sharing, deployment (scope §43–58).
- **Overall:** ~60–65% of the full-stack product.

Recommended next phases — see scope §62:

1. **Phase 1** — finish the frontend product layer (packing, logistics,
   cost transparency, Journey Library UI, shareable journey UI).
2. **Phase 2** — backend foundation (Node/Express, database, schema).
3. **Phase 3** — accounts + persistent journeys.
4. **Phase 4** — intelligent backend planner (port `src/engine/` + `src/data/`).
5. **Phase 5** — shareable journeys.
6. **Phase 6** — security, testing, deployment.
