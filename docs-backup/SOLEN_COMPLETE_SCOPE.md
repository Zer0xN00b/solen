# SOLEN --- Complete Project Scope & Development Status

## 1. Project Overview

**SOLEN** is a luxury travel concierge and personalized trip-planning
web application.

The product combines luxury travel discovery, destination editorial
pages, interactive world exploration, personalized trip planning,
travel-style and interest personalization, budget-aware itinerary
generation, weather-aware planning, day-level itinerary regeneration,
saved/favourite journey functionality, responsive premium UI, and a
future full-stack layer for accounts, persistent journeys, APIs, and
dynamic data.

The project is a React/Vite frontend with a substantial interactive
planner, now paired with a live TypeScript backend (Express 5 +
Drizzle ORM + SQLite + Better Auth). The frontend remains the most
complete part of the application; the feature scope is closed — every
item has either shipped or been descoped with its reasoning, and the
site is called complete as of 5 Oct 2026 (see section 65).

### Status snapshot — updated 4 October 2026

> The snapshot below originally read 17 September 2026 and was accurate then.
> Backend foundation, authentication, journey persistence, the journey library,
> security hardening and shareable journeys have all landed since.

-   The repository was restructured into a clean monorepo
    (`frontend/` + `backend/` npm workspaces) and lives on GitHub on the
    `SOLEN-Phase-2` branch.
-   The backend is real: Express 5 + TypeScript + Drizzle ORM over
    SQLite, with Better Auth providing email/password authentication
    and database-backed sessions via httpOnly cookies (no localStorage
    tokens, by design).
-   Destination content, journeys, the journey library and public sharing
    are all complete and tested. **No scope items remain open** — everything
    is either shipped or descoped with its reasoning (see §42, §50, §53, §65).
-   See `docs/BACKEND_UPGRADE_PLAN.md` for the authoritative current state.

------------------------------------------------------------------------

# 2. Current Technology / Project Structure

## Frontend

## Monorepo (restructured 17 Sep 2026)

The project is an npm-workspaces monorepo. `npm install` at the root
installs both apps; `npm run dev` starts the frontend (:5173) and the
API (:4000) together. The Vite dev server proxies `/api/*` to the
backend, so the frontend uses relative API URLs with no CORS setup.

Frontend stack:

-   React 19
-   Vite
-   React Router 7
-   JavaScript / JSX
-   CSS
-   Google Fonts
-   Browser local storage (legacy journey saving — the API is now the
    source of truth; local storage remains an offline fallback)
-   Browser Web Share API
-   Clipboard API
-   Browser print/PDF functionality

Backend stack:

-   Node.js 20+ / TypeScript (strict)
-   Express 5
-   Drizzle ORM over SQLite (better-sqlite3) — schema designed to stay
    portable to PostgreSQL
-   Better Auth (email/password; social OAuth and email verification
    available as later plugins)
-   Migrations committed in `backend/drizzle/`, auto-applied on boot

Current project structure:

``` text
solen/                          ← npm workspaces monorepo
├── package.json                ← shared scripts; allowScripts approvals
├── README.md                   ← project identity, layout, status
├── SOLEN_COMPLETE_SCOPE.md     ← this document
├── LOCAL_SETUP.md              ← running SOLEN on a personal PC
├── frontend/                   ← React + Vite
│   ├── README.md               ← frontend commands + source map
│   ├── public/assets/          ← brand, hero, destinations, experiences
│   └── src/
│       ├── main.jsx            ← entry (BrowserRouter)
│       ├── AppRoutes.jsx       ← route table (7 routes) + scroll restore
│       ├── pages/              ← home/, destination/, planner/, auth/,
│       │                         journeys/ (library + shared), notFound/
│       ├── components/         ← ambient/, edges/, globe/, rail/
│       ├── api/                ← fetch wrappers for /api
│       ├── data/               ← application data only (no logic)
│       ├── engine/             ← pure personalization/budget/journey logic
│       ├── utils/              ← reveal.js
│       └── styles/             ← index.css, motion.css, responsive.css
└── backend/                    ← TypeScript + Express 5
    ├── README.md               ← API reference
    ├── .env.example            ← documented environment variables
    ├── drizzle/                ← committed SQL migrations
    ├── data/                   ← local SQLite file (git-ignored)
    └── src/
        ├── server.ts / app.ts  ← entry point + app assembly
        ├── auth/               ← Better Auth configuration
        ├── config/env.ts       ← typed environment access
        ├── routes/ controllers/ services/ models/  ← journey, destination,
        │                         weather and sharing endpoints
        ├── middleware/         ← notFound + errorHandler
        └── database/           ← schema.ts (generated), db.ts, migrate.ts
```

### Frontend code organization rules

-   `pages/` — one folder per route (visual designs LOCKED for home and
    destination pages)
-   `components/` — reusable UI pieces
-   `data/` — plain application data, no logic (destinations,
    destinationEditorial, globeDestinations, homeContent,
    plannerOptions)
-   `engine/` — pure functions with no React/DOM imports
    (personalization, budget, journey). This module set is deliberately
    portable so the backend itinerary engine can lift-and-shift it.

------------------------------------------------------------------------

# 3. Visual / Brand Foundation --- DONE

SOLEN has an intentionally premium visual direction.

## Design language

The current interface uses:

-   Oatmeal / warm neutral backgrounds
-   Deep plum sections
-   Dark editorial typography
-   Cormorant Garamond for luxury/editorial headings
-   Inter for supporting UI/body text
-   Large imagery
-   Editorial spacing
-   Soft animations
-   Refined buttons
-   Premium travel-magazine styling

The design intentionally avoids looking like a generic travel booking
website.

------------------------------------------------------------------------

# 4. Asset System --- DONE

Current public assets include:

## Brand

``` text
public/assets/brand/solen-logo.png
```

## Hero

``` text
public/assets/hero/hero-main.png
```

## Destinations

``` text
public/assets/destinations/amalfi.png
public/assets/destinations/bali.png
public/assets/destinations/iceland.png
public/assets/destinations/kyoto.png
public/assets/destinations/maldives.png
public/assets/destinations/morocco.png
public/assets/destinations/paris.png
```

## Experiences

``` text
public/assets/experiences/escape.png
public/assets/experiences/soul.png
public/assets/experiences/table.png
public/assets/experiences/wild.png
```

------------------------------------------------------------------------

# 5. Homepage --- DONE / LOCKED

The SOLEN homepage baseline is considered locked.

## Hero

-   Main travel hero image
-   Luxury positioning
-   SOLEN wordmark
-   Editorial typography
-   Primary journey-planning CTA
-   Premium visual hierarchy

The hero wordmark was refined so that it works correctly against the
hero image.

## Destination discovery

Seven destination cards:

1.  Kyoto
2.  Amalfi Coast
3.  Bali
4.  Iceland
5.  Maldives
6.  Morocco
7.  Paris

Destination cards are connected to their corresponding
destination-detail routes.

## Experiences

Four experience categories:

-   THE WILD
-   THE TABLE
-   THE SOUL
-   THE ESCAPE

Each experience can connect into the trip planner with its selected
experience preserved through the URL.

## Feelings / intent discovery

The homepage includes:

-   Disconnect
-   Fall in love
-   Eat everything
-   Find adventure
-   Be surrounded by nature
-   Live luxuriously
-   Discover culture

Each selection connects to the planner through a URL parameter.

## Homepage CTA

``` text
Build My Journey →
```

opens the planner.

## Status

**DONE --- LOCKED**

The homepage should not be structurally changed unless a future
requirement specifically calls for it.

------------------------------------------------------------------------

# 6. Destination Routing --- DONE

React Router is used for destination navigation.

Current route pattern:

``` text
/destinations/:slug
```

A scroll-to-top behaviour is also implemented when routes change.

------------------------------------------------------------------------

# 7. Destination Detail Pages --- DONE / LOCKED

A dynamic destination-detail component supports:

-   Kyoto
-   Amalfi Coast
-   Bali
-   Iceland
-   Maldives
-   Morocco
-   Paris

Each destination page includes:

-   Destination hero
-   Editorial introduction
-   SOLEN-specific storytelling
-   Best time to visit
-   Travel style tags
-   Signature experiences
-   Planning CTA
-   Destination-specific imagery/content

The destination detail design is locked.

The following should not be changed casually:

-   Hero layout
-   Typography
-   Styling
-   Imagery
-   Eyebrow
-   Headline
-   Description
-   Editorial structure

------------------------------------------------------------------------

# 8. Interactive SOLEN Globe --- DONE

Files:

``` text
src/SolenGlobe.jsx
src/SolenGlobe.css
```

The globe is custom-built with React/CSS and does not require a
third-party globe package.

Features:

-   Oatmeal background
-   Deep plum globe
-   Radial gradients
-   Globe grid
-   Orbit rings
-   Destination points
-   Pulsing markers
-   Floating/animated presentation
-   Active destination state
-   Destination information panel
-   Clickable destination list
-   Destination navigation

Supported globe destinations:

-   Kyoto
-   Bali
-   Maldives
-   Morocco
-   Amalfi Coast
-   Paris
-   Iceland

------------------------------------------------------------------------

# 9. Trip Planner --- DONE

The planner contains a multi-step journey-building flow.

Planner inputs include:

1.  Destination
2.  Duration
3.  Travel style
4.  Interests
5.  Budget / planning preferences
6.  Experience and feeling information from the homepage

------------------------------------------------------------------------

# 10. Destination Selection --- DONE

Supported planner destinations:

-   Amalfi Coast
-   Bali
-   Iceland
-   Kyoto
-   Maldives
-   Morocco
-   Paris

Destination selection affects:

-   Itinerary content
-   Destination imagery
-   Weather information
-   Cost calculations
-   Personalization
-   Journey summary

------------------------------------------------------------------------

# 11. Duration Selection --- DONE

Supported durations:

-   3 days
-   5 days
-   7 days
-   10 days
-   14 days
-   14+

Duration controls the generated itinerary length.

Longer journeys can cycle into deeper/extended variations rather than
simply stopping at seven days.

------------------------------------------------------------------------

# 12. Travel Style --- DONE

Supported styles:

-   Slow & Peaceful
-   Adventure
-   Luxury
-   Culture
-   Food & Nightlife
-   Nature

Travel style affects:

-   Traveller profile
-   Itinerary personalization
-   Budget estimation
-   Journey summary

------------------------------------------------------------------------

# 13. Interests --- DONE

Supported interests:

-   Food
-   Beaches
-   Adventure
-   Culture
-   Shopping
-   Nature
-   Nightlife
-   Art
-   Wellness
-   Photography

Multiple interests can be selected.

Selected interests influence:

-   Itinerary ordering/personalization
-   Budget estimates
-   Traveller profile
-   Journey summary

------------------------------------------------------------------------

# 14. Experience Selection --- DONE

Supported experience categories:

-   THE WILD
-   THE TABLE
-   THE SOUL
-   THE ESCAPE

Experience selection influences journey personality and budget
behaviour.

------------------------------------------------------------------------

# 15. Currency Support --- DONE

Supported currencies:

-   INR
-   USD
-   EUR
-   GBP
-   AED
-   JPY

Each has a configured symbol and conversion rate.

The rates are currently application data rather than a live currency
API.

------------------------------------------------------------------------

# 16. Homepage → Planner Personalization --- DONE

Planner URL parameters allow homepage selections to pre-populate the
planner.

Supported parameters:

``` text
?destination=
?experience=
?feeling=
```

This creates continuity between homepage discovery and the planning
experience.

------------------------------------------------------------------------

# 17. Feeling → Travel Style Mapping --- DONE

Current conceptual mappings:

-   Disconnect → Slow & Peaceful
-   Fall in love → Luxury
-   Eat everything → Food & Nightlife
-   Find adventure → Adventure
-   Be surrounded by nature → Nature
-   Live luxuriously → Luxury
-   Discover culture → Culture

------------------------------------------------------------------------

# 18. Personal Traveller Profiles --- DONE

SOLEN generates a traveller personality from planner selections.

Profiles include:

-   The Wild Seeker
-   The Refined Escapist
-   The Taste Chaser
-   The Curious Romantic
-   The Slow Explorer
-   The Intentional Traveller

The profile appears in the journey result.

------------------------------------------------------------------------

# 19. Smart Itinerary Personalization --- DONE

The itinerary is personalized using:

-   Travel style
-   Selected interests
-   Destination
-   Experience
-   Feeling-derived preferences

The system ranks/reorders relevant days and activities based on
preferences.

------------------------------------------------------------------------

# 20. Personalized Journey Summary --- DONE

The journey result includes a personalized summary describing the
character of the trip.

This gives the result a concierge-style feel rather than presenting only
a list of activities.

------------------------------------------------------------------------

# 21. Realistic Budget Engine --- DONE

The planner contains a multi-factor cost model.

Factors include:

-   Destination cost level
-   Travel style
-   Selected interests
-   Selected experience
-   Premium planning
-   Day rhythm

Destination, style, interest, and experience multipliers influence the
estimate.

------------------------------------------------------------------------

# 22. Day-by-Day Spending --- DONE

Every itinerary day has an individual estimated budget.

The total journey estimate is calculated from the daily estimates and
selected currency conversion.

------------------------------------------------------------------------

# 23. Budget Category Breakdown --- DONE

The estimate is divided into:

-   Stay --- 42%
-   Dining --- 20%
-   Experiences --- 18%
-   Transport --- 12%
-   Buffer --- 8%

This provides cost transparency rather than showing only one final
number.

------------------------------------------------------------------------

# 24. Weather-Aware Planning --- DONE

The planner generates weather-aware notes using stored destination
weather information.

It accounts for conditions such as:

-   Rain
-   Changing skies
-   Warm weather
-   Tropical conditions
-   Sunny conditions
-   Cool conditions
-   Crisp weather
-   Cold weather

Important distinction:

**This is not yet live weather data.**

It currently uses static destination weather information.

------------------------------------------------------------------------

# 25. Individual Day Regeneration --- DONE

A user can refresh one itinerary day without replacing the entire
journey.

The feature:

-   Changes only the selected day
-   Leaves the rest of the itinerary intact
-   Shows a refresh state
-   Attempts to choose an alternative day
-   Recalculates the day's budget
-   Recalculates its weather note
-   Clears that day's favourite state

------------------------------------------------------------------------

# 26. Journey Route --- DONE

The journey result includes an interactive route section.

It displays:

-   Day number
-   Day title
-   First activity
-   Route line
-   Route markers
-   Favourite state

The route is responsive and has a mobile-specific layout.

------------------------------------------------------------------------

# 27. Favourite Days --- DONE

Individual itinerary days can be marked as favourites.

Favourite state is represented with a heart and is integrated with the
route.

------------------------------------------------------------------------

# 28. Save / Resume Journey --- DONE

The frontend currently saves journeys locally using:

``` text
localStorage
```

Storage key:

``` text
solenSavedJourney
```

This allows resume on the same browser/device.

It is not yet cross-device or account-based.

------------------------------------------------------------------------

# 29. Copy Itinerary --- DONE

The generated itinerary can be copied to the clipboard.

------------------------------------------------------------------------

# 30. Print / PDF --- DONE

Browser print functionality supports printing and PDF creation.

------------------------------------------------------------------------

# 31. Share Journey --- DONE

The planner supports browser sharing through the Web Share API where
available, with clipboard fallback.

Current sharing is not yet a permanent server-hosted journey URL.

------------------------------------------------------------------------

# 32. Full Journey Regeneration --- DONE

The planner can regenerate the complete journey.

This is separate from individual-day regeneration.

------------------------------------------------------------------------

# 33. Edit Preferences --- DONE

The result page allows the user to return to the planning flow and
modify preferences.

------------------------------------------------------------------------

# 34. Start Over --- DONE

A complete reset/start-over action is available.

------------------------------------------------------------------------

# 35. Saved Journey Clearing --- DONE

The current frontend supports clearing the locally saved journey.

------------------------------------------------------------------------

# 36. Crafting / Loading Experience --- DONE

The planner includes a journey-crafting state before the result appears.

It includes:

-   Animated loader
-   Glow effects
-   Editorial title treatment
-   Fade transitions
-   Premium presentation

------------------------------------------------------------------------

# 37. Journey Result Animations --- DONE

Staged reveal animations are applied to:

-   Journey heading
-   Destination
-   Experience card
-   Hero image
-   Overview
-   Premium note
-   Itinerary
-   Route
-   Actions

------------------------------------------------------------------------

# 38. Luxury Micro-Interactions --- DONE

Micro-interactions exist for:

-   Planner options
-   Buttons
-   Premium choices
-   Itinerary days
-   Route markers
-   Favourite hearts
-   Action buttons
-   Resume links
-   Budget slider

Reduced-motion support is included.

------------------------------------------------------------------------

# 39. Responsive / Mobile Design --- DONE

Responsive CSS is implemented through:

``` text
src/responsive.css
```

Coverage includes:

-   Navigation
-   Hero
-   Destination grids
-   Experience grids
-   Feeling section
-   Planner
-   Planner option grids
-   Budget controls
-   Crafting screen
-   Journey result
-   Journey hero
-   Preferences
-   Cost section
-   Itinerary
-   Route
-   Actions
-   Saved journey
-   Globe
-   Small-phone layouts

------------------------------------------------------------------------

# 40. Accessibility --- PARTIALLY DONE

Already present:

-   Button-based interactions
-   ARIA labels on route controls
-   Disabled states
-   Reduced-motion support
-   `:focus-visible` styles (global)
-   Every `<img>` has an `alt`; every `<button>` has an explicit `type`
-   Auth inputs labelled via `htmlFor`/`id`
-   Budget slider labelled (`aria-label` + `aria-valuetext`, added 5 Oct)
-   Favourite-day tap target extended to 44px (5 Oct)

Remaining (the polish pass):

-   Full accessibility audit
-   Keyboard-navigation review
-   Screen-reader review
-   Contrast review
-   Skip-to-content link

------------------------------------------------------------------------

# 41. Current Frontend Status

Approximate frontend completion:

**85--90%**

The frontend already represents a substantial interactive travel
product. The feature layer is finished; only the polish work recorded
in section 40 is optional from here.

------------------------------------------------------------------------

# 42. FRONTEND REMAINING SCOPE --- CLOSED (5 OCT 2026)

> **Reshaped 5 Oct 2026.** All three of the original items in this section —
> the destination-aware packing list, the cost transparency enhancement, and
> travel logistics — are **descoped**. They are kept below as history, with the
> reasoning, so the decision reads straight rather than looking like an omission.
> The frontend feature list is closed; the clean pass it would have led to has
> been run (section 61).
>
> **Packing list — descoped.** The real cost was never the checklist UI; it was
> authoring packing guidance for seven destinations across weather, style and
> activity, and then keeping it honest against live weather. It is also the
> least distinctive thing the product could carry: a packing checklist is what
> every travel site has, and it would sit beside the editorial destination
> pages and traveller profiles as the one utilitarian screen in a product whose
> identity is "one continuous, living journey".
>
> **Cost transparency — descoped because it is already built.** The breakdown
> ships today: "WHERE YOUR ESTIMATE GOES" splits the estimate into stay,
> dining, experiences, transport and buffer, alongside per-day spend, the
> total, currency conversion and a five-factor budget engine. Five of the
> seven items this section asked for were already in place, buffer included,
> and section 60 already recorded "Budget category breakdown" and "Day-by-day
> spending" as done. Re-scoping it was costing half a day to restate a
> feature that exists.
>
> The one gap this descopes: there is no plain statement of what the estimate
> *includes* and excludes. If that is ever wanted, it is a short line under
> the existing grid — an hour, not a phase.

## Destination-aware packing list — DESCOPED (5 OCT 2026)

*Original scope, kept for the record:*

Estimated time: **0.5--1 day**

Potential scope:

-   Destination-specific packing recommendations
-   Duration-aware quantities
-   Weather-aware items
-   Activity-aware items
-   Travel-style additions
-   Compact checklist UI

------------------------------------------------------------------------

## Travel logistics — DESCOPED (5 OCT 2026)

*Original scope, kept for the record:*

Estimated time: **0.5--1 day**

Potential scope:

-   Arrival guidance
-   Departure guidance
-   Airport transfer
-   Local transport
-   Inter-city movement
-   Approximate travel time
-   Check-in/check-out context

**Why descoped.** This is reference content the planner already implies: the
itinerary has days, directions have a destination, and every field listed above
is static prose that would sit in one section with nothing to personalize it.
It does not use the budget, the traveller profile, the live weather, or the
journey itself — the four things this product is built on. Adding it would have
made the feature count larger without making the journey better.

------------------------------------------------------------------------

## Cost transparency enhancement — DESCOPED (5 OCT 2026)

*Original scope, kept for the record:*

Estimated time: **0.5--1 day**

Potential scope:

-   What's included
-   What's not included
-   Estimated daily spend
-   Accommodation estimate
-   Dining estimate
-   Experience estimate
-   Transport estimate
-   Buffer
-   Estimate disclaimer

------------------------------------------------------------------------

## Journey Library UI

Estimated time: **1--1.5 days**

Potential scope:

``` text
MY JOURNEYS

Kyoto · 7 Days
Bali · 5 Days
Paris · 10 Days
```

Potential actions:

-   Open
-   Rename
-   Delete
-   Favourite

The UI can initially work with local data and later connect to the
backend.

------------------------------------------------------------------------

## Shareable Journey View

Estimated frontend portion: **0.5--1 day**

Potential scope:

``` text
SOLEN / journey / <journey-id>
```

The page can display:

-   Destination
-   Traveller profile
-   Summary
-   Itinerary
-   Budget
-   Route
-   Preparation information

The permanent journey ID would ultimately come from the backend.

------------------------------------------------------------------------

## Final frontend QA / polish

**Run 5 Oct 2026 -- see section 61.** The audit came out at three defects
(stray indentation, an unlabelled slider, an undersized tap target), all fixed
and verified. What it did not cover is listed in section 40 as optional.

Original estimate, kept for the record: **1--2 days**

Original scope:

-   Mobile edge cases
-   Tablet edge cases
-   Typography consistency
-   Spacing
-   Button consistency
-   Empty states
-   Loading states
-   Error states
-   Accessibility
-   Keyboard navigation
-   Broken-route handling
-   Image loading
-   Performance review

------------------------------------------------------------------------

# 43. BACKEND --- PURPOSE

**Status: foundation and authentication LIVE (17 Sep 2026).**

The backend transforms SOLEN from a highly interactive frontend
application into a persistent full-stack travel product.

It will eventually handle:

-   User accounts
-   Authentication
-   User preferences
-   Saved journeys
-   Journey persistence
-   Journey sharing
-   Destination data
-   Itinerary data
-   Dynamic itinerary generation
-   Weather/API data
-   Route/location information
-   Validation
-   Security
-   Production database access

React remains responsible for presentation and interaction. The backend
becomes the source of truth for persistent data and server-side business
logic.

------------------------------------------------------------------------

# 44. BACKEND ARCHITECTURE --- IMPLEMENTED

The implemented structure (see §2 for the full tree):

``` text
SOLEN
│
├── frontend/
│   └── React + Vite
│
└── backend/
    ├── src/server.ts        ← entry point
    ├── src/routes
    ├── src/controllers      ← empty; product code lands here
    ├── src/services         ← empty; will receive the port of
    │                           frontend/src/engine/*
    ├── src/models           ← empty
    ├── src/middleware
    ├── src/config
    ├── src/auth             ← Better Auth
    └── src/database         ← Drizzle schema, connection, migrations
```

Chosen stack:

-   Node.js 20+ with TypeScript (strict) — Better Auth and Drizzle are
    TypeScript-first, and the backend was small enough to convert early
-   Express 5 REST APIs
-   SQLite via better-sqlite3 + Drizzle ORM for zero-setup local
    development; the schema stays portable to PostgreSQL (the long-term
    target) for production

------------------------------------------------------------------------

# 45. BACKEND FOUNDATION --- DONE

**Completed 17 Sep 2026.** Everything in the original scope exists:

-   Backend project — npm workspace with its own package.json/scripts
-   Server setup — Express 5, TypeScript (`tsx watch` in dev, `tsc`
    build for production)
-   Environment configuration — `backend/.env` (documented
    `.env.example`; auto-created with a generated secret on first run)
-   API base structure — `/api` router with a health endpoint
-   Route structure — routes/, controllers/, services/, models/ folders
-   Error handling — JSON 404 handler + central error middleware
-   Database configuration — Drizzle ORM + better-sqlite3, migrations
    auto-applied on server boot
-   Development/production configuration — NODE_ENV aware

API surface today:

``` text
/api
    /health          GET    live
    /auth/*                 live (Better Auth: sign-up/email,
                            sign-in/email, sign-out, get-session)
    /destinations           planned
    /journeys               planned
    /weather                planned
```

------------------------------------------------------------------------

# 46. DATABASE --- PARTIALLY DONE

**Foundation complete 17 Sep 2026.** Drizzle ORM over SQLite with
committed SQL migrations (`backend/drizzle/`), applied automatically on
boot. The Better Auth tables are live (generated by the official
tooling, not hand-written):

``` text
user          ← user records (id, name, email, emailVerified, image…)
session       ← revocable DB-backed sessions
account       ← auth accounts (email/password now; OAuth later)
verification  ← tokens for future email verification
```

**Live entities:**

## Destinations

``` text
id
name
slug
region
description
weather_summary
image
```

## Journeys

``` text
id
user_id
destination_id
duration
travel_style
budget
currency
experience
feeling
traveller_profile
personalized_summary
created_at
updated_at
```

## Journey Days

``` text
id
journey_id
day_number
title
activities
budget
weather_note
is_favourite
```

The schema can evolve as the product becomes more sophisticated. The planned
**user preferences table was descoped 5 Oct 2026** — no UI consumes it (see
section 60).

------------------------------------------------------------------------

# 47. AUTHENTICATION --- CORE DONE

**Core complete 17 Sep 2026 with Better Auth:**

-   Sign up — `/api/auth/sign-up/email` (live, tested)
-   Login — `/api/auth/sign-in/email` (live, tested)
-   Logout — `/api/auth/sign-out` (live, tested)
-   Password hashing — handled by Better Auth
-   Authentication state — database-backed sessions delivered via
    httpOnly cookies, 30-day expiry, refreshed on activity. No tokens
    in localStorage — deliberate security decision.
-   Wrong-credential handling — generic "Invalid email or password"
    (no user enumeration)

Shipped:

-   Protected API routes (requireAuth middleware for journey endpoints) ✅
-   Frontend auth UI (SOLEN-styled sign-up/sign-in, session-aware navbar
    via the better-auth/react client) ✅
-   User-specific data access (journey ownership) ✅

Public trip planning remains available without an account, while
persistent saved journeys become account-based.

------------------------------------------------------------------------

# 48. PERSISTENT JOURNEYS --- DONE (SHIPPED WITH PHASE 3, 17 SEP 2026)

Journeys persist through the API rather than the browser. Implemented as
originally sketched:

``` text
React
↓
API
↓
Database
```

``` text
POST   /api/journeys
GET    /api/journeys
GET    /api/journeys/:id
PUT    /api/journeys/:id
DELETE /api/journeys/:id
```

This supports the Journey Library.

------------------------------------------------------------------------

# 49. JOURNEY SHARING --- DONE (3 OCT 2026)

A saved journey receives a unique public identifier:

``` text
Journey
↓
Unique ID
↓
Share URL
↓
Public journey page
```

The backend determines whether a journey is private, shared or public;
`requireAuth` guards the private routes and `/api/journeys/public/:id` serves
the shared one.

------------------------------------------------------------------------

# 50. ITINERARY GENERATION --- LIVES IN THE FRONTEND (BY DECISION, 5 OCT 2026)

**Descoped from the backend. Not remaining work.**

Generation (personalization, budget, journey assembly) runs in `frontend/src/engine/`
as pure, tested modules, and stays there. Moving it server-side would relocate
working logic to another process for zero user-visible gain: there is no secret
to protect (forecast providers under consideration need no key), nothing to
offload (microseconds of arithmetic), and no second consumer. The 49 handcrafted
day blocks remain the quality bar; generated output is judged against them.

Revisit only if generation becomes non-deterministic/expensive (e.g. an LLM
writing itineraries), a paid feature that must be enforced server-side, or a
second client needing authoritative versioned output. None of those is true today.

------------------------------------------------------------------------


# 51. ITINERARY DATA MODEL --- SUPERSEDED (5 OCT 2026)

Done differently than planned, and that is fine. Structured destination content
lives in the `destination` + `itinerary_day` tables (migrations 0001-0003), seeded
directly from the frontend data files with a field-level diff gate (7 destinations,
49 day blocks). There is no separate richer model, and none is planned: nothing
in the product consumes per-activity metadata, and adding it would be schema
without a feature.

------------------------------------------------------------------------


# 52. LIVE WEATHER SNIPPET --- DONE (5 OCT 2026)

Shipped. `GET /api/weather/:slug` reads Open-Meteo (free, no key) through a
cached proxy and returns a live temperature and sky condition beside the
planner's curated weather note.

Scoped as originally written, and built to that scope: one user-visible thing
and nothing more. No itinerary adjustments, no outdoor/indoor reselection, no
clothing logic -- the curated copy already covers the planning; this only makes
the weather claim live instead of static.

The design rule throughout is that the provider is an enhancement, never a
dependency. A 4s hard timeout, shape-validated responses, a 10-minute cache
that stores only successes, and a curated `weather_summary` fallback on every
failure path. The planner cannot fail where it previously could not.

Note the honesty boundary this deliberately does not cross: the planner is
**conditions**-aware, still not **forecast**-aware. Nothing reschedules around
the reading.

------------------------------------------------------------------------


# 53. MAP / ROUTE DATA --- DESCOPED (5 OCT 2026)

Not on the to-do list. Maps need a vendor key and a billing decision, the existing
visual route already reads real coordinates from the DB, and nothing in the
reshaped scope (polish) needs route intelligence. Revisit only with a chosen
vendor and a feature that consumes it.

------------------------------------------------------------------------


# 54. DESTINATION DATA API --- DONE (30 SEP 2026)

Shipped as Phase 1: `GET /api/destinations`, `/all`, `/:slug`, served from the DB,
consumed via `destinationSource.js` with the JS files as offline fallback.
Kept here so the history reads straight.

------------------------------------------------------------------------


# 55. SECURITY / VALIDATION --- DONE (3 OCT 2026)

Shipped: `journeyValidation.ts`, requireAuth + ownedBy (404 not 403 on non-owners),
rate limiting + helmet, allowlisted public share serializer. Kept here so the
history reads straight.

------------------------------------------------------------------------


# 56. FRONTEND-BACKEND INTEGRATION --- DONE (5 OCT 2026)

The planner, library and sharing all read and write through the API, and the
section 52 weather snippet is wired through the cached proxy. The generate
arrow in the old diagram (`POST /api/journeys/generate`) was the descoped
engine (see section 50) and will not be built.

------------------------------------------------------------------------


# 57. BACKEND TESTING --- DONE (3 OCT 2026)

66 tests passing (routes, validation, ownership, sharing, weather). External-provider failure
handling gets covered by the section-52 snippet tests when it lands.

------------------------------------------------------------------------


# 58. DEPLOYMENT --- CONFIG DONE, FIRST BUILD IS SHIPPING-DAY WORK (5 OCT 2026)

Dockerfile + compose are written; the image has never been built (no Docker in this
environment). Not on the feature to-do: it returns the day anything ships, along
with backups and CI. See docs/DEPLOYMENT.md section 7.

------------------------------------------------------------------------


# 59. FINAL PRODUCT TESTING --- RUN AS THE CLEAN PASS (5 OCT 2026)

Not a separate phase. Each to-do item shipped with its own verification
(screenshots for UI, tests for logic), and the clean pass in section 61 ended
with a page-by-page sweep: homepage, globe, destination pages, planner, auth,
library, sharing, mobile / tablet / desktop, direct URLs, refresh behaviour,
API failures, empty states. Build, lint, typecheck and 66/66 tests all green
afterwards.

------------------------------------------------------------------------


# 60. COMPLETE FEATURE STATUS

## DONE

-   [x] Luxury homepage
-   [x] Hero
-   [x] SOLEN branding
-   [x] Destination cards
-   [x] Seven destination pages
-   [x] Destination routing
-   [x] Destination editorial content
-   [x] Experiences
-   [x] Experience routing
-   [x] Feeling discovery
-   [x] Feeling → planner mapping
-   [x] Interactive globe
-   [x] Globe → destination navigation
-   [x] Responsive design
-   [x] Planner
-   [x] Destination selection
-   [x] Duration selection
-   [x] Travel style
-   [x] Interests
-   [x] Experience selection
-   [x] Currency selection
-   [x] Budget selection
-   [x] URL preselection
-   [x] Traveller profiles
-   [x] Smart itinerary personalization
-   [x] Personalized summary
-   [x] Duration-based itinerary length
-   [x] Destination-aware budget
-   [x] Style-aware budget
-   [x] Interest-aware budget
-   [x] Experience-aware budget
-   [x] Premium budget
-   [x] Day-by-day spending
-   [x] Budget category breakdown
-   [x] Weather-aware planning
-   [x] Individual-day regeneration
-   [x] Favourite days
-   [x] Journey route
-   [x] Save journey locally
-   [x] Resume journey locally
-   [x] Copy itinerary
-   [x] Print/PDF
-   [x] Browser sharing
-   [x] Full journey regeneration
-   [x] Edit preferences
-   [x] Start over
-   [x] Clear saved journey
-   [x] Crafting screen
-   [x] Journey reveal animations
-   [x] Route animations
-   [x] Luxury micro-interactions
-   [x] Reduced-motion support
-   [x] Mobile route presentation

## TO-DO (CLOSED 5 OCT 2026)

**Nothing open.** Everything below shipped or was descoped with its reasoning
(sections 42, 50-59). The scope closes with the clean pass; the site is
called complete.

-   [x] Live weather snippet (section 52, shipped 5 Oct 2026 -- cached proxy, curated fallback)
-   [x] Clean pass (shipped 5 Oct 2026 -- see CHANGELOG and section 40; see
     section 61 for what it deliberately left out)

Descoped 5 Oct 2026 -- see section 42 for the reasoning:

-   Travel logistics (static reference content; nothing personalized to show)
-   Destination-aware packing list (not distinctive; large content surface)
-   Enhanced cost transparency (already shipped -- see the "WHERE YOUR
    ESTIMATE GOES" breakdown)

## DONE (INCLUDING THIS RESHAPE)

-   [x] Backend project foundation (17 Sep 2026)
-   [x] Database foundation (Drizzle + SQLite, migrations on boot)
-   [x] Database schema -- auth tables (user/session/account/verification)
-   [x] Authentication core (Better Auth: email/password + sessions)
-   [x] API error handling (central handler + JSON 404s)
-   [x] User accounts UI (sign-up/sign-in, session-aware navbar, sign-out)
-   [x] Protected API routes (requireAuth middleware)
-   [x] Journey CRUD API + persistent saved journeys + Journey Library backend
-   [x] Public/shareable journey IDs + public journey API
-   [x] Destination API + structured itinerary data (seeded, diff-gated)
-   [x] Backend validation + security hardening (rate limiting + helmet)
-   [x] Frontend/backend integration + backend testing (66 tests)
-   [x] Deployment + production DB config (first build/deploy is shipping-day work)

## EXPLICITLY DESCOPED 5 OCT 2026 (NOT TO-DO -- SEE SECTIONS 50-59 FOR WHY)

-   Server-side itinerary engine (relocation, not a feature)
-   Maps / route intelligence (needs a vendor + billing decision first)
-   User preference persistence (no UI consumes it)
-   CI / backups / E2E phase / deployment run (shipping-day ops, not product work)

------------------------------------------------------------------------

# 61. ESTIMATED REMAINING TIME (CLOSED 5 OCT 2026)

  Item                                Estimated time
  --------------------------------- ----------------
  Clean pass (done)                  ~2 hours

  (Everything else either shipped or was descoped with its reasoning:
   live weather section 52; travel logistics, packing list and cost
   transparency section 42; engine section 50; maps section 53.)

**Remaining scope: none. SOLEN is called complete.**

The original estimate for this work was a full polish phase -- accessibility,
responsive QA, performance, contrast, a skip link -- at 1-2 days. What that
audit actually turned up was three small defects and no structural problems,
so it was fixed as a clean pass in an afternoon rather than run as a phase.
The items deliberately left out of "complete" are listed below so the
decision is on record rather than implied:

-   Prettier reformat -- never enforced here; it would rewrite every file
    for no behavioural gain.
-   Skip-to-content link and a formal WCAG contrast audit -- real work, but
    beyond a small pass; see section 40 if ever wanted.

------------------------------------------------------------------------

# 62. RECOMMENDED DEVELOPMENT PHASES (CLOSED 5 OCT 2026)

Old phases 1-6 shipped everything they were going to ship. The remaining plan
was one feature phase and one polish phase; the feature was descoped and the
polish audit was run as a small clean pass. **No phases remain.**

## Phase A --- Clean pass (done 5 Oct 2026)

-   One stray column-0 line in SharedJourneyPage.jsx repaired
-   Budget slider given an accessible name and value text
-   Favourite-day tap target extended to 44px, visual unchanged
-   Missing `<meta name="description">` added to index.html
-   Full sweep of eight pages: alt text, button types, form labels, main
    landmarks, focus states, reduced motion, assets, stray debug output
-   Verified: vite build, eslint (frontend + backend), tsc, 66/66 tests

**After Phase A: complete.** Nothing follows it.
-   Ends with a full page-by-page sweep (the old section-59 list, folded in)

## Retired phases (history, kept straight)

-   Old Phase 1 (frontend product layer): shipped library + sharing UI; its
    packing and cost items are descoped (section 42).
-   Old Phases 2, 3, 5 (foundation, accounts, sharing): DONE.
-   Old Phase 4 (intelligent backend planner): DESCOPED -- engine stays in the
    frontend by decision (section 50); maps descoped (section 53).
-   Old Phase 6 (security + production): shipped validation, security, 66
    tests, deployment config; first build/deploy + CI/backups are
    shipping-day work.

------------------------------------------------------------------------

# 63. FINAL TARGET ARCHITECTURE

``` text
                         SOLEN
                           │
          ┌────────────────┴────────────────┐
          │                                 │
      FRONTEND                           BACKEND
          │                                 │
   React + Vite                       Node + API
          │                                 │
   ┌──────┼───────┐              ┌──────────┼──────────┐
   │      │       │              │          │          │
Homepage Globe Planner       Auth       Journeys   Destinations
   │      │       │              │          │          │
   └──────┴───────┘              └──────────┼──────────┘
                                             │
                                         DATABASE
                                             │
                              ┌──────────────┼──────────────┐
                              │              │              │
                            Users         Journeys     Destinations
                             (journeys + itinerary_day rows)
                                             │
                              Generation lives in frontend/src/engine (by decision, sec 50)
                                      Personalization
                                             │
                              ┌──────────────┼──────────────┐
                              │                             │
                       Live weather snippet (sec 52, scoped)    Maps: descoped
                         Weather API                    Maps API
```

------------------------------------------------------------------------

# 64. PRODUCT MATURITY TARGET

## Stage 1 --- Visual prototype

**Completed**

``` text
Beautiful travel website
```

## Stage 2 --- Interactive travel planner

**Completed**

``` text
Website
+
Planner
+
Personalization
+
Budget
+
Itinerary
```

## Stage 3 --- Persistent application

**Done** -- accounts, database, saved journeys, library and sharing all
shipped.

``` text
Planner
+
Accounts
+
Database
+
Saved journeys
```

## Stage 4 --- Feature + polish finish (reshaped 5 Oct 2026)

**To-do:** nothing. The polish pass was run as a small clean pass (section 61)
and closed. The old engine and maps plans are descoped (sections 50 and 53),
as are travel logistics, the packing list and cost transparency (section 42).
Live weather shipped 5 Oct (section 52).

## Stage 5 --- Full portfolio-level product

**Target** -- SOLEN is functionally here and is now called complete. What
remains is the shipping-day operations work (first Docker build, CI, backups).
--------------------------------------------------------------------------

# 65. OVERALL SOLEN STATUS (CLOSED 5 OCT 2026)

**Frontend:** product layer done, clean pass applied.

**Backend:** done. Engine descoped, maps descoped, weather snippet shipped,
deployment config written (first build is shipping-day work).

**Remaining scope: none. SOLEN is complete.**

Everything is either shipped or descoped with its reasoning on the record.
The site is called complete as of 5 Oct 2026; the only work left in the
repository is shipping-day operations (Docker build, CI, backups), which
needs a hosting decision rather than code.

--------------------------------------------------------------------------

# 66. SCOPE PRIORITY (RESHAPED 5 OCT 2026)

## Build now

Nothing. The build-now list is empty as of 5 Oct 2026 -- the polish pass was
run as a clean pass and closed (section 61).

## Descoped -- do not build

Engine (section 50), maps/route data (section 53), travel logistics, packing
list and cost transparency (section 42), user preference persistence,
CI/backups, and the first deployment run.

--------------------------------------------------------------------------

# 67. SCOPE PHILOSOPHY

**"a complete, persistent, personalized full-stack travel product -- finishing
its last feature and its polish."**

SOLEN should remain focused on the core promise:

> **A luxury travel concierge that understands how the traveller wants to feel,
> what they enjoy, where they want to go, how long they have, and how much they
> want to spend --- then turns those preferences into a considered journey.**

That promise is now met end to end. The goal is no longer to add features
simply to increase the feature count -- which is precisely why travel logistics,
the packing list and the restated cost transparency were descoped rather than
built. The goal is to finish what exists: make it correct on a phone, make it
accessible, and make it load quickly.

--------------------------------------------------------------------------

# 68. DOCUMENT HISTORY

-   **v6 -- 5 Oct 2026:** clean pass run (section 61); stale headings in
    sections 40, 46-49, 56, 59 corrected. **Scope closed -- SOLEN is called
    complete.**
-   **v5 -- 5 Oct 2026:** travel logistics descoped (section 42). Scope was
    reduced to a single polish pass (~1-2 days).
-   **v4 -- 5 Oct 2026:** live weather snippet shipped (section 52); packing
    list and cost transparency descoped (section 42, the latter already
    shipped).
-   **v3 -- 5 Oct 2026:** scope reshaped to features + polish only. Engine
    descoped (stays in frontend by decision), maps descoped, prefs descoped,
    ops deferred to shipping day.
-   **v2 -- 17 Sep 2026:** repository restructured into a monorepo
    (pages/components/data/engine), backend foundation + Better Auth
    completed (Phases 2 + auth core of 3), statuses/estimates/priorities
    updated throughout.
-   **v1 -- initial:** scope as carried over from the original development
    chat.
