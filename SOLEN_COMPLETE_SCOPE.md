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
complete part of the application; the remaining scope is finishing the
frontend product layer and turning the planner into a persistent,
data-driven full-stack experience.

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
    are all complete and tested. **Two scope items remain open:** the
    server-side itinerary engine and external weather/maps APIs.
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
├── SOLEN_COMPLETE_SCOPE.md     ← this document
├── LOCAL_SETUP.md              ← running SOLEN on a personal PC
├── frontend/                   ← React + Vite
│   ├── public/assets/          ← brand, hero, destinations, experiences
│   └── src/
│       ├── main.jsx            ← entry (BrowserRouter)
│       ├── AppRoutes.jsx       ← route table + scroll restore
│       ├── pages/              ← home/, destination/, planner/
│       ├── components/         ← globe/, navbar/
│       ├── data/               ← application data only (no logic)
│       ├── engine/             ← pure personalization/budget/journey logic
│       └── styles/             ← index.css, responsive.css
└── backend/                    ← TypeScript + Express 5
    ├── .env.example            ← documented environment variables
    ├── drizzle/                ← committed SQL migrations
    ├── data/                   ← local SQLite file (git-ignored)
    └── src/
        ├── server.ts / app.ts  ← entry point + app assembly
        ├── auth/auth.ts        ← Better Auth configuration
        ├── config/env.ts       ← typed environment access
        ├── routes/             ← /api routes (health today)
        ├── middleware/         ← notFound + errorHandler
        ├── database/           ← schema.ts (generated), db.ts, migrate.ts
        └── controllers/ services/ models/  ← future product code
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

Remaining:

-   Full accessibility audit
-   Keyboard-navigation review
-   Focus-state review
-   Screen-reader review
-   Contrast review
-   Form semantics review

------------------------------------------------------------------------

# 41. Current Frontend Status

Approximate frontend completion:

**85--90%**

The frontend already represents a substantial interactive travel
product. Remaining frontend work is primarily productization and
refinement.

------------------------------------------------------------------------

# 42. FRONTEND REMAINING SCOPE

## Destination-aware packing list

Estimated time: **0.5--1 day**

Potential scope:

-   Destination-specific packing recommendations
-   Duration-aware quantities
-   Weather-aware items
-   Activity-aware items
-   Travel-style additions
-   Compact checklist UI

------------------------------------------------------------------------

## Travel logistics

Estimated time: **0.5--1 day**

Potential scope:

-   Arrival guidance
-   Departure guidance
-   Airport transfer
-   Local transport
-   Inter-city movement
-   Approximate travel time
-   Check-in/check-out context

------------------------------------------------------------------------

## Cost transparency enhancement

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

Estimated time: **1--2 days**

Scope:

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

Remaining entities (target design):

## User Preferences

``` text
id
user_id
travel_style
budget
currency
interests
preferred_experiences
```

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

The schema can evolve as the product becomes more sophisticated.

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

Remaining:

-   Protected API routes (requireAuth middleware for journey endpoints)
-   Frontend auth UI (SOLEN-styled sign-up/sign-in, session-aware
    navbar via the better-auth/react client)
-   User-specific data access (journey ownership)

Public trip planning remains available without an account, while
persistent saved journeys become account-based.

------------------------------------------------------------------------

# 48. PERSISTENT JOURNEYS --- REMAINING

Estimated time: **1--2 days**

Current:

``` text
Browser
↓
localStorage
```

Future:

``` text
React
↓
API
↓
Database
```

Potential API operations:

``` text
POST   /api/journeys
GET    /api/journeys
GET    /api/journeys/:id
PUT    /api/journeys/:id
DELETE /api/journeys/:id
```

This would support the Journey Library.

------------------------------------------------------------------------

# 49. JOURNEY SHARING --- REMAINING

Estimated time: **\~1 day**

A saved journey can receive a unique public identifier.

Conceptually:

``` text
Journey
↓
Unique ID
↓
Share URL
↓
Public journey page
```

The backend can determine whether a journey is:

-   Private
-   Shared
-   Public

------------------------------------------------------------------------

# 50. DYNAMIC ITINERARY ENGINE --- REMAINING

Estimated time: **2--3 days for a first useful version**

This is one of the most important backend features.

Conceptual flow:

``` text
Destination
+
Duration
+
Budget
+
Travel Style
+
Interests
+
Experience
+
Weather
        ↓
Backend itinerary engine
        ↓
Personalized journey
        ↓
Frontend result page
```

The existing frontend personalization logic provides the behavioural
foundation. Since the 17 Sep 2026 restructure it lives in
`frontend/src/engine/` as pure, framework-free modules
(personalization, budget, journey assembly) with all content in
`frontend/src/data/` — deliberately shaped so the backend services can
lift-and-shift them.

The backend version would move core decision-making and data retrieval
into server-side services.

------------------------------------------------------------------------

# 51. ITINERARY DATA MODEL --- REMAINING

The backend can maintain structured destination data instead of relying
entirely on hard-coded JSX objects.

A destination can contain:

-   Attractions
-   Restaurants
-   Experiences
-   Activities
-   Areas
-   Accommodation categories
-   Transport options
-   Weather information
-   Seasonal information

Activities can contain metadata such as:

``` text
destination
category
style
interests
estimated_cost
duration
weather suitability
premium suitability
```

This enables more intelligent itinerary generation.

------------------------------------------------------------------------

# 52. WEATHER API --- REMAINING

Estimated time: **0.5--1.5 days**

Current:

-   Static destination weather information

Future:

``` text
Destination
↓
Weather API
↓
Backend
↓
Current / forecast conditions
↓
Itinerary adjustments
```

Potential uses:

-   Outdoor activity selection
-   Indoor alternatives
-   Clothing suggestions
-   Flexible scheduling
-   Daily weather notes

------------------------------------------------------------------------

# 53. MAP / ROUTE DATA --- REMAINING

Estimated time: **1--2 days**

Potential scope:

-   Destination coordinates
-   Stop coordinates
-   Route information
-   Approximate movement time
-   Area grouping
-   Route optimization

The existing visual route can then become data-driven.

------------------------------------------------------------------------

# 54. DESTINATION DATA API --- REMAINING

Estimated time: **0.5--1 day**

Note (17 Sep 2026): destination content is no longer duplicated across
components — it is centralized in `frontend/src/data/` (destinations,
destinationEditorial, globeDestinations, homeContent, plannerOptions).
Those files become the seed data for this API.

Future architecture:

``` text
Frontend
↓
GET /api/destinations
↓
Backend
↓
Database
```

This can eventually power:

-   Homepage destinations
-   Globe
-   Destination pages
-   Planner
-   Search/discovery

The current visual design does not need to change to support this.

------------------------------------------------------------------------

# 55. SECURITY / VALIDATION --- REMAINING

Estimated time: **\~1 day**

Scope:

-   Request validation
-   Authentication checks
-   Protected resources
-   Input sanitization
-   Password security
-   Environment variables
-   Error responses
-   User ownership checks
-   Rate limiting where appropriate

The core objective is preventing unauthorized access or modification of
another user's private journeys.

------------------------------------------------------------------------

# 56. FRONTEND ↔ BACKEND INTEGRATION --- REMAINING

Estimated time: **1--2 days**

Conceptual flow:

``` text
React Planner
      ↓
POST /api/journeys/generate
      ↓
Backend
      ↓
Personalization service
      ↓
Destination data
      ↓
Weather data
      ↓
Budget engine
      ↓
Generated journey
      ↓
React Result Page
```

The current visual planner can remain largely intact while its data
source changes from local/static logic to API-backed logic.

------------------------------------------------------------------------

# 57. BACKEND TESTING --- REMAINING

Estimated time: **1 day**

Scope:

-   API success cases
-   Invalid requests
-   Authentication failures
-   Missing data
-   Database failures
-   Journey ownership
-   Save/load/delete
-   Share links
-   Itinerary generation
-   External API failure handling

------------------------------------------------------------------------

# 58. DEPLOYMENT --- REMAINING

Estimated time: **1 day**

Scope:

## Frontend

Production deployment of the React/Vite application.

## Backend

Production deployment of the API server.

## Database

Production database connection.

## Environment variables

Separate development and production configuration.

------------------------------------------------------------------------

# 59. FINAL PRODUCT TESTING --- REMAINING

Estimated time: **1--2 days**

Full end-to-end testing should cover:

-   Homepage
-   Globe
-   Destination pages
-   Planner
-   URL preselection
-   Personalization
-   Budget
-   Currency
-   Duration
-   Weather
-   Day regeneration
-   Favourites
-   Saving
-   Authentication
-   Database
-   Journey Library
-   Sharing
-   Mobile
-   Tablet
-   Desktop
-   Direct URL loading
-   Refresh behaviour
-   API failures
-   Empty states

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

## REMAINING FRONTEND

-   [ ] Destination-aware packing list
-   [ ] Travel logistics section
-   [ ] Enhanced cost transparency
-   [x] Journey Library UI
-   [x] Shareable journey page
-   [ ] Full accessibility pass
-   [ ] Final responsive QA
-   [ ] Final performance polish
-   [ ] Final visual consistency pass
-   [~] Empty/error/loading states where required — done for journeys/auth;
      not audited page-wide

## REMAINING BACKEND

-   [x] Backend project foundation (17 Sep 2026)
-   [x] Database foundation (Drizzle + SQLite, migrations on boot)
-   [x] Database schema — auth tables (user/session/account/verification)
-   [x] Authentication core (Better Auth: email/password + sessions)
-   [x] API error handling (central handler + JSON 404s)
-   [x] User accounts UI (sign-up/sign-in pages, session-aware navbar)
-   [x] Protected API routes (requireAuth middleware)
-   [ ] User preference persistence — no `user_preferences` table exists
-   [x] Journey CRUD API
-   [x] Persistent saved journeys
-   [x] Journey Library backend
-   [x] Public/shareable journey IDs
-   [x] Public journey API
-   [x] Destination API
-   [x] Structured itinerary data
-   [ ] Dynamic itinerary engine — still in `frontend/src/engine/`
-   [ ] Weather API integration — curated copy only, no provider
-   [ ] Map/route data integration — no mapping library in the project
-   [x] Backend validation
-   [x] Security hardening (rate limiting + helmet)
-   [x] Frontend/backend integration
-   [x] Backend testing (50 tests)
-   [~] Production deployment — config complete; **image never built**
-   [~] Production database — volume defined; never deployed to
-   [ ] End-to-end testing

------------------------------------------------------------------------

# 61. ESTIMATED REMAINING TIME

  Area                            Estimated time
  ----------------------------- ----------------
  Remaining frontend features          3--5 days
  Frontend final polish                1--2 days
  Backend foundation                       DONE
  Authentication core                      DONE
  Auth UI + protected routes           1--2 days
  Product tables + journey CRUD        1--2 days
  Dynamic itinerary engine             2--3 days
  Weather integration              0.5--1.5 days
  Maps/routes                          1--2 days
  Shareable journeys                     ~1 day
  Security/validation                    ~1 day
  Integration/testing                  1--2 days
  Deployment                             ~1 day
  Final QA                             1--2 days

**Overall realistic remaining scope: approximately 11--18 focused
working days** (was 14--22 before the 17 Sep 2026 backend session).

For a beginner simultaneously learning backend development, a practical
project window is approximately **2--3 more weeks**.

------------------------------------------------------------------------

# 62. RECOMMENDED DEVELOPMENT PHASES

## Phase 1 --- Finish frontend product layer — MOSTLY DONE

**Originally estimated 3--5 days**

Shipped:

-   Journey Library UI
-   Shareable journey UI (public `/shared/:slug`)
-   Accounts + library share controls (delivered under Phases 3 and 5)

Remaining:

-   Packing
-   Logistics
-   Cost transparency
-   Final visual polish

## Phase 2 --- Backend foundation — **DONE (17 Sep 2026)**

Delivered ahead of estimate in one session:

-   npm workspace, Express 5 + TypeScript, environment setup
-   Drizzle ORM + SQLite, committed migrations applied on boot
-   Base API structure (/api/health) + error middleware

## Phase 3 --- Accounts + persistence — **DONE**

Done (17--30 Sep 2026):

-   Authentication core — Better Auth email/password, DB-backed
    sessions, httpOnly cookies
-   Auth UI (sign-up/sign-in pages, session-aware navbar, sign-out)
-   Protected API routes (`requireAuth`)
-   `journeys` + `itinerary_days` tables
-   Journey CRUD + Journey Library backend

Still open, tracked separately: `user_preferences` persistence --- no such
table exists yet.

## Phase 4 --- Intelligent backend planner

**Estimated: 3--5 days**

Scope:

-   Structured destination data
-   Itinerary engine
-   Budget engine integration
-   Weather API
-   Route/location data
-   Dynamic itinerary response

## Phase 5 --- Product-level sharing --- **DONE**

**Originally estimated: 1--2 days**

-   [x] Public journey IDs (`share_slug`, a v4 UUID, never sequential)
-   [x] Shareable journey URLs (`/shared/:slug`, public, no auth)
-   [x] Public journey rendering (read-only page)
-   [x] Privacy/public controls (Share / Stop sharing per journey)

## Phase 6 --- Security + production --- MOSTLY DONE

**Originally estimated: 2--3 days**

-   [x] Validation (`journeyValidation.ts`)
-   [x] Security (rate limiting + helmet; the public read is an explicit
    field allowlist)
-   [x] API testing (50 tests passing)
-   [~] Deployment --- Dockerfile and compose written, but **the image has
    never been built**, as Docker was unavailable in this environment
-   [~] Database deployment --- volume defined, never deployed to
-   [ ] End-to-end QA
-   [ ] CI (builds and typechecks run locally only)

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
Homepage Globe Planner       Auth       Journeys   Itinerary
   │      │       │              │          │          │
   └──────┴───────┘              └──────────┼──────────┘
                                             │
                                         DATABASE
                                             │
                              ┌──────────────┼──────────────┐
                              │              │              │
                           Users         Journeys     Destinations
                                             │
                                      Personalization
                                             │
                              ┌──────────────┼──────────────┐
                              │                             │
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

**In progress** — accounts + database foundation live (Better Auth,
SQLite, Drizzle); saved journeys remaining

``` text
Planner
+
Accounts
+
Database
+
Saved journeys
```

## Stage 4 --- Intelligent travel product

**Remaining**

``` text
Personalization
+
Live weather
+
Location/route data
+
Dynamic itinerary engine
```

## Stage 5 --- Full portfolio-level product

**Target**

``` text
Luxury UI
+
Personalized planner
+
Real backend
+
Database
+
Authentication
+
APIs
+
Shareable journeys
+
Production deployment
```

------------------------------------------------------------------------

# 65. OVERALL SOLEN STATUS

Approximate current status (updated 17 Sep 2026):

**Frontend:** ~85--90% complete

**Backend:** foundation + authentication complete (roughly 30% of
backend scope). Persistence, itinerary engine, integrations and
deployment remain.

**Overall full-stack product:** ~70% complete

The existing frontend already provides the majority of the visible
product experience. The largest remaining value is not additional
decorative frontend features, but converting the existing planner into a
real persistent and data-driven application.

The final objective is for SOLEN to feel like a real luxury travel
product while also demonstrating meaningful full-stack engineering
capability.

------------------------------------------------------------------------

# 66. SCOPE PRIORITY

## Highest priority

1.  Auth UI + protected routes (the visible half of accounts)
2.  Journey CRUD API + ownership (persistent journeys)
3.  Journey Library UI on top of the API
4.  Dynamic itinerary engine (port of frontend/src/engine)
5.  API integration (destinations, weather)
6.  Shareable journeys
7.  Security hardening
8.  Deployment

## Medium priority

1.  Journey Library UI
2.  Packing list
3.  Travel logistics
4.  Cost transparency
5.  Route/map intelligence

## Final polish

1.  Accessibility
2.  Performance
3.  Mobile QA
4.  Error states
5.  Loading states
6.  Production QA

------------------------------------------------------------------------

# 67. SCOPE PHILOSOPHY

SOLEN should remain focused on the core promise:

> **A luxury travel concierge that understands how the traveller wants
> to feel, what they enjoy, where they want to go, how long they have,
> and how much they want to spend --- then turns those preferences into
> a considered journey.**

The remaining backend work exists to make that promise technically real.

The goal is not to add features simply to increase the feature count.

The goal is to move SOLEN from:

**"a beautiful interactive travel planner"**

to:

**"a complete, persistent, personalized full-stack travel product."**

------------------------------------------------------------------------

# 68. DOCUMENT HISTORY

-   **v2 — 17 Sep 2026:** repository restructured into a monorepo
    (pages/components/data/engine), backend foundation + Better Auth
    completed (Phases 2 + auth core of 3), statuses/estimates/priorities
    updated throughout.
-   **v1 — initial:** scope as carried over from the original
    development chat.
