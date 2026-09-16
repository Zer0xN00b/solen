# SOLEN Backend — planned

The backend does not exist yet. This folder is reserved for it.

Its purpose (scope doc §43) is to turn SOLEN from an interactive frontend
into a persistent full-stack product: user accounts, authentication,
saved journeys, journey sharing, destination/itinerary data, live weather
and deployment.

## Proposed structure (scope doc §44)

```text
backend/
├── server/          ← app bootstrap & server entry
├── routes/          ← /api/auth, /api/users, /api/destinations,
│                      /api/journeys, /api/itineraries, /api/weather
├── controllers/     ← request handling
├── services/        ← business logic
│                      (frontend/src/engine/* is the seed for these)
├── models/          ← database entities (scope §46)
├── middleware/      ← auth, validation, error handling
├── config/          ← environment configuration
└── database/        ← connection & migrations
```

Proposed stack (scope §44): **Node.js + Express + PostgreSQL + REST**.

## Where the logic comes from

When this backend is built, the existing frontend modules are the starting
point — they are already pure, framework-free code:

| Frontend module                   | Becomes                          |
| --------------------------------- | -------------------------------- |
| `frontend/src/engine/personalization.js` | personalization service   |
| `frontend/src/engine/budget.js`   | budget service                   |
| `frontend/src/engine/journey.js`  | itinerary assembly service       |
| `frontend/src/data/destinations.js` | seed data for destinations table |
| `frontend/src/data/plannerOptions.js` | reference data               |

## Build order (scope §62)

1. Phase 2 — foundation: server, env config, API base, DB config (~1 day)
2. Phase 2 — database schema: users, preferences, destinations, journeys,
   journey days (1–2 days)
3. Phase 3 — authentication + journey CRUD (2–3 days)
4. Phase 4 — dynamic itinerary engine, weather API, route data (3–5 days)
5. Phase 5 — public journey IDs & share URLs (1–2 days)
6. Phase 6 — security, testing, deployment (2–3 days)
