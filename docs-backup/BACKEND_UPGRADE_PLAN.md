# SOLEN — BACKEND UPGRADE PLAN

> **Purpose of this file:** survive a context loss. Everything needed to
> resume the backend upgrade is here — current state, what is built, what
> is not, the phase order, the open decisions, and the environment
> gotchas that will otherwise be rediscovered painfully.
>
> Written 2026-09-27. **Updated 2026-10-04: Phase 3 is COMPLETE**
> (API + UI) — see §5.1 and the Phase 3 section.
> Update it whenever state changes.
>
> Companion files: `docs/CHANGELOG.md` (what was done and why),
> `SOLEN_COMPLETE_SCOPE.md` (scope and status, closed 5 Oct 2026),
> `docs/WHERE_WE_ARE.md` (one-page orientation).

---

# 1. TL;DR

**9 scope items. 7 done, 2 descoped.** Everything the original upgrade scope
covered is either complete or has been deliberately descoped. The backend is
done — item 7's weather work shipped 5 Oct 2026 (scope §52).

| # | Item | Status |
|---|------|--------|
| 1 | Backend foundation | ✅ done (pre-existing) |
| 2 | Database | ✅ **done** — destinations + itinerary days in the DB (Phase 1) |
| 3 | Authentication | ✅ done — including **sign-out**, which had no UI at all |
| 4 | Save journeys to DB | ✅ done |
| 5 | Journey API | ✅ done + library UI (Phase 2) |
| 6 | Dynamic itinerary engine | ⛔ **DESCOPED** 5 Oct 2026 — stays in the frontend (scope §50) |
| 7 | External APIs | ✅ weather snippet shipped (§52); maps descoped (§53) |
| 8 | Shareable journeys | ✅ done — API + library/public UI (Phase 3) |
| 9 | Validation + security | ✅ done — rate limiting + helmet + deployment |

**Also landed, outside the numbered scope:** deployment (A4). The app is now
buildable as a container, but **the image has never actually been built** —
Docker was unavailable in this environment. See Phase 6 and
`docs/DEPLOYMENT.md` §7.

**Next: nothing — the scope is closed (5 Oct 2026).** The clean pass ran
as the last item; see `SOLEN_COMPLETE_SCOPE.md` §61. This plan predates the
5 Oct reshape and is kept as history.

---

### Scope items added after the original plan

| Item | Status | Why |
|------|--------|-----|
| Journey library UI | ✅ | Items 4/5 were built and invisible — nothing listed a saved journey |
| One-request content load | ✅ | 8 round trips → 1, via `/api/destinations/all` |
| Sign-out | ✅ | Correctness bug, not a feature: no way out of a signed-in state |
| Rate limiting + helmet | ✅ | The one genuine security gap in item 9 |
| Deployment | ⚠️ config only | Never executed — Docker unavailable |

---

# 2. Current architecture

```
SOLEN/                          npm workspaces
├── frontend/                   React 19 + Vite 8 (port 5199, pinned)
│   └── src/
│       ├── data/               ← 5 data files, see §4
│       ├── engine/             pure, portable generation logic
│       ├── api/                client.js, journeyStorage.js
│       └── pages/              home, planner, destination, auth,
                                 journeys, notFound
└── backend/                    Express 5 + TS + Drizzle + SQLite (port 4000)
    ├── drizzle/                migrations 0000–0004
    ├── data/solen.db           gitignored
    └── src/
        ├── auth/auth.ts        Better Auth config
        ├── config/env.ts       typed env + trustedOrigins
        ├── database/           authSchema.ts, productSchema.ts, db.ts,
        │                       migrate.ts, seed.ts
        ├── middleware/         requireAuth, ownerToken, notFound, errorHandler
        ├── models/             journeyModel.ts, destinationModel.ts
        ├── services/           journeyValidation.ts
        ├── controllers/        journeyController.ts, destinationController.ts
        └── routes/             index.ts, journeys.ts, destinations.ts
```

## Database tables (7)

`user`, `session`, `account`, `verification` — Better Auth, **generated**
`journey`, `destination`, `itinerary_day` — hand-written product tables
(`schema.ts` is split: `authSchema.ts` = generated, `productSchema.ts` = hand-written)

## Endpoints live

```
POST   /api/auth/*          Better Auth (sign-up/sign-in/sign-out/get-session)
GET    /api/health
GET    /api/journeys
POST   /api/journeys
GET    /api/journeys/:id
PUT    /api/journeys/:id
DELETE /api/journeys/:id
POST   /api/journeys/claim
GET    /api/destinations       list (name, slug, image, card description, day count)
GET    /api/destinations/all   ALL destinations + all 49 day blocks, one request
GET    /api/destinations/:slug full record + days (legacy slugs accepted)
```

`/destinations/all` is registered **before** `/destinations/:slug` on purpose —
Express matches in declaration order, so the reverse order would swallow it.

## Auth model (verified — do not re-derive)

- **scrypt** hashing, 16-byte salt + 64-byte hash, stored as
  `saltHex:hashHex` in `account.password` (`provider_id = 'credential'`)
- **httpOnly cookies**, DB-backed sessions, 30-day expiry, 24h `updateAge`
- **No tokens in localStorage** — deliberate. This is why
  `better-auth/react` is NOT used (it would put a token in the JS bundle)
- **Anonymous saves**: `journey.user_id` is NULLABLE; anonymous rows are
  scoped by a random `solen_owner` httpOnly cookie
- **Ownership**: one `ownedBy()` predicate in `journeyModel.ts`; a
  signed-in user NEVER falls back to their cookie token. Non-owners get
  **404, not 403**

---


# 3. ⚠️ KNOWN HAZARD — read before touching the schema

`backend/src/database/schema.ts` is **regenerated wholesale** by:

```bash
npm run auth:generate-schema -w backend
```

Running it **deletes the hand-written `journey` table** (and will delete
`destination` / `itineraryDay` once Phase 1 adds them). The file carries a
warning banner and a `JOURNEY ZONE` marker as a stopgap.

**Phase 1 Step 1 splits the file to close this permanently.** If that step
is ever skipped, treat this section as live.

---

# 4. The finding that shapes Phase 1

**Destination data is duplicated across FOUR files.** The same 7
destinations are described four separate times with partially overlapping
fields.

| File | Lines | Contains |
|---|---|---|
| `data/destinations.js` | 410 | image, weather prose, accommodation/dining tiers, **49 day blocks** |
| `data/destinationEditorial.js` | 124 | region, intro copy, best time, styles, experiences |
| `data/homeContent.js` | 95 | name, image, one-line card description |
| `data/globeDestinations.js` | 69 | **real lat/lng** |
| `data/plannerOptions.js` | 59 | name list, durations, styles, interests, currencies |

**Three conflicting descriptions exist for the same destination.**
Amalfi Coast is:
- homeContent: *"Cliffside mornings & Mediterranean evenings"*
- destinationEditorial: *"Cliffside villages, blue waters, and effortless Italian beauty"*
- destinations.js: no description at all

A naive merge silently picks one and the inconsistency goes unnoticed for
months. **Phase 1 names the columns by surface** (`card_description` vs
`hero_description`) so the ambiguity is impossible at the schema level.

**Good news:** `globeDestinations.js` already has real coordinates (Kyoto 35.0116/135.7681, Bali -8.5069/115.2625, Maldives 4.1755/73.5093, Morocco 31.6295/-7.9811). These are now **real `lat`/`lng` columns** on `destination`, not JSON — Phase 5's weather work queries them directly, so they were promoted at schema time rather than back-filled by a later migration.

**Content scale:** 7 destinations, 49 curated day blocks.

---

# 5. PHASES

## Phase 1 — Content into the database (✅ COMPLETE, 2026-09-30)

Why: item 6 is blocked on it. The DB knew nothing about travel content.

**All 7 steps below are done.** See §5.1 for what actually shipped and the
two carry-overs. The step text is kept for reference — do not re-run it.

### Step 1 — Split `schema.ts` (~30 min, non-negotiable)
- `schema.ts` → generated auth tables only
- `productSchema.ts` → `journey`, `destination`, `itineraryDay`
- `schema/index.ts` re-exports both so `drizzle.config.ts` and the Better
  Auth adapter keep working untouched

### Step 2 — Destination tables (~1h)
```sql
destination (id, slug UNIQUE, name, region, image,
             card_description, hero_description,
             intro_title, intro, best_time,
             travel_styles json, experiences json,
             lat, lng, weather_summary,
             accommodation_standard, accommodation_premium,
             dining_standard, dining_premium,
             created_at, updated_at)

itinerary_day (id, destination_id FK, day_index, title, description,
               activities json, budget, created_at)
               UNIQUE(destination_id, day_index)
```
The unique index also prevents duplicate days on re-seed.

### Step 3 — Seed script (~1.5–2h)
`backend/src/database/seed.ts` **imports** the four JS files. Never
hand-type 49 day blocks — transcription is where data gets corrupted.
Idempotent (upsert by slug). Reports per-destination counts so a partial
seed is visible. `npm run db:seed -w backend`.

### Step 4 — Verification gate (~45 min) — HARD GATE
1. Seed, dump all 7 destinations from the DB
2. Programmatically diff against the JS source — every day title,
   description, activity, budget must match exactly
3. Assert: 7 destinations, 49 days

**If the diff fails, stop.** No component changes proceed.

### Step 5 — Read API (~1h)
```
GET /api/destinations        list (name, slug, image, card description)
GET /api/destinations/:slug  full record + days
```
Public, no auth — marketing content, not user data. Shape each response
to what that page renders so the homepage doesn't pull 49 day blocks.

### Step 6 — Swap the frontend (~1h) — THE DELICATE PART
Via a data-source module so no component imports JS directly:
`frontend/src/data/destinationSource.js` → API with JS fallback.

Migrate **least visual risk first**:
1. Planner (`itineraryData`) — no visual change possible
2. Globe (`globeDestinations`) — coords only
3. Homepage cards (`homeContent`)
4. Destination detail (`destinationEditorial`) — **last**, most locked page

Fallback stays until the whole thing is proven. Slower to remove, much
faster to diagnose.

### Step 7 — Polish (~1h)
- In-memory session cache (static content)
- Loading state that doesn't flash
- Keep the JS files until satisfied — deleting them is a separate decision

**Enforced invariant: ZERO visual change.** Homepage and destination pages
are locked (design skill §7). Anything looking different is a migration
bug. Re-shoot baselines to prove it.

## 5.1 Phase 1 outcome (COMPLETE 2026-09-30)

Shipped, in order:

| Step | Status | Notes |
|------|--------|-------|
| 1. Split `schema.ts` | ✅ | `authSchema.ts` (generated) + `productSchema.ts` (hand-written) |
| 2. Destination tables | ✅ | migrations `0001`–`0003`; real `lat`/`lng` columns |
| 3. Seed script | ✅ | `seed.ts` **imports** the JS files; nothing hand-typed |
| 4. Verification gate | ✅ | 7 destinations, 49 days, field-level diff clean |
| 5. Read API | ✅ | `/destinations`, `/destinations/all`, `/destinations/:slug` |
| 6. Frontend swap | ✅ | `destinationSource.js`; no component imports the bundles |
| 7. Polish | ✅ | aggregate endpoint cut 8 requests → 1 |

**The Amalfi bug is fixed.** `globeDestinations.js` shipped the slug `amalfi`
while the detail route is keyed `amalfi-coast`, so clicking the Amalfi Coast
globe marker hit the 404 page. Fixed on both sides via a legacy-alias table
(`amalfi` → `amalfi-coast`).

**One-request load.** `listDestinationsWithDays()` does exactly two grouped
queries regardless of destination count. The aggregate is 18.8 KB
uncompressed for all 7 destinations + 49 day blocks. There is no
`Cache-Control`/ETag on it yet — deliberate, since how long curated content
may go stale is a product decision, not an implementation detail.

**The fallback is a 404-only path.** The frontend retries per-destination
reads *only* when `/destinations/all` specifically returns 404, which means
the frontend is newer than the backend (deploy skew). Any other error
rethrows to the bundle rather than masking the failure.

### Two carry-overs (both deliberate, both worth a decision later)

1. **`plannerOptions.js` was never migrated.** `TripPlanner.jsx` and
   `engine/personalization.js` still import it directly — it holds durations,
   styles, interests and currencies, not destination content, so the DB has
   no home for it. It is the one file bypassing `destinationSource.js`.
2. **The four JS bundles still exist** as the fallback payload. The
   duplication Phase 1 set out to kill is *reduced*, not *gone*. Deleting
   them removes the bundle-only resilience that `destinationSource.js` exists
   to provide — so that is a separate, explicit decision, not a cleanup.

## Phase 2 — Journey Library UI (COMPLETE, 2026-10-03)

Items 4 and 5 were complete and **invisible**. `GET /api/journeys` worked;
no user could see it. `/journeys` page: list, open, delete.

| Step | Status | Notes |
|------|--------|-------|
| 1. Page + route | ✅ | `pages/journeys/JourneysPage.jsx`, `journeyFormat.js`, own CSS |
| 2. Open + delete | ✅ | `?journey=<id>` deep link; Option A localStorage heuristic |
| 3. Entry point | ✅ | `.nav-library` navbar link — delivered as **A1**, see Phase 6 |
| 4. Screenshots | ✅ | empty / populated / narrow / deep-linked states captured |

### The trap in Step 2, and why `?journey=` exists

`loadLatestJourney()` returns `rows[0]` — always the **newest** journey.
Wiring the library's Open button straight to it would have silently opened the
wrong journey for every row except the first: fine in a demo with one row,
wrong for any real user with several. So Open navigates to
`/planner?journey=<id>` and the planner deep-links to that exact row — which
also matches the existing `?destination=` / `?experience=` preselection.

`loadJourneyById()` deliberately does **not** fall back to `readLocal()`: a
caller naming a specific row wants that row or nothing, and silently returning
a different journey from localStorage is the "confidently wrong content"
failure this project has hit before.

`applyJourney()` was extracted from `handleResumeJourney` so the two resume
paths share one nine-setter block and cannot drift. While a journey is open
via deep link, the planner's generic "Resume saved journey" button is hidden —
it would load `rows[0]`, i.e. a *different* journey from the one on screen.

### Option A: delete clears the matching local copy

The localStorage copy stores **no id**, so a deleted journey could otherwise
resurrect itself (delete the row, and `loadLatestJourney` falls back to the
local copy). `deleteJourneyById(id, match)` compares a coarse signature —
`destination | duration | travelStyle` — and clears the local copy only when
it matches the deleted row.

This is a **heuristic, documented as one**: two journeys to the same
destination with the same length and travel style are treated as the same
journey. That is the right way round to be wrong — it may clear a local copy
that did not need clearing, rather than leave a deleted journey able to
reappear. `clearSavedJourney` was NOT reused, because it wipes localStorage
unconditionally and would destroy a *different* journey's offline fallback.

### Two bugs the screenshots caught (lint and build were both green)

1. **Disc bullets beside every journey title.** `.journeys-list` is a `<ul>`
   and never reset `list-style`.
2. **"Maldives — to days".** The API returned `Maldives — 10 days` correctly;
   Cormorant Garamond's oldstyle figures render `1` as `t` at that size. Fixed
   by showing the destination as the heading and letting the facts row carry
   the numbers **in Inter**, where digits are unambiguous. Custom titles still
   win via `isDerivedTitle()`.

### Still open

- **Fragility found while testing:** planner step 6 does `journey.days.map()`
  unguarded (L721). A row whose snapshot lacks `days` blanks the planner.
  Pre-existing, but now reachable from the library. Real saves always include
  `days`; only hand-crafted rows hit it. Small, separate fix.

Step 3 (the entry point) was originally deferred here so the screenshot gate
would apply to a locked page on its own. It was later delivered as **A1** in
Phase 6 — see that section for the defects it surfaced.

Design skill §8 requires re-shooting affected baselines after any CSS change.

## Phase 3 — Shareable journeys (✅ COMPLETE · 2026-10-03, UI closed 2026-10-04)

`share_slug` (v4 UUID, **not** sequential) + `is_public` on `journey`.
`POST/DELETE /api/journeys/:id/share` → slug. `GET /api/shared/:slug` →
public read, no auth. Migration `0004`; both columns are additive with safe
defaults, so existing rows are unshared rather than accidentally published.

**Why a UUID and not a counter:** a public share URL is enumerable by
construction. `/shared/1`, `/shared/2` … would hand every anonymous visitor
someone else's trip. A v4 UUID has no ordering to walk.

**The security caveat, and how it is enforced.** This is the first endpoint
that serves journey data to a caller with **no session and no owner cookie**.
Two rules follow, and both are enforced in code rather than left to review:

1. **Every share write goes through `ownedBy(owner)`.** Sharing is an owner
   action; without the predicate any caller could publish anyone's trip by
   guessing a row id.
2. **`getSharedJourney` is the only read that skips ownership**, and it
   filters on `isPublic` *and* the slug — a slug alone is not consent. The
   serializer is an explicit allowlist: `title`, `destination`, `duration`,
   `travelStyle`, `budget`, `currency`, `createdAt`, `data`. Never `userId`,
   `ownerToken`, `isPremiumPlus` or the owner's row `id`.

Revocation clears the slug rather than rotating it, so the old URL dies
immediately and a later re-share mints a fresh one — a burned slug never
comes back to life.

Verified against a live server, 13 cases: anonymous read works; exactly the 8
allowlisted fields and nothing else; a stranger gets **404 not 403** when
sharing or unsharing someone else's journey (existence never confirmed); the
stranger's attempt leaves the link live; unshare returns 204 and the old slug
then 404s; re-sharing mints a different slug; re-sharing while already
shared is idempotent.

### Share UI — DONE 2026-10-04

Closed in commit `88f27e7`. The library has Share / Stop sharing per row, and
`/shared/:slug` is a read-only public page.

- Sharing is **not optimistic** — it waits for the server and surfaces failure.
  A share response with no slug is treated as a failure, not a success.
- One row in flight at a time, mirroring `deletingId`, so a failure restores
  only the row it touched.
- The public route is deliberately separate from `/journeys` so the anonymous
  view cannot inherit owner chrome.
- Verified through the real buttons in headless Chrome (9 click-path
  assertions), not only against the API.

## Phase 4 — Server-side itinerary engine ⛔ DESCOPED (5 Oct 2026)
**Do not build this.** Superseded by `SOLEN_COMPLETE_SCOPE.md` §50, which is
the authoritative decision. The engine stays in `frontend/src/engine/` as pure,
tested modules.

The original text, kept for the history:

> `POST /api/itinerary/generate`. Move the three pure engine files to
> `backend/src/engine/`. Feature flag so the frontend can use either path.
>
> **Good news:** the engine is already portable — `personalization.js`,
> `journey.js`, `budget.js` are pure functions, no React, no DOM. Only one
> file imports data; the entire consumer set is `TripPlanner.jsx`.
>
> **Quality caveat (matters more than the engineering):** generation risks
> output *worse* than 49 handcrafted blocks. Those are what make the planner
> feel considered.

Why it was dropped: this was **relocation, not a feature**. There was no secret
to protect, nothing meaningful to offload (microseconds of arithmetic), and no
second consumer — so 2–3 days would have bought zero user-visible gain against
a real *quality* risk. Revisit only if generation becomes non-deterministic or
expensive (e.g. an LLM writing itineraries), becomes a paid feature that must
be enforced server-side, or a second client needs authoritative versioned
output. None of those is true today.

## Phase 5 — External APIs (~8h + your API key)
Weather first — **Open-Meteo needs no API key** and is free. Maps needs a
key + billing decision. Replace invented `weather` strings. Cache in DB.
Caveat: network dependency means the planner can fail where it previously
couldn't — needs a timeout and fallback to the curated string.

## Phase 6 — Security hardening + deployment (A1–A4 COMPLETE, 2026-10-03)

> Done **out of order**, on purpose, and listed last here only because that is
> where the phase number puts it. See the note at the end of this section.

The "make it real" track. Sequenced **before** the engine deliberately: it is
all small and certain, and it is what turns a prototype into a product. The
engine (Phase 4) is 2�3 days and can make the product *worse* if it goes
wrong, so it should not gate a live URL.

| Item | Status | Notes |
|------|--------|-------|
| A1. Navbar entry to `/journeys` | ? | `.nav-library` beside `.nav-account`; mobile spacing rule added |
| A2. Sign-out button | ? | Was a correctness bug: endpoint existed, nothing called it |
| A3. Rate limiting + helmet | ? | Auth 10/15min (failed only), API 120/min; `TRUST_PROXY` added |
| A4. Deployment | ? | Single container; see `docs/DEPLOYMENT.md` |

**A2 was not a feature.** `/auth` always rendered the sign-in form, so a
signed-in visitor had no way to sign out � the app looked like it had
accounts with no exit. It now detects the session and shows a signed-in
panel, and the editorial aside changes from "Sign in to�" to "Welcome
back" rather than telling someone to do something they already did.

**A3 added two dependencies** (`helmet`, `express-rate-limit`) � a
deliberate exception to the dependency-free rule that governs
`journeyValidation.ts`. Hand-rolling security primitives is exactly where
that rule should yield; writing a correct limiter (IPv6 subnet keys, memory
eviction, proxy trust) is not a good use of the time.

**A4 is one container, not two.** Express serves the built SPA alongside the
API so the browser sees a single origin, which is what keeps the httpOnly
cookie working. It also rules out serverless � SQLite needs a volume.

Three defects found while verifying, all of which passed lint and build:

1. **`app.get('*')` is a syntax error in Express 5** (path-to-regexp v8
   needs a named wildcard). Found when the server refused to boot.
2. **The SPA path resolved one level too high** � `C:/Users/Admin/PROJECTS/
   frontend/dist`. Found in the startup log.
3. **A `border-bottom` alone left the UA button border** on the sign-out
   button, rendering it as OS chrome. Found in a screenshot.

Also fixed deliberately: unhashed `frontend/public/**` assets were served
`immutable` for a year, so a replaced photo could never reach anyone. Now
only fingerprinted bundles get the long cache.

### Still open

- **The container image has never been built** � Docker was unavailable. The
  code it runs was verified in production mode route-by-route; the
  `Dockerfile` itself is unexercised. `docs/DEPLOYMENT.md` �7 says so
  explicitly.
- **Graceful shutdown is wired but unproven** � signals are not delivered
  cross-process on Windows. The first `docker stop` is the real test.
- **No CI, no backups.** Both listed in `docs/DEPLOYMENT.md` �7.

### Why this was done before Phase 4

The original ordering put the itinerary engine next, because it is the item
with the most visible product impact. That was the wrong call for a project
in this state. The engine is 2�3 days of work whose main risk is **quality**:
generated itineraries can read worse than the 49 handcrafted day blocks, and
those handcrafted blocks are precisely what makes the planner feel
considered. Meanwhile the four items above were each small, certain, and
independently valuable � and without them there is no URL to show anyone.

Sequencing deployment first means the engine is later built, tested and
judged against a real deployed product rather than a local one. It also means
if effort runs out, what remains is a working, deployed SOLEN � not an
elaborate engine reachable only on `localhost`.

**First real deployment is the next milestone.** Until the image has been
built and run on a platform, A4 is a configuration that has never executed.



---

# 6. OPEN DECISIONS

## 1. Curated-first, or pure generation? ⛔ MOOT (5 Oct 2026)
Was going to gate Phase 4. **Phase 4 is descoped** (`SOLEN_COMPLETE_SCOPE.md`
§50), so there is no generation strategy to choose between — the handcrafted
49 day blocks are the output, full stop. Recorded here only so a future reader
doesn't reopen it by accident.

The original question was worth answering, and the answer was still
*curated-first*: pure generation risks output worse than the handcrafted
blocks. If the engine is ever revived, start from that recommendation.

## 2. `schema.ts` split — ✅ RESOLVED 2026-09-30
Folded into Phase 1 Step 1 as non-negotiable, and **done**: `authSchema.ts`
holds the generated auth tables, `productSchema.ts` holds the three hand-written
product tables. The §3 hazard is closed; both files are already in use and §3
can be retired on the next pass.

## 3. Keep the JS bundles, or delete them?
Still open. They are the fallback payload for when the API is unreachable.
Deleting them buys a single source of truth and costs offline resilience.
Phase 1 deliberately did **not** settle this.

---

# 7. KNOWN DEBT (deliberately not fixed)

- **Fake FX rates.** `plannerOptions.js` hardcodes `USD: 0.012`,
  `JPY: 1.75`; `TripPlanner.jsx` multiplies client-side in 8 places.
  Unsourced and stale. Phase 5 makes them more visibly wrong next to real
  weather data.
- ~~**No sign-out button.**~~ **Fixed 2026-10-03** (A2) — `AuthPage` now
  detects the session and offers sign-out.
- **Unguarded `journey.days.map()`.** Planner step 6 (L721) assumes the
  snapshot has `days`. Real saves always do; a hand-crafted or corrupted row
  blanks the page. Now reachable from the journey library.
- **Stale comments.** `destinations.js` (§50) and `plannerOptions.js`
  (§54) reference a "future backend engine" that now partially exists.
- **Headless viewport gotcha** — see §9.

---

# 8. LESSONS FROM THIS SESSION (do not relearn these)

**Five real defects were found, and two passed ESLint *and* the build.**
The missing-brace CSS bug was semantically broken code every automated
check called green. Only a screenshot caught it.

- **Always screenshot UI work.** Green CI is not proof. A default blue
  browser button is the tell for "this CSS did not apply."
- **Count braces** after chunked CSS edits — 46 open / 47 close caught a
  duplicated tail from a recovery edit.
- **Assert on real round-trips**, not just status codes. Two data bugs
  (empty snapshot, dropped `isPremiumPlus`) were type-clean and wrong on
  the wire; only field-level assertions found them.
- **Test IDs round-trip** after a full page reload, not just in-session.
- **Brace-balance any file built by `insert_line`** — that tool truncated
  a rule once.

---

# 9. ENVIRONMENT GOTCHAS

- **`npm.cmd`, not `npm`** — `npm.ps1` is execution-policy blocked.
- **Port 5199 pinned** with `strictPort: true` in `frontend/vite.config.js`.
  Must match `FRONTEND_PORT` in `backend/src/config/env.ts` or sign-in
  fails with a CSRF origin error.
- **Binaries are hoisted to root** `node_modules/.bin` — from `backend/`,
  use `..\node_modules\.bin\vite.cmd`. No local
  `frontend/node_modules/.bin` exists.
- **30s command cap.** Anything slower: `Start-Process` detached, redirect
  to `$env:TEMP`, poll the log.
- **Headless Chrome clamps `--window-size` to a 500px minimum.** A
  "390px" screenshot is really 500px and looks like false overflow. Use
  `Emulation.setDeviceMetricsOverride` via CDP for real widths.
- **Screenshots:**
  `node C:\Users\Admin\.cline\skills\solen-ui-design\scripts\shoot.mjs <url> <out.png> [selector] [width] [height]`
  — selector is a **positional 3rd arg**; no `--full-page` (pass a tall
  height). ~15–25s per shot, so run detached.
- **Design skill:** `C:\Users\Admin\.cline\skills\solen-ui-design\SKILL.md`
  — §7 locked material, §8 workflow. Homepage/destination pages are
  locked: do not restyle.
- **Design rules:** no `border-radius` (except chips/markers/thumbs),
  hairlines over shadows, Cormorant Garamond + Inter only, motion tokens
  not raw ms.

---

# 10. GIT STATE

**Clean, everything pushed.** Branch `SOLEN-Phase-2` at `88f27e7`; working tree
clean and in sync with `origin/SOLEN-Phase-2`. `main` is untouched at `9aaa7e9`.

Recent commits on the branch:

| Commit | What |
|--------|------|
| `88f27e7` | Share controls in the library, and the public `/shared/:slug` page |
| `147f6c9` | Shareable journeys: owner-scoped writes, an allowlisted public read |
| `566cf66` | Add a test suite, and the two crashes it found immediately |

Green at time of writing: 50/50 tests, ESLint (both packages), `tsc --noEmit`,
Vite build, `git diff --check`.

---

# 11. PROMPT-INDEPENDENT RESUME

If you are reading this cold, here is exactly what to do:

1. Read §3 (schema hazard) and §4 (data duplication) before touching
   anything.
2. **Phases 1, 2, 3 and 6 are COMPLETE** (§5.1, §5 Phase 2, §5 Phase 3,
   §5 Phase 6). Do not re-run them. If a step below says "not started", those
   sections supersede it.
3. **The weather snippet is DONE** — `GET /api/weather/:slug`, scope §52,5 Oct
   2026. Open-Meteo via a cached proxy with a 4s timeout and the curated
   `weatherSummary` as fallback. Nothing to build here.
4. **Phase 4 (the itinerary engine) is descoped — do not build it.** Scope §50
   keeps generation in the frontend. Open decision #1 is moot as a result, so
   nothing here gates anything any more.
5. **Maps is descoped** (§53), not merely blocked — it needs a key and a
   billing decision that is the owner's call, and the decision was to skip it.
6. **The polish pass was run as a small clean pass** (5 Oct 2026) — three
   defects fixed, eight pages swept, build/lint/typecheck/66 tests green.
   The scope is closed; see `SOLEN_COMPLETE_SCOPE.md` §61.
7. **Deployment is config-only and unexercised** (`docs/DEPLOYMENT.md` §7).
   The image has never actually been built — Docker was unavailable here. Do
   it before real users, not before the next feature.
8. §9 will save you an hour of failed commands.
9. §8 explains why screenshots matter more than green checks here.

---
