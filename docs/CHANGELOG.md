# SOLEN Changelog

## Share controls and the public page · 2026-10-04

Closes the UI half of Phase 3. The API existed; nothing in the app could reach
it. Now the library can share, and `/shared/:slug` renders for a visitor who
has no account and no cookies.

### The public page is a separate route on purpose

`/shared/:slug` is deliberately not `/journeys/:id` in disguise. It is
registered as its own route so the anonymous view cannot inherit owner chrome
by accident — no account menu, no delete, no planner controls. It is read-only
by construction: there is no save, regenerate, or favourite affordance on it
at all, rather than one that is hidden on the owner's account.

The only way onward from the page is `Craft your own`, which points at the
planner. A stranger who likes the trip can start their own; they cannot take
someone else's.

### A revoked link says so plainly

`GET /api/shared/:slug` answers `404` once sharing stops, and the page renders
that as *"This journey is no longer shared."* — naming both likely causes, that
the owner stopped sharing it and that the link was copied incompletely. It
does not pretend the trip is still there, and it does not blame the visitor for
a link the owner burned.

`404` is treated as an ordinary outcome rather than an error, so it gets its
own calm state instead of a retry button. A genuine network failure still gets
the retry.

### Sharing is never optimistic

The button waits for the server and reports what came back. It does not flip to
"Stop sharing" and then quietly fail. If `POST /share` returns no slug, the
handler treats that as a failure rather than claiming success — a row that says
it is shared when the server disagrees is the kind of small lie this codebase
has kept refusing elsewhere.

One row is in flight at a time (`sharingId`), mirroring `deletingId`. Two rows
must never both look busy, and a failure has to restore only the row it
affected rather than the whole list.

### The public link sits outside the controls column

`.journeys-item-side` is `flex-shrink: 0`. A full URL rendered inside it forced
that column wide and squeezed the destination title into a narrow two-line wrap
— caught in the first screenshot pass. The link now renders on its own line
below the row, sharing the 760px measure of `.journeys-item-inner` so it still
starts on the same left edge as the title.

### Verified live

Nine click-path assertions driven through headless Chrome against the real
buttons, not the API: Share flips to Stop sharing, the link appears, Stop
sharing withdraws it, the withdrawn slug then `404`s, re-sharing mints a fresh
slug and restores the link, and the untouched row never changes. Plus the
public page rendered with no cookies at 1440px and 390px. `npm test` 50/50,
both linters, both builds, and backend `tsc --noEmit` all green.

## Shareable journeys, and the first public endpoint · 2026-10-03

Completes item 8 of the backend upgrade. `POST/DELETE /api/journeys/:id/share`
and a public `GET /api/shared/:slug`.

### The slug is a UUID on purpose

A public share URL is enumerable by construction. Had this been a counter, or
reused the row id, `/shared/1` and `/shared/2` would have handed every
anonymous visitor someone else's trip — the exact class of leak an earlier
hygiene pass was written to prevent. A v4 UUID has no ordering to walk.

`is_public` is a separate column rather than something inferred from the slug
being present, so a half-finished write can never publish a trip. Migration
`0004` is additive with safe defaults: existing rows come up unshared.

### The public read returns an allowlist, not the row

This is the first endpoint that answers a caller with **no session and no
owner cookie**, so the serializer enumerates what is allowed rather than
projecting what exists. Eight fields go out: `title`, `destination`,
`duration`, `travelStyle`, `budget`, `currency`, `createdAt`, `data`.

Four are held back on purpose:

- **`userId` / `ownerToken`** — these identify the *owner*. A share link must
  not tell a stranger who took the trip.
- **`isPremiumPlus`** — a paid tier flag. That is billing state, not travel
  content, and exposing it would advertise someone's purchase.
- **`id`** — the owner's row id, which is an unguessable capability for every
  other owner-scoped endpoint. Leaking it through a public URL would hand out
  that capability.

The `data` snapshot *is* returned: the itinerary days are the entire point of
the page, and the owner chose to publish them.

Sharing and unsharing are owner-scoped through the same `ownedBy()` predicate
as everything else, and a stranger gets **404, not 403** — a 403 would confirm
the journey exists. Unshare clears the slug rather than rotating it, so the
old URL dies at once, and a later re-share mints a fresh one.

Thirteen cases verified against a live server, including: the anonymous read
returns exactly the eight fields and nothing else; a stranger's share and
unshare attempts both 404 and leave the link live; unshare returns 204 and the
old slug then 404s; re-sharing mints a different slug; re-sharing while already
shared is idempotent.

### Two bugs the first tests found

Adding a test suite (50 tests, `node:test`, zero dependencies) immediately
paid for itself:

1. **`buildJourneyDays` crashed on an empty day list.** It indexes
   `personalized[0 % 0]` — undefined — and then reads `source.title`.
   Reachable: `createJourney` only checked that a destination had a *record*,
   not that it had day blocks, so a destination with an empty itinerary
   sailed past the guard that hygiene pass 5 added and hit a hard crash
   instead of the friendly "no itinerary data yet" message. Fixed in both
   places.
2. **`journey.days.map()` was unguarded** in the result screen, so a saved
   snapshot without `days` — now reachable from the library's `?journey=`
   deep link — blanked the planner. `normalizeJourney()` in the engine now
   fills the shape at the boundary where a journey enters state.

Both were invisible to lint, to the build, and to the seed-verification gate.

### Not done

The **UI**: no Share button on the library page, and no `/shared/:slug` page
to render one. The API is complete and verified.

## A signed-in state, a locked-down API, and a way to deploy it · 2026-10-03

The "make it real" track of `docs/BACKEND_UPGRADE_PLAN.md` — four items that
turn a working local prototype into something deployable.

### Sign-out was a correctness bug, not a missing feature

`/auth` always rendered the sign-in form. A visitor who signed in and later
came back had **no way to sign out at all** — `auth.signOut()` existed in the
API client and nothing called it. The app looked like it had accounts, with no
exit from one.

The page now checks the session on mount and shows a signed-in panel instead.
The editorial aside changes too: it used to say "Sign in to gather the
journeys you have designed", which is a small lie to someone already signed in.
It now says "Welcome back."

### Rate limiting where it mattered

Auth had unlimited login attempts. Two limiters now sit in front of the router,
deliberately different in strength:

- **auth** — 10 per 15 minutes, counting only *failed* attempts, so signing in
  normally never spends budget.
- **api** — 120 per minute, a loose ceiling against scripted amplification.

Keys are normalised with `ipKeyGenerator` so an attacker rotating IPv6
addresses inside one allocation cannot walk past the limit. `TRUST_PROXY` was
added because behind a real reverse proxy every visitor otherwise shares the
proxy's IP — meaning one person's burst eventually locks out everyone. Helmet
goes on in production for CSP, HSTS and `nosniff`.

This added `helmet` and `express-rate-limit` as dependencies — a deliberate
exception to the dependency-free rule that governs `journeyValidation.ts`.
Writing a correct rate limiter is exactly where that rule should yield.

### One container, not two

`Dockerfile`, `docker-compose.yml` and `.dockerignore` are new. The image
builds the frontend, builds the backend, and serves **both** from one Express
process — so the browser sees a single origin and the httpOnly session cookie
keeps working with no CORS and no token in JS, the same property the Vite dev
proxy provides locally.

That rules out serverless, and it is stated plainly in `docs/DEPLOYMENT.md`:
SQLite needs a persistent volume, so this targets Fly/Render/Railway/VPS.

### Three defects that passed lint and build

1. `app.get('*')` is a **syntax error in Express 5** — path-to-regexp v8 wants
   a named wildcard. The server refused to boot; nothing static caught it.
2. The SPA path resolved one level too high, pointing at
   `C:/Users/Admin/PROJECTS/frontend/dist`. Caught in the startup log.
3. `border-bottom` on a `<button>` does **not** clear the user-agent border —
   the other three sides survived and the sign-out control rendered as default
   OS chrome. Caught in a screenshot.

### A caching bug that would have bitten quietly

`frontend/public/**` images keep their filenames through the Vite build, so
marking them `immutable` for a year meant a replaced hero photo could never
reach anyone. Now only fingerprinted bundles (`index-BDnBSupJ.js`) get the
long cache; public assets revalidate hourly and `index.html` is `no-cache`.

### Honest gaps

The container image has **never been built** — Docker was unavailable here. The
code it runs was verified in production mode route by route: client routes
return HTML, `/api/*` returns JSON, unknown `/api/*` returns a JSON 404 rather
than an HTML page, and cache headers match the table above. The `Dockerfile`
itself is unexercised. Graceful shutdown is wired but unproven, because
Windows does not deliver signals to another process. Both are recorded in
`docs/DEPLOYMENT.md` §7.
## A journey library you can actually open and delete · 2026-09-30

Phase 2 Steps 1–2 of `docs/BACKEND_UPGRADE_PLAN.md`. The journeys API was
finished and the planner wrote to it — but no screen anywhere listed a saved
journey, so "save" ended at a toast nobody could return to.

### Why Open is a deep link, not a resume call

The obvious wiring is to point Open at the planner's existing resume path. That
is wrong: `loadLatestJourney()` returns `rows[0]`, always the **newest**
journey. Every row except the first would open the wrong trip — invisible in a
demo with one journey, wrong for anyone with a few.

Open now navigates to `/planner?journey=<id>`. This matches the preselection
the planner already supports (`?destination=`, `?experience=`), and because the
id is in the URL it survives a reload and can be linked to. `loadJourneyById()`
deliberately returns nothing rather than falling back to localStorage: a caller
naming one row wants that row or nothing, and quietly handing back a different
journey is how a page ends up confidently showing the wrong trip.

`applyJourney()` was pulled out of `handleResumeJourney` so both resume paths
share one block of setters and cannot drift. While a deep-linked journey is
open, the generic "Resume saved journey" button is hidden — it loads the
newest journey, which is a *different* one from the screen.

### Deleting a journey that could come back

The offline fallback keeps a copy in localStorage, and resume falls back to
it. Delete the row and the journey could quietly reappear. The local copy
stores no id, so there is nothing exact to match on: `deleteJourneyById()`
compares a coarse signature — destination, duration, travel style — and clears
the local copy only when it matches.

That is a heuristic and is documented as one. Two journeys to the same
destination with the same length and style are treated as the same journey,
which is the right way round to be wrong: it may clear a local copy that did
not need clearing, rather than leave a deleted journey alive. Deleting from
the library deliberately does **not** call `clearSavedJourney`, which wipes
localStorage outright and would destroy a different journey's fallback.

### A journey saved only here

`hasLocalPending()` existed but was never called. The library now says so
plainly when a journey is stored in this browser only and never reached the
account — otherwise the traveller believes it is saved, clears their browser,
and loses it. The planner already told the truth per save; this is the same
truth about a journey that is already gone from the list.

### Two bugs a screenshot caught and the compiler did not

Disc bullets rendered beside every journey title, because a `<ul>` needs its
list-style reset. And a saved Maldives trip read "Maldives — **to** days":
the API had correctly returned "10 days", but Cormorant's oldstyle figures
render `1` like a `t`. The heading now shows the destination and the numbers
live in the facts row in Inter, where digits are unambiguous. A journey with
a real custom title still keeps it.

### Not done

Nothing links to `/journeys` yet, so it is reachable by URL only. The obvious
home is beside "Sign in" in the navbar — but that is a locked surface, and
per the design skill any change there has to be proven by re-shooting the
affected baselines. Left as a separate, screenshot-gated step rather than
bundled in here.

## Destination content loads in one request · 2026-09-30

Completes Phase 1 of `docs/BACKEND_UPGRADE_PLAN.md`: the travel content
now lives in the database, and the pages that render it read it from the API
instead of importing JavaScript bundles directly.

### The fan-out this removes

The homepage, the globe, the planner and the destination detail page all need
the same underlying data, so `destinationSource.js` fetched a list and then
issued **one request per destination** — eight round trips before anything
rendered. `GET /api/destinations/all` returns every destination with its day
blocks in a single response (18.8 KB uncompressed), and the client makes
exactly **one** request.

The database work is unchanged in kind and much better behaved: `destination`
rows are read once, then all day blocks are fetched in a single grouped
`inArray` query and grouped by destination id. That is two queries total,
regardless of how many destinations exist.

### Why the fallback is narrow on purpose

`destinationSource.js` still retries the old per-destination reads, but **only
when `/destinations/all` returns 404 specifically**. That is the signature of a
frontend newer than the backend — a deploy-skew state, where the retry is
correct. Any other failure (500, network down, malformed body) rethrows to the
bundled data instead, because silently masking a server fault is how a cache
ends up serving confidently wrong content on a page that looks fine.

Verified by stubbing `fetch`: one request on the happy path, and a clean
degradation to the eight-request path when the aggregate is 404'd.

### The Amalfi Coast marker no longer 404s

`globeDestinations.js` shipped the slug `amalfi` while the detail route is keyed
`amalfi-coast`, so clicking the Amalfi Coast marker on the globe landed on the
not-found page. Both sides now resolve legacy slugs through an alias table, so
existing links keep working and the globe marker lands on real content.

### Serialization cannot drift

The aggregate endpoint and the single-destination endpoint share one
serializer in `destinationController.ts`. They were byte-identical when
verified, and there is now no code path where they could disagree.

### Content still has a fallback, deliberately

The four JavaScript bundles are still shipped. They are the payload the client
falls back to, so removing them would remove the ability to render the site
when the API is unreachable. That is a real trade — a single source of truth
versus offline resilience — and it deserves a deliberate decision rather than
being settled by tidying up files nobody remembers the reason for.

`plannerOptions.js` was never part of this migration: it holds durations,
styles, interests and currencies rather than destination content, so the
database has no home for it and `TripPlanner.jsx` and `engine/personalization.js`
still import it directly.

## Planner saves now hit the API — localStorage becomes the fallback · 2026-09-27

Closes the loop opened by the journeys API and the auth page: the planner
was still writing exclusively to `localStorage`, so a signed-in
traveller's journey did not follow them to another browser, and signing
in had nothing to attach.

### The storage decision

`frontend/src/api/journeyStorage.js` is the only module that touches
localStorage now. The API is the source of truth; localStorage is a
fallback so a ten-minute wizard session is never lost to a 502. §47
keeps public planning usable without an account, and that obligation
outweighs the tidiness of a single storage path.

The fallback is **one-way per session and not replayed** later. Once a
save lands locally we cannot know whether the API row it would duplicate
already exists, so replaying risks duplicates; keeping a local save
risks nothing the traveller cannot redo. Deliberate, not an oversight.

The localStorage key is unchanged, so anyone who saved a journey before
this change keeps it.

### Honest confirmation copy

The button used to say "Saved to this browser ✓" unconditionally. It now
reports where the save actually landed — *"Saved to your library ✓"* on
the API path, *"Saved to this browser ✓"* on the fallback. Claiming a
cloud save that didn't happen is the kind of small lie that erodes trust
in a save button permanently.

### Idempotence and double-save

Save is now an async round trip, so two fast clicks could fire two
`POST`s and create duplicate rows. `isSaving` disables the button for the
duration, and the disabled style cancels the `:hover` fill that would
otherwise imply a live control (`.journey-save-button:disabled:hover`).

`handleClearSavedJourney` now deletes the API row via the stored
`savedJourneyId`. Without that id it would have cleared the browser copy
while leaving the journey in the account — "Remove saved journey" that
doesn't remove it.

### Two lint issues, both worth noting

- **The import shadowed state.** `import { hasSavedJourney }` collided
  with the existing `const [hasSavedJourney, setHasSavedJourney]`, which
  is why the name is now aliased `hasAnySavedJourney`.
- **A suppression moved rather than disappeared.** The old
  `eslint-disable-next-line react-hooks/set-state-in-effect` covered the
  synchronous `setHasSavedJourney(Boolean(saved))`. Making that call
  async (inside a promise callback) left the directive suppressing
  nothing, and the rule then fired on the next `setState` in the effect —
  a pre-existing line, not a new problem. The directive moved to where
  the rule actually reports.

### Verified

ESLint clean, Vite build clean (282 modules, main chunk 331 kB). In a
real browser against the real proxy, exercising the actual module the
page imports: `saveJourney` returned `target: "api"` with a row id, the
row was confirmed in `solen.db` (correct columns, `data` snapshot
180 bytes, cookie-scoped as designed), `loadLatestJourney` returned
`Kyoto` with `isPremiumPlus: true` and `favoriteDays: [1, 3]`, and the
resume button appeared after a full page reload. With the API stopped,
`saveJourney` returned `target: "local"`, wrote to localStorage, and
still resumed. Test rows removed; API restarted.

## Sign in / create account page — the first screen a visitor can actually reach · 2026-09-27

The auth API and journeys endpoints existed, but nothing in the product
linked to them: the journey data was still `localStorage`-only and there
was no sign-in UI at all (scope §47 listed "Frontend auth UI" as
remaining). This adds the page, and an entry point in the nav.

### Design

One page, two modes, rather than `/login` and `/register`. A traveller
who arrives to sign in and is then bounced to another URL to register is
friction for no benefit on a form this small, and it halves the surface
to keep in step.

Mirrors the house language rather than importing `HomePage.css` — same
call `NotFoundPage` made, for the same reason (importing a locked page's
stylesheet is what left the old `Navbar` broken):

- oatmeal ground, plum accent, Cormorant Garamond display + Inter copy
- hairlines, not shadows; square corners, no `border-radius`
- inputs copy the `.planner-currency` rules exactly, including an
  explicit `font-family` — a bare `<input>` falls back to the UA font,
  which is the same defect that made the currency select read as OS
  chrome
- the tab underline grows from the left, the same restrained move the M4
  stepper uses for its active step
- asymmetric two-column layout: an editorial counterpoint ("Every
  journey you craft, *kept*.") beside the form, so the page doesn't read
  as a centered SaaS login box

### The one deliberate omission

No `better-auth/react` client. It would add a session store and context
provider for what is currently two POSTs and a session check — and it
would put a copy of the session token in the JS bundle, cutting against
the httpOnly-cookie decision the backend already made. `api/client.js`
calls the same endpoints directly. Revisit if session state genuinely
needs to be shared across the tree.

### Error copy

Failed sign-in reads *"That email and password combination did not match
an account."* — deliberately vague, because distinguishing "no such
email" from "wrong password" would let anyone enumerate which addresses
have accounts. The backend returns one generic string for that reason and
the UI must not undo it. Status codes and raw upstream strings never
reach the user; `authErrors.js` maps to sentences instead.

### Two bugs the screenshot caught

- **A missing closing brace.** An edit truncated the `.auth-field input`
  rule, so `.auth-submit` and everything after it were parsed as
  declarations *inside* that rule. ESLint and the build both passed
  cleanly — the CSS is valid, just semantically wrong. The tell was
  visual: the submit button rendered as a **default blue browser
  button** and the "Create an account" link lost its border. Found only
  by looking at a screenshot, which is the argument for taking them.
- **A duplicated CSS tail.** The recovery edit re-appended 36 lines that
  already existed, leaving the file with an unmatched brace. Caught by
  counting braces (46 open / 47 close) rather than by eye.

### Mobile

`--window-size=390` on headless Chrome does **not** give a 390px
viewport — it clamps to 500px, which produced a screenshot that looked
like the form was cut off. It wasn't. Verified properly with
`Emulation.setDeviceMetricsOverride`: no horizontal overflow at 360 /
390 / 768 / 1440, and the aside is hidden below 900px as intended.

### Verified

ESLint clean, `tsc --noEmit` clean, Vite build clean (281 modules, main
chunk 324.5 → 330.5 kB). Signup exercised through the Vite proxy
(`POST localhost:5199/api/auth/sign-up/email` → 200). Both tabs, the
error state, and the mobile layout captured and inspected. Test accounts
and rows removed from the dev database; temp scripts and screenshots
deleted; API server stopped.

## Journeys API + the dev-port/Origin bug that would have broken sign-in · 2026-09-27

First backend product work. New `journey` table + five endpoints, built so
the frontend can switch from `localStorage` to the API without reshaping
anything. **No new dependencies** — hand-rolled validation rather than
pulling in Zod, so that stays a deliberate choice.

### 1. Sign-in would have failed on the first attempt (the real find)

`auth.ts` hardcoded `trustedOrigins: ['http://localhost:5173', …]`, but
the frontend dev server runs on **5199** (`strictPort` now pinned, see
below). Better Auth validates the browser's `Origin` header against that
list as CSRF protection, so the first sign-in would have been rejected —
presenting as a confusing origin/CSRF error rather than the config typo it
actually was. The comment above that line even explained *why* the list
existed; it had just never been exercised, because the frontend had never
made a single API call.

- `frontend/vite.config.js` — pinned `port: 5199` + `strictPort: true`, so
  the port can't silently drift back to Vite's default.
- `backend/src/config/env.ts` — `FRONTEND_PORT` (default 5199) builds the
  origin list; `TRUSTED_ORIGINS_EXTRA` appends any others.
- `backend/src/auth/auth.ts` — reads `env.trustedOrigins`.

Verified: signup from `Origin: http://localhost:5199` → `200`; a foreign
origin is still refused.

### 2. Anonymous saves, because §47 keeps planning open without an account

§47 requires public trip planning to work signed-out, so `journey.user_id`
is **nullable** and anonymous rows are scoped to a random `solen_owner`
httpOnly cookie. The token is a per-browser handle, not a credential — it
grants no account access. `POST /api/journeys/claim` adopts those rows at
sign-in, so a journey saved before signup isn't lost.

Every query goes through one `ownedBy()` predicate; there is deliberately
no "fetch by id and return it" path, which is the usual source of IDOR
bugs. A signed-in user **never** falls back to their cookie token, so they
cannot read a stranger's cookie-scoped row. Non-owners get `404` (not
`403`) on read, write and delete, so the API never confirms that someone
else's journey exists.

### 3. Storage shape

The journey object is deeply nested, so the request body is stored
verbatim as JSON in `data` — returned under `data`, unchanged, so
save→resume round-trips with no client reshape. The fields worth
filtering or sorting on are promoted to real columns
(`title`, `destination`, `duration`, `travelStyle`, `budget`, `currency`,
`isPremiumPlus`) with a `(user_id, created_at)` index, since listing is
always "this owner's, newest first".

Accepts both a flat journey object and the planner's existing
`{ journey, isPremiumPlus, favoriteDays }` envelope.

### Two bugs caught by testing, not by the compiler

Both were invisible in the types and wrong on the wire:

- The snapshot read `source.journey` *after* `stripReserved()` had
  removed that key, so every save silently stored the bare envelope
  instead of the journey. Found by asserting on a round-trip, not by
  reading the code.
- The same strip was also dropping `isPremiumPlus` from the envelope
  override, so premium saves came back `false`. Column values now come
  from the journey object with envelope fields layered on top, while the
  snapshot keeps the whole body.

### ⚠️ `schema.ts` is now two zones

The Better Auth CLI **rewrites** `schema.ts` wholesale and would delete
the hand-written `journey` table. The file now carries a prominent
warning and a `JOURNEY ZONE` marker. Before running
`auth:generate-schema`, copy the journey section out and paste it back.
Flagged in `backend/README.md` too.

### Verified

`tsc --noEmit` and ESLint clean on both packages; frontend build
unchanged (324.67 kB main). Against a live server: anonymous create →
list → resume, cross-browser read blocked, second account sees 0 rows and
gets 404 on foreign GET/DELETE, foreign DELETE leaves the row intact,
claim returns 1 then 0 (idempotent), PUT updates columns, DELETE → 204,
bad `duration` → 400. Deleting a test user cascaded its claimed journeys.
All test rows and accounts removed from the dev database afterwards.

## Visual polish pass — the two OS-drawn controls, the clipped scroll hint, and a nav that survives the scroll · 2026-09-26

No new dependencies, no shadcn, no Tailwind. Everything below is
hand-rolled on the existing CSS and motion tokens.

### 1. The budget slider was OS chrome, not SOLEN

`TripPlanner.css` gave the slider `accent-color: #4a1942` and stopped
there. That paints the track and thumb from the UA's own slider
rendering — the one control on the page that could not be made to match
the hairline editorial system. Replaced with an explicit 1px rail and a
14px plum dot, cross-browser:

- `::-webkit-slider-runnable-track` / `::-moz-range-track` — the 1px
  rail, with `border: 0` because Chrome draws its own above this.
- `::-webkit-slider-thumb` — `margin-top: -6.5px` centres the dot on
  the 1px rail; without it the thumb sits visibly low.
- `appearance: none` on the input and on the WebKit thumb, plus an
  explicit 18px height so the *hit target* stays generous even though the
  rail is 1px. A 1px-tall range input is a touch-target failure, so the
  rail is drawn thin but the element is not.
- `accent-color` removed from the first `.planner-budget-slider` block;
  leaving it would have re-introduced the UA paint the later block exists
  to replace.
- hover *and* `:active` states on both pseudo-elements (the previous
  hover rules covered only the pseudo-element, so the pressed state had
  no feedback at all).

**Page where:** planner, step 5 "What would you like to spend?".

### 2. The currency select was the only element not using Inter

`.planner-currency select` set `border`, `background`, `color` and
`padding` but **no `font-family`** — so the control rendered in the
browser's default UI font while every other glyph on the page was
Inter. This is the defect that made the planner read as "generic UI
bolted onto an editorial page"; the missing font was the clearest part
of it. Fixed by setting the family explicitly, dropping the OS arrow via
`appearance: none`, and drawing a hairline chevron as a background SVG
so the closed control matches the 1px rules used everywhere else.

**Honest limit:** the *popup list* is still rendered by the OS and
cannot be styled — `appearance: none` only changes the closed state,
which is what the page actually shows. Turning the select into a custom
listbox would be the fuller fix, but that is real behaviour work
(roving tabindex, `aria-activedescendant`, typeahead, outside-click,
Escape) and it is not a "little visual improvement". Flagged for the
backend phase, not faked here.

`.planner-currency select:focus` became `:focus-visible` so a
mouse click on the control no longer leaves a focus ring parked on it.

### 3. The hero's "Scroll to discover" label was clipped off-screen

`transform: rotate(-90deg)` with `transform-origin: right bottom`
rotated the label *below* its own anchor point. The hairline happened to
land in view and the text ran off the bottom edge, so the hero showed a
stranded "…VER" in the corner — visible in every screenshot of the
homepage hero.

Fixed by not rotating the box at all. The element stays in normal flow
(asymmetric `right`/`bottom` offsets now mean what they say), the label
itself goes `writing-mode: vertical-rl` + `rotate(180deg)` to read
bottom-to-top, and the rule becomes a 1px × 45px vertical hairline. The
flex direction is `column-reverse` so the line sits above the label,
matching the original left-to-right reading order once rotated.

**Page where:** homepage hero, right edge.

### 4. The nav scrolled away and then, on some pages, was unreadable

`.navbar` was `position: absolute`, so it was gone the moment you left
the hero. Made it `fixed` with a scroll-state swap, toggled at 40px:

- `HomePage.jsx` — a `useRef` on the `<header>` plus a passive,
  rAF-throttled scroll listener that toggles `.is-solid`. Matches the
  `ProgressRail` pattern already in the codebase (passive listener,
  rAF throttle, class toggle rather than inline styles).
- `HomePage.css` — `.navbar.is-solid` sets a cream `rgba(250,247,241,.92)`
  ground with a blur, a 1px `rgba(74,25,66,.08)` rule (hairline over
  shadow), and flips `color` to ink. `background-color`, `box-shadow` and
  `color` all transition, so the swap is never a hard cut.
- `.hero-wordmark` — was hardcoded `color: var(--cream)`; now inherits
  so it tracks the swap. Its `text-shadow` (a legibility scrim for the
  transparent-over-photo state) is removed in the solid state, where it
  would read as a smudge on cream.
- `.nav-cta` — `border-bottom` was hardcoded `rgba(250,247,241,.65)`;
  now `1px solid currentColor` at 0.85 opacity, so the rule tracks the
  colour too.

`position: fixed` is a real change and worth naming: the bar now persists
over *every* section, so it had to be readable on all of them. Cream
links on a cream page would have been invisible, which is exactly why the
ink swap is part of this rather than an afterthought.

**Verified:** hero at `scrollY` 0 (transparent, cream type over the
photo) and scrolled past the hero (solid cream bar, ink type, hairline
rule).

## Hygiene pass 7 — the M4 stepper no longer hides its own buttons badly · 2026-09-23

Track A item A8. The stepper marked its inactive panels
`aria-hidden="true"` while those panels still contained a focusable
`<button class="m4-stepper__cta">Discover</button>` — focusable content
inside an aria-hidden subtree. Assistive tech was told "ignore this"
while the keyboard was told "you can tab here", and the buttons were
pushed off-screen horizontally at the same time.

**Code where:** `frontend/src/pages/home/m4Stepper.js`.
- `applyStep()` now sets `inert` alongside `aria-hidden` (and removes it
  from the active panel), so the hidden panels' buttons leave the tab
  order and stop accepting pointer events.
- `detach()` — the reduced-motion path — now clears both attributes from
  every panel. That matters: the reduced-motion CSS stacks all four
  panels *visibly*, so leaving them hidden from assistive tech and inert
  would have made the very panels it displays unreachable. Without this
  line, the fix for the pinned layout would have introduced a worse bug
  in the calm layout.

**Page where:** homepage, section 04 EXPERIENCES. Tab through it: only the
visible step's "Discover" button takes focus. With
`prefers-reduced-motion: reduce`, all four stacked panels are reachable
again.

**Before → after:** four tab stops for four panels — three of them
off-screen inside an `aria-hidden` subtree → one tab stop for the visible
panel, and all four under reduced motion.

**Verification:** headless DOM dump of the built homepage. 4 panels:
exactly 1 with `aria-hidden="false"` and no `inert`; 3 with
`aria-hidden="true" inert=""`; **0** with `aria-hidden="true"` and no
`inert` — the defect pattern is gone. The reduced-motion path was checked
separately: with the preference forced, the stepper never attaches and no
panel carries either attribute, so all four remain reachable. lint +
build clean.


## Hygiene pass 6 — same-app navigation no longer reloads the page · 2026-09-23

Track A item A12. Three internal destinations were plain browser
navigations, so the whole SPA was torn down and rebuilt for a move the
router could have made in place:

- the homepage planner CTA, `<a href="/planner">`
- the destination page's "Plan a Journey Here" button
  (`window.location.href = '/planner?destination=…'`)
- the homepage wordmark, `<a href="#">`, which also appended a stray `#`
  to the URL

**Code where:**
- `frontend/src/pages/home/HomePage.jsx` — the wordmark and the planner
  CTA are now `<Link to>` (the file already imported `Link` since hygiene
  pass 2).
- `frontend/src/pages/destination/DestinationDetail.jsx` — `useNavigate`
  plus `navigate('/planner?destination=<slug>')` instead of assigning
  `window.location.href`; the button also gained an explicit
  `type="button"`.

**Page where:** homepage → "Build My Journey" (or the SOLEN wordmark);
any destination page → "Plan a Journey Here".

**Before → after:** full document reload (blank flash, the globe chunk
and 7 MB of textures re-downloaded, in-memory state and scroll lost) →
instant client-side route change with the wizard pre-filled.

**Verification:** headless Chrome driving a same-origin iframe, with a
marker planted on the iframe's `window` that a document reload would
destroy. 404 page → planner Link: marker survived, path `/planner`,
planner hero rendered. Kyoto page → "Plan a Journey Here": marker
survived, URL `/planner?destination=kyoto`, and Kyoto is preselected on
step 1. Homepage DOM check: the wordmark renders as `a.brand[href="/"]`
and the CTA as `a.button.planner-button[href="/planner"]` (react-router
`data-discover` present), with no raw `<a href="/planner">` left. lint +
build clean.


## Hygiene pass 5 — the planner can no longer dead-end · 2026-09-23

Track A item A7. `createJourney()` returns `null` when the chosen
destination has no itinerary data (`itineraryData[destination]` missing).
The wizard still advanced to step 6, so the crafting screen finished and
then rendered **no step content at all** — a "YOUR JOURNEY 5 / 5"
progress bar above an empty area, with no message and no way out.
Unreachable today (the planner's destination list and `itineraryData`
agree), which is precisely the drift a destinations API will introduce
later — so it was a guard waiting to misfire.

**Code where:**
- `frontend/src/pages/planner/TripPlanner.jsx` — new `craftError` state;
  one `craftJourneyOrFail()` helper now owns the outcome for both the
  initial craft **and** "Regenerate Journey", so neither path can land in
  a wordless dead end; a new error screen (eyebrow, headline, the reason,
  and two exits — "Choose another destination" and a router link home)
  rendered between the crafting screen and the results; `craftError` is
  cleared on Start Over and Edit Preferences.
- `frontend/src/pages/planner/TripPlanner.css` — one additive rule,
  `.planner-recovery`, positioning those two exits. The error screen
  reuses the existing `.planner-crafting` chrome (glow, centring,
  entrance fades), so no locked planner styling changed.

**Page where:** `/planner`. Completing the wizard normally is unchanged;
if a destination ever lacks itinerary data, `/planner` now explains why
instead of going blank.

**Before → after:** crafting ends → empty step area under "YOUR JOURNEY
5 / 5"; crafting ends → a named error with the reason and two ways
forward.

**Verification:** real end-to-end runs against the built preview, driving
the actual planner through a same-origin iframe and reading the result
out of the DOM (headless Chrome DOM dumps). Happy path: five steps
selected → 7 day-cards rendered, no error screen, total estimate present.
Error path: a temporary eighth destination with no itinerary data → the
error screen renders with the exact heading and copy and **no** results.
The temporary data change was reverted (working tree clean). lint + build
clean.


## Hygiene pass 4 — broken-route handling · 2026-09-23

Track A item A6. Two ways to reach nothing:

1. An unknown URL matched no route at all, so the page rendered only the
   site-wide stage layers (ambient dust + progress rail) — an empty
   oatmeal page with no heading and no way back.
2. An unknown destination slug rendered **Kyoto's** editorial page
   (`destinationEditorial[slug] || destinationEditorial.kyoto`) —
   confidently wrong content on a truthful URL.

**Code where:**
- NEW `frontend/src/pages/notFound/NotFoundPage.jsx` + `.css` — an
  additive page in the brand language (oatmeal ground, plum accent,
  Cormorant display + Inter copy): SOLEN wordmark top-left, 404 eyebrow,
  headline, and two ways out (home, planner). Its CSS is co-located and
  mirrors the locked `.button` / `.planner-button` values rather than
  importing `HomePage.css` — that cross-page stylesheet import is
  exactly the coupling that left the old `Navbar.jsx` broken.
- `frontend/src/AppRoutes.jsx` — `import NotFoundPage` plus a catch-all
  `<Route path="*" element={<NotFoundPage />} />` after the three real
  routes.
- `frontend/src/pages/destination/DestinationDetail.jsx` — the silent
  Kyoto fallback is gone: the lookup is `destinationEditorial[slug]`,
  and an unknown slug renders `<NotFoundPage />` **at the same URL** (no
  redirect, so the URL stays truthful). The early return sits *below*
  the M2 `useEffect` so hook order stays stable. No locked markup, type
  or colour was touched for valid slugs.

**Page where:** visit any address that doesn't exist, e.g.
`/this-page-does-not-exist`, or an unknown slug, e.g.
`/destinations/nonsense-slug`. Both now show the 404 page with a working
way back.

**Before → after:** blank page with no navigation → designed 404 with two
exits; `/destinations/anything` showing Kyoto → a real 404.

**Verification:** headless Chrome DOM dumps of the built preview —
`/this-page-does-not-exist` renders the not-found page including the
"Back to SOLEN" and `/planner` links; `/destinations/nonsense-slug`
renders the not-found page and contains **no** `m2-title` (no Kyoto
leak); `/destinations/kyoto` still renders the locked editorial page
(`m2-title` present, four "Kyoto" headings, the "Plan a Journey Here"
CTA, original intro copy intact). lint + build clean.


## Hygiene pass 3 — one designed keyboard focus ring · 2026-09-23

Track A item A5. Focus styling was almost absent site-wide: grepping the
frontend found only five `:focus` rules — the globe labels/chips
(`SolenGlobe.css`) and the planner currency `<select>`. Every button,
card, nav link, chip and route stop leaned on the browser's default UA
outline, and on the dark chapters even that was invisible.

**Code where:** `frontend/src/styles/index.css` — one global
`:focus-visible` rule (2px `#4a1942` plum, 3px offset) plus a cream-ring
override for dark grounds: `.feeling-section`, `.footer`,
`.solen-globe-stage`, and `.m4-stepper.is-dark` (the stepper's ground
goes dark past ~58% progress, where a plum ring would disappear).

**Page where:** everywhere. Tab through any route — homepage nav, the
seven destination cards, the feelings list, the M4 stepper CTA, the
globe chips, the planner options, the journey action buttons.

**Before → after:** browser-default outline (on plum chapters, an
invisible one) → one intentional plum ring that flips to cream on dark
grounds.

**Verification:** computed styles read from the built bundle in headless
Chrome using `focus({ focusVisible: true })` — a plain button reports
`rgb(74, 25, 66) | 2px | 3px`; a button inside `.feeling-section`
reports `rgb(250, 247, 241) | 2px | 3px`; a button inside
`.m4-stepper.is-dark` reports the same cream. lint + build clean;
main CSS bundle +0.21 kB.


## Hygiene pass 2 — destination cards are real links · 2026-09-23

Track A item A4. The homepage's seven destination cards were
`<article onClick={…}>` — navigation only a mouse could reach: no link
role, no focus target, nothing for a screen reader to announce, and no
href for anything that doesn't run React.

**Code where:** `frontend/src/pages/home/HomePage.jsx`.
- `<article>` → `<Link to={…}>` (react-router) keeping the identical
  `destination-card destination-N` class list and identical inner markup,
  so every locked style rule still applies: `.destination-N` grid
  placement, `.destination-card:hover` image scale and arrow rotation.
  An `<a>` that is a grid child is blockified, so the layout is untouched.
- The decorative `↗` arrow is now `aria-hidden="true"` — it was being
  announced as a stray "north-east arrow" inside every card.
- Import line: `useNavigate` → `{ Link, useNavigate }`. `navigate` is
  still used by the feelings list and the M4 stepper CTA.

**Page where:** homepage, section 02 DESTINATIONS. Tab through the page:
the seven cards now take focus in order and Enter opens them. They also
carry real hrefs, so they degrade gracefully without JavaScript.

**Before → after:** mouse-only `<article>` → focusable, Enter-activatable
router link with a real `/destinations/<slug>` href. No visual change —
only the browser's default focus ring now appears on focus (a designed
ring is the next commit).

**Verification:** headless Chrome DOM dump of the built preview — 7
`destination-card` elements render as `<a>`; hrefs resolve to
`/destinations/amalfi-coast`, `/bali`, `/iceland`, `/kyoto`,
`/maldives`, `/morocco`, `/paris`; no card `<article>` remains (the only
`<article>`s left in the DOM are the M4 stepper panels). lint + build
clean.


## Hygiene pass 1 — responsive layer: 10 dead selectors removed · 2026-09-23

Track A (hygiene & correctness) opened. First finding: `responsive.css`
carried rules whose class names match **no element in the codebase** —
leftovers from before the M4 stepper, the Section 05 v4 globe rewrite
and the planner's class renames — plus one genuine typo
(`.destination-section` vs the real `.destinations-section`).

**Code where:** `frontend/src/styles/responsive.css`. Removed every
selector that matched nothing (audited against all `*.jsx`/`*.js`):
`.destination-section` ×3 (typo — never matched), `.experience-grid` ×2
(superseded by `.m4-stepper`), `.planner-travel-styles` ×3 (step 3
renders `.planner-durations`), `.planner-style-option`,
`.planner-budget`, `.planner-budget-row`, `.planner-craft-button` (the
craft button is `.planner-continue`), `.solen-globe`,
`.solen-globe-orbit`, `.solen-globe-destination-list` (all three retired
by the globe v4 sidebar removal).

**Page where:** every route at tablet (≤900px), mobile (≤700px) and
small-phone (≤480px) widths. Nothing should look different — none of
the deleted rules could ever have applied.

**Before → after:** identical pixels, 50 fewer lines, main CSS bundle
60.76 kB → 60.16 kB (gzip 11.27 → 11.17 kB).

**Judgement call — why the typo was deleted, not fixed:** renaming
`.destination-section` → `.destinations-section` would have newly applied
`padding: 80px 6vw` at ≤700px and, at ≤650px, overridden `HomePage.css`'s
own `.destinations-section { padding: 0 6vw 110px }` (responsive.css is
imported *after* the page CSS, so it wins on equal specificity). That
would be a silent redesign of a LOCKED page — and the intent is already
served by `HomePage.css`, so the rule was removed instead.

**Verification:** dead-selector audit re-run → **0 of 60** selectors in
the file unmatched (was 10); `npm run lint` clean; `npm run build`
clean. Method: extract `.class` tokens from the file, test each against
the concatenated JSX/JS sources with word-boundary regexes.

## Spin for everyone — reduced motion no longer teleports · 2026-09-21

User report after the spin fix: still teleports on their PC. Prime
suspect: Windows "show animations" off makes Chrome report
`prefers-reduced-motion: reduce`, and the reduced branch of `spinTo`
deliberately jumped instantly.

**Code where:** `frontend/src/components/globe/SolenGlobe.jsx` — the
instant-jump branch is gone. The spin-to arc now animates for
everyone: it is user-initiated navigation feedback (an accepted
reduced-motion exception, and explicitly requested by the user).
Reduced motion still freezes the autonomous motion only (ambient
spin, cloud drift).

**Page where:** home section 05, on machines with OS animations
disabled — hover now turns the globe instead of teleporting.

**Before → after:** reduced-motion hover = instant jump → eased
1.1s turn.

**Verification:** emulated `prefers-reduced-motion: reduce` headless;
time-probe shows a still ambient globe, an intermediate frame
mid-flight, then a stable arrival. Lint + build clean.

## Globe spin fix — arc, not jump · 2026-09-21

User report: hovering/clicking a chip made the globe lag and *jump*
to the destination instead of turning. Three causes, three fixes:

**Code where:** `frontend/src/components/globe/SolenGlobe.jsx` +
`.css`.
1. react-globe's built-in `focus` tween lerps the camera through
   space in a straight chord and zooms in — reads as a jump. Replaced
   with `spinTo`: an eased 1100ms great-circle arc at the CURRENT
   radius (nlerp of camera direction), controls locked during the
   tween, instant under reduced motion. The `focus` prop is gone.
2. The hover spin-pause was imperative (`controls.autoRotate=false`)
   but the lib re-applies `options` on every React render,
   overwriting the pause — spin resumed mid-hover. Now declarative:
   `enableCameraAutoRotate: !reduced && !preview`, so opening any
   preview pauses, closing resumes, and renders can't clobber it.
3. The preview card's `backdrop-filter: blur(6px)` — a classic jank
   source over a WebGL canvas — replaced with a solid translucent
   panel.

**Page where:** home, section 05 — hover a chip or label: the spin
pauses and the globe *turns* the city to face you; leave and it
resumes drifting.

**Before → after:** lag + teleport → eased spin, stable pause.

**Verification:** headless probe of label projection over time shows
arrival then a fully stable hold (no resume drift); final framing
centers the chosen city at unchanged zoom; lint + build clean.
(SwiftShader's ~3fps rAF can't show arc smoothness headless — the
easing math is frame-rate independent.)

## Section 05 v4 — the globe is the navigator (Plan B) · 2026-09-21

The destination sidebar is gone; the globe owns the section, per the
user's vision ("make the globe the sole navigator, type the names of
the destinations, click opens the destination"). Plan B = the
globe-first design PLUS a quiet chip row as the scannable / touch /
keyboard fallback.

**Code where:**
- `frontend/src/components/globe/SolenGlobe.jsx` — right column
  (list, info panel, preview) removed. New: HTML destination labels
  projected through the globe camera every frame (via the instance
  from `onGetGlobe`), fading out as a city swings to the far side;
  hover on marker/label/chip pauses the spin and opens a preview card
  (photo, region, one-liner, "click to explore") at the stage foot;
  click on marker/label/chip navigates to `/destinations/:slug`;
  chip/label focus flies the globe via react-globe's `focus` prop
  (`focusDistanceRadiusScale: 2.4` keeps the globe in view).
- `frontend/src/components/globe/SolenGlobe.css` — single-column
  stage, label typography (cream italic Cormorant on starfield),
  preview card, chip row; old sidebar styles deleted.

**Page where:** home, section 05. Names float at their cities; the
chip row sits quietly under the globe; everything clicks through to
the destination pages.

**Before → after:** globe + dashboard sidebar → globe as the sole
navigator with typed names, hover previews and a quiet fallback row.

**Accessibility:** labels are real focusable buttons (keyboard +
screen readers) regardless of facing opacity; focusing one flies the
globe to it. Chips give touch users a visible path.

**Guards:** reduced motion — no spin, frozen clouds, instant focus
jumps, labels visible and static (verified visually identical; byte
diffs under headless are compositor noise on will-change layers).

**Verification:** headless Chromium — face-side labels at opacity 1
with far-side culled; chip hover opens the preview card and flies to
Iceland; chip click lands on `/destinations/iceland`; zero page
errors; lint + build clean.

## Globe v3 — user-supplied react-globe replaces the night Earth · 2026-09-21

The user brought a packaged `react-globe@5.0.2` globe (blue marble +
clouds + starfield + glowing markers + tippy tooltips) as "a better
replacement"; per instruction it now owns the section 05 stage. The
three-globe night Earth (previous M6) is retired with it.

**Code where:**
- `frontend/src/components/globe/SolenGlobe.jsx` — rewritten around
  `<ReactGlobe>`. The seven destinations are markers at real
  coordinates; `onMouseOverMarker` syncs the info panel + preview
  image, `onClickMarker` travels to the destination page. Section
  chrome (heading, list, preview) untouched locked design.
- Textures vendored at `frontend/public/assets/globe/`
  (globe.jpg / clouds.png / background.png) and passed as props — the
  package's default hotlinks GitHub raw URLs; the site stays
  self-contained.
- `frontend/src/components/globe/SolenGlobe.css` — the starfield
  window gets 14px corners + the old sphere's shadow; dead orbit CSS
  removed.
- Deps: `react-globe@5.0.2` added; `three-globe` removed; `three`
  aligned to **0.119.1** via root `overrides` (react-globe's chain
  needs the removed `Face3` export; nothing else uses three).
  `package-lock.json` regenerated — **run `npm ci` after pulling**.

**Integration surgery the README couldn't predict:**
- React StrictMode double-mount: the lib's cleanup removes its canvas
  (a React-owned node) from the DOM, leaving the second instance
  rendering into a detached canvas → invisible globe in dev. Fixed by
  caching the canvas node in a layout effect and re-inserting it.
- `onGetGlobe` had to be `useCallback`-stable: it sits in the lib's
  mount-effect deps, so a fresh function per render tore the WebGL
  globe down on every parent render.
- Textures are top-level props, not `options` keys.

**Page where:** home, section 05 — starfield window with the blue
marble spinning; gold markers glow over the seven destinations;
hover a marker (or a list row) and the info panel + photo follow;
click travels.

**Before → after:** night Earth with radar rings → the user's chosen
blue-marble globe with clouds, glow and tooltips; the info panel and
list behaviours are unchanged.

**Guards:** reduced motion = camera auto-rotate off AND the lib's
autonomous cloud drift frozen directly on the globe instance
(`animateClouds` noop via `onGetGlobe`), applied live on preference
flips; markers/tooltips remain usable. Lazy chunk unchanged.

**Verification:** headless Chromium: globe canvas mounted + connected,
all three textures 200 from our origin, zero page errors; globe region
byte-identical over 1.5s under reduced motion (both canvases
data-identical over time — residual full-page diffs are headless
compositor noise on will-change layers, not motion). `lint` + `build`
clean.

## M6 — the real 3D night globe · 2026-09-21

The CSS fake sphere is retired. Section 05 now renders a true 3D
globe: NASA Black Marble night imagery (accurate continents, glowing
city lights), topology bump, plum atmosphere — the seven destinations
at their **real coordinates** with cream radar rings, drag-to-orbit,
idle auto-spin, and hover-to-fly with an image preview.

**Code where:**
- `frontend/src/components/globe/SolenGlobe.jsx` — rewritten on
  `three` + `three-globe`. Custom `MeshPhongMaterial` uses
  `earth-night.jpg` as map *and* emissive map (cities genuinely glow),
  `earth-topology.png` as bump. Fly-to uses an exact upright-basis
  quaternion built from three-globe's own `Polar2Cartesian` convention
  (`theta = 90 - lng` — any other formula lands on the wrong
  continent). Lights-fill entrance: emissive intensity ramps 0→1.6
  when the section scrolls into view. OrbitControls drag; idle spin
  resumes 6s after interaction; rAF + three-globe paused while the tab
  is hidden; DPR capped at 2; full dispose on unmount.
- `frontend/src/data/globeDestinations.js` — screen percentages
  replaced with real `lat/lng` + preview `image` per destination.
- `frontend/src/pages/home/HomePage.jsx` — globe is now `React.lazy`
  (three.js ships in its own chunk; the rest of the site never pays
  for it) with a Suspense placeholder.
- Textures committed at `frontend/public/assets/globe/` (the
  three-globe package does not export its example images).
- New deps: `three`, `three-globe` (pure JS, no install scripts — no
  `allowScripts` entry needed).

**Page where:** home, section 05. The globe spins with Africa/Europe
facing you; hover any destination in the list and the globe flies
that city to centre (poles upright) while its photo blooms into the
info panel; click to travel to the destination page; drag to orbit.

**Before → after:** stylised plum CSS orb with fake grid → accurate
night Earth whose city lights fill in as it enters view; markers sit
at true geography and pulse rings; the info panel gained a live
preview image.

**Guards:** reduced motion = no spin, no ring pulses, instant fly-to,
lights at full from the start — verified pixel-static headless. The
preference is live mid-session.

**Verification:** headless Chromium (SwiftShader WebGL): zero page
errors; initial face Africa/Europe with rings over the European
destinations; Paris hover flies Europe to centre with the Paris
preview; reduced-motion screenshots byte-identical 1.2s apart.
`lint` + `build` clean (three chunk lazy, size warning expected).

## Asset migration — PNG → WebP (guest batch 2, completed properly) · 2026-09-21

The guest session had converted every image to WebP on the PC and
pointed the code at them (commits `ee203af`/`c16f661`/`c2e6e75`), then
reverted the references (`6e2c9a0`/`3ef470e`) — because the `.webp`
files were **untracked**, so anywhere else (GitHub, this sandbox) the
references 404'd. The upload of the PC folder carried the WebP files;
they are now committed for real and the PNGs removed.

**Code where:** 13 assets added under `frontend/public/assets/**`
(logo, hero, 7 destinations, 4 experiences) as `.webp`; the 13 `.png`
counterparts deleted; references re-applied by cherry-picking the
guest's three reverted commits (`Navbar.jsx`, `homeContent.js`,
`destinationEditorial.js`, `destinations.js`, `HomePage.jsx`).

**Page where:** every image on the site — hero, navbar logo,
destination cards, experience cards, destination detail pages.

**Before → after:** `frontend/public/assets` 14 MB → **1.2 MB**,
visually identical in headless screenshots; zero 404s; `lint` +
`build` clean.

**On your PC:** your untracked `.webp` copies will collide with the
now-tracked ones on pull. If `git pull` warns "untracked working tree
files would be overwritten", run
`git clean -f frontend/public/assets` (only the WebP conversions sit
there untracked) and pull again. Also still pending: `del npm` (the
stray empty file at the repo root).

## Robustness pass on the motion modules (guest session) · 2026-09-20

Three commits made in a second AI session (commits `d3fb96e`,
`2c85272`, `e4dd5ac`), adopted as-is after review + headless
verification. Changelog entry written retroactively by the home
session — the guest session shipped code without one.

### 1. `d3fb96e` — reduced-motion is now LIVE in the scroll modules

**Code where:** `tornWipe.js`, `heroParallax.js`, `m4Stepper.js` —
each replaced "read the preference once at init" with an
attach/detach pair listening to the media query's `change` event.

**Page where:** toggle the OS "reduce motion" preference while the
site is open (no reload). Before: modules that started under reduced
motion stayed dead after flipping the preference off (m4 stepper
never re-attached), and ones started animated kept their inline
transforms after flipping it on. After: flipping either way takes
effect immediately; detaching clears inline transforms (`--scrub`,
parallax drift) so the static presentation is truly static, and
flipped tears keep their `scaleX(-1)` rest pose.

### 2. `2c85272` — ProgressRail resize throttle + dot reuse

**Code where:** `ProgressRail.jsx` — resize handler rAF-throttled;
`syncDotNodes` reuses dot elements instead of `innerHTML = ''`
rebuilds; chapter offsets measured once per rebuild and cached, so
the per-frame scroll update does no chapter layout reads.

**Page where:** drag-resize the window on home; the rail no longer
tears down/rebuilds on every event of the drag.

### 3. `e4dd5ac` — AmbientField particles preserved across resize

**Code where:** `AmbientField.jsx` — `fitParticles` scales existing
mote positions proportionally to the new viewport and only
adds/trims to the area-derived cap; resize rAF-throttled.

**Page where:** drag-resize the window; the dust field moves with the
viewport instead of teleporting into a fresh random field on every
resize event.

### Verification (home session)

Headless Chromium with `emulateMediaFeatures` mid-session flips:
normal → hero `translateY(48px)` + tears driven; reduce → hero inline
cleared, tears rest (`scaleX(-1)` preserved on flipped seams); back →
driving resumes. No page errors. `lint` + `build` clean.

### Housekeeping notes

- The guest session also left a stray empty untracked file named
  `npm` at the repo root on the PC — delete it (`del npm`); it was
  never committed.
- Guest commits respected the relay (no force-push) and the house
  commit style, but skipped this changelog and the where-report —
  both remain mandatory for every change (§2 contract).

## Polish batch 1 — site-wide staged reveals + hero parallax · 2026-09-19

Two reference mechanics land site-wide (P4 staged reveals, analysis
item 8 depth layer), under the full-delegation polish phase.

### 1. Staged reveals (P4) — every section statement enters softly

**Code where:** `data-reveal="blur"` added to the five home section
h2s in `frontend/src/pages/home/HomePage.jsx` (intro "Travel should
feel personal.", destinations, feeling, experiences, planner closer)
and the three h2s in
`frontend/src/pages/destination/DestinationDetail.jsx` (intro title,
"Moments worth travelling for.", final CTA). Uses the existing one-shot
primitive from `frontend/src/utils/reveal.js` + blur variant from
`frontend/src/styles/motion.css` — no new machinery.

**Page where:** scroll the home page and any destination page; each
big serif statement starts blurred/transparent and settles in once as
it enters the viewport.

**Before → after:** h2s were static — sections appeared all-at-once.
Now every chapter's statement blooms in one beat after its torn edge
sweeps, giving the whole site the reference's staged cadence.

### 2. Hero image scroll parallax (depth layer)

**Code where:** new co-located module
`frontend/src/pages/home/heroParallax.js`, mounted by a `useEffect` in
`HomePage.jsx`; `.hero-image` in `HomePage.css` over-sized
(`inset: -10% 0`) + `will-change: transform` so the drift never exposes
an edge. Applied to the WRAPPER, not the img — the img's entrance
animation is fill-forwards and would permanently override an inline
transform.

**Page where:** home page, top. Scroll slowly: the hero photo drifts
at 12% of scroll speed, adding depth between image, M3 headline and
the content below.

**Before → after:** hero photo scrolled rigidly with the page. Now the
photo, headline and content move at three different speeds.

Guards: rAF-throttled passive scroll, transform-only (R2), never
attaches under `prefers-reduced-motion`.

### 3. Checked, no change needed

- Destination card hover (image scale + arrow rotation) and the dark
  footer closer (`#241c1d`) already exist in the locked design.
- M16 typewriter has **no host**: the planner's only input is the
  budget range slider (line 988). Adding a text field would change the
  locked planner design, so M16 stays deferred until feature work adds
  a text input.

### Verification

Headless Chromium (puppeteer-core): parallax matrix translateY 60px @
scrollY 500; all eight h2s start opacity 0 → `is-revealed` opacity 1
after entering view; hero screenshots at 0/600px show no exposed
edges. `npm run lint` clean, `npm run build` clean.

## Stage build — Step 1: ambient particle field · 2026-09-18

The "density lesson" put into practice (see MOTION_FOUNDATION.md):
before any more isolated effects, build the persistent stage.

`frontend/src/components/ambient/AmbientField.jsx` (+ `.css`), mounted
once in `AppRoutes` so it covers **every** page and survives **every**
section break (P5). Plum dust (~50–70 particles by area, capped) with
slow drift, gentle twinkle, and slight scroll parallax for depth.
`soft-light` blend: the same particles whisper on cream grounds and
glow faintly on plum ones — one layer, all chapters.

Guards: pointer-events off + aria-hidden (atmosphere, not interface);
rAF paused while the tab is hidden; DPR capped at 2; plain arcs only;
reduced motion draws ONE static frame (grain without drift) and a
mid-session preference flip switches live. Full cleanup on unmount.

Verdict pending: user's eyes on the live preview. Tuning knobs if too
loud/too quiet: opacity (0.55), particle density (/26000), alpha
range, parallax factor.

### Tune 3 + tiny improvement (2026-09-18)

User confirmed presence ("they're here now, looks good"). Improvement
pass: motes now pre-rendered **radial-gradient sprites** (soft edges —
no hard confetti dots) drawn via drawImage; softer look, cheaper per
frame.

## Stage layer 3 upgrade — M1 scroll-driven wipe · 2026-09-19

`components/edges/tornWipe.js` (+ `will-change` in TornEdge.css,
effect in HomePage.jsx): the static tears now sweep UP over the
previous chapter as their seam enters the viewport — +100px (invisible
against the next chapter's identical ground) at entry, continuously
tied to scroll, settling at 0. The next sheet of paper pulling over
the previous chapter (M1's full form). Read-only passive listener,
rAF-throttled, transform-only; flip recomposed into the same transform
string. Reduced motion: never attaches, v1 static tears remain.

Verified in headless Chromium before delivery: seams enter at 100px,
settle to 0 in order, mid-sweep values continuous (15.6px caught in
transit).

## M4 audit fix — specificity inversion · 2026-09-19

Agent audit (user delegated the verdict) caught one real bug from the
fix pass: the discrete `[data-active]` background rules carry an
attribute selector and therefore OUT-SPECIFIED the continuous
`color-mix` rule — modern browsers kept the jumpy background. Fix:
discrete rules wrapped in `@supports not (color: color-mix(...))` so
they exist only as a true fallback. File: `m4Stepper.css`. Audit
verdict otherwise: ghost parallax, scrub, pacing all behave as
designed; remaining polish belongs to the user's taste pass.

## Animation 05 — M8 accent word (intro statement) · 2026-09-19

The intro statement "Travel should feel *personal.*" reveals via the
foundation `[data-reveal]` primitive (`data-reveal` added to the h2 in
`HomePage.jsx`); the final word blooms ink → plum 400ms after the line
settles (`HomePage.css`, new Animation 05 block). Colour-only —
typography and layout untouched. Reduced motion: immediate plum.

## M4 fix pass (draft, agent) · 2026-09-19

The jank suspects logged after the user's first look, addressed:

1. **Ghost numerals** — no longer a slow-settle stand-in. They now track
   the CONTINUOUS scroll value (`--scrub`, 0–1 per chapter) with no
   transition: true parallax that creeps with your scroll while the
   words push discretely. The after-settle drift is gone.
2. **Background** — discrete per-push colour jumps replaced by a
   CONTINUOUS cream→plum `color-mix` blend driven by `--scrub` (the
   discrete steps remain as a no-color-mix fallback). Text counterpoint
   reduced to ONE calm flip (`.is-dark` at 58% progress) instead of
   per-push changes.
3. **Pacing** — chapter tightened 400vh → 340vh (mobile 70 → 60vh per
   step); push easing softened `--ease-decel` → `--ease-decel-soft`
   (duration stays in the documented 250–400 ms class).

Status: draft — user polishes to taste next. Suspect #4 (composition)
left untouched deliberately.

---

## Stage build — Step 3: torn chapter edges (M1, v1) · 2026-09-18

`components/edges/TornEdge.jsx` (+ `.css`): torn-paper SVG seams at the
four homepage chapter boundaries — hero→intro (oatmeal tear over the
photo), destinations→feeling (plum tear), feeling→experiences (oatmeal
tear out of plum), globe→planner (cream tear). Fill always equals the
NEXT chapter's ground, so the page reads as one continuous torn
story (P2: the paper metaphor).

Zero layout shift by construction: height exactly cancelled by the
negative margin — pure overlay, locked sections keep their geometry.
Alternating mirror flips for organic variety. Mobile: 56px tears.
Static in v1, so reduced motion needs no guard; the scroll-driven
wipe upgrade (M1's full form) is deferred to the polish phase.

## Stage build — Step 2: progress rail (M10) · 2026-09-18

`components/rail/ProgressRail.jsx` (+ `.css`), mounted in AppRoutes —
persistent on every page. A 38vh hairline at the right edge: track at
25% bridge tone, fill scaling with scroll (`scaleY`, transform-only),
one dot per chapter placed at the chapter's TRUE document position
(hero/about/destinations/feelings/experiences/planner where present),
active dot pulses at the viewport's middle. Rebuilds dots on route
change. Read-only passive scroll, rAF-throttled.

Colour: dusty bridge tone `#8a6478` — reads on cream and on deep plum
without theme-switching. Mobile: hidden ≤640px (documented R8
decision). Reduced motion: rail stays (position is information, not
animation); only the dot pulse is removed.

---

## Animation 04 — Quiet feelings ticker (M7 diagonal marquee) · 2026-09-18

Status: user-supplied module integrated between the plum feeling-section
and the experiences stepper — a quiet ambient seam, exactly the analysis'
mapped target ("quiet feelings ticker"). The M7 rubric trial applies to
M4; qualitative verdict here: exemplary handoff — seamless loop math,
documented -4° angle sourced from the analysis, WCAG 2.2.2 pause control,
honest flagging of the one genuinely missing token.

### The mechanic

Pure CSS ambient clock (P1/R4 — the deliberate opposite of the
scroll-driven story mechanics): a static `-4deg` tilt on the clipping
wrapper (the analysis' documented band angle) + a linear `translateX
0 → -50%` drift inside it. Two identical groups back to back: one loop
moves exactly one group's width, so the end frame is pixel-identical to
the start frame — invisible restart, no snap, no JS driving the motion.
48s per loop ≈ one phrase every 4–5 s: a slow current, not a ticker.

### Files added

- `frontend/src/pages/home/m7Marquee.css` — handoff module with SOLEN
  skin: quiet plum items (`#4a1942` at 45% opacity) over the oatmeal
  ground; full width; toggle styled to match. Mechanics unchanged.
- `frontend/src/pages/home/m7Marquee.js` — pause control only (React
  port of the handoff IIFE with cleanup): toggles
  `animation-play-state` per WCAG 2.2.2, honors mid-session
  reduced-motion flips. The marquee runs with zero JS; this file only
  gates it.

### Files modified

- `frontend/src/styles/motion.css` — **`--motion-ambient-loop: 48s`
  promoted to the foundation** as the first ambient-clock duration
  token (the handoff flagged it as genuinely missing; verified — all
  existing duration tokens are narrative-scale 200–850 ms).
- `frontend/src/pages/home/HomePage.jsx` — imports +
  `useEffect(() => initM7Marquee(), [])`; marquee JSX with the real
  `feelings` labels as the ticker content (7 labels × 4 repeats per
  group — enough width for ultrawide; the `-50%` loop math is
  repeat-count-agnostic per the handoff's integration notes).

### Integration decisions (documented)

- **Placement:** between feeling-section and experiences-section —
  dark plum → whispering ticker → cream stepper panel: the ambient
  breather between the two chapters.
- **Accessibility:** the strip is decorative (the real feelings are
  the interactive buttons above), so the viewport is `aria-hidden`;
  the pause button stays exposed and labelled.
- **No html.js gating needed** — animation is pure CSS; no-JS shows
  the full loop, and reduced-motion collapses it to one centered
  horizontal instance (handoff's CSS, unchanged).

### Uses tokens

`--ease-linear`, `--motion-ambient-loop` (new, promoted by this
handoff); the toggle's hover borrows `--motion-push` / `--ease-decel`.

### Styling pass — editorial elevation (direction A, user-chosen)

After the user saw the first integration ("so generic"), a styling pass
re-dressed the same mechanics — tilt, seamless loop, pause, reduced
motion all untouched:

- Items became **large Cormorant italic** words — clamp(2rem, 5.5vw,
  4.25rem), plum at 95% — alternating **solid and outlined** (1.5px
  `-webkit-text-stroke`, soft-tint fallback where unsupported): ink/print
  rhythm, unmistakably SOLEN, nothing like a template ticker.
- Small plum **diamond separators** between words (pure CSS).
- Band taller: clamp(180px, 24vw, 300px) desktop / clamp(140px, 30vw,
  200px) mobile — presence instead of a thin floating line.
- Slower current: `calc(var(--motion-ambient-loop) * 1.25)` = 60s, so
  the larger type reads.
- Repeat count 4 → 2 per group (items are ~5x wider; loop math
  unchanged), verified against the handoff's ultrawide note.

Lesson recorded: "quiet" in a spec is not the same as "small" — quiet
should live in pace and restraint, not in typographic scale. Future
ambient specs will say "confident but unhurried" instead.

### Verification

- `npm run lint` clean; `npm run build` clean (CSS 65.72 → 67.36 kB).
- Dev server: homepage + `m7Marquee.js` serve (200); marquee markup
  present in the transformed component.

### RETIRED (2026-09-18) — by user taste, after two iterations

The user saw both the quiet version and the editorial-elevation
version on the live site and rejected both ("still doesn't look
good"). The only remaining candidate placement (ambient ghost-layer
inside the dark plum feeling-section) was judged too speculative to
gamble a third iteration on. **Animation 04 removed entirely:** JSX
block, `m7Marquee.css`, `m7Marquee.js` deleted; imports and effect
unwired. `--motion-ambient-loop` stays in the foundation, reserved for
future ambient work. Recoverable forever via git (commit `cec9d57`).

Lesson recorded: a mechanic can be technically perfect and still not
belong on a site — taste outranks craft. The rubric scores craft; the
user scores belonging. Both votes matter, and the user's is final.

---

## Animation 03 — Experiences horizontal stepper (M4) · 2026-09-18

Status: user-supplied module (rubric score **89/100 — PASS**, first use of
`ANIMATION_REVIEW_RUBRIC.md`) integrated into the homepage experiences
section, plus the integration-side cinematic additions the rubric flagged
as missing. The locked experiences **heading is untouched**; the locked
**card grid is replaced** by the stepper (the approved mapping target),
with every card's content and its Discover→planner navigation preserved.
Recoverable with one git revert if ever wanted back.

### The mechanic

Four steps — THE WILD / THE TABLE / THE SOUL / THE ESCAPE — pinned in a
400vh scroll region (70vh/step on mobile). Each step arrives as one
320ms horizontal push (`--motion-push` / `--ease-decel`), holds perfectly
still, and reverses identically on scroll-back. Hysteresis (±0.08) kills
boundary flicker; scrollbar jumps resolve in one recompute. No
scroll-jacking: read-only passive listeners, rAF-throttled.

### Files added

- `frontend/src/pages/home/m4Stepper.js` — trigger module (React port of
  the handoff IIFE): STEP_COUNT derived from DOM, `--active-index` set on
  the section (so the ghost layer inherits it), `data-active` added to
  drive the scrub, cleanup on unmount, reduced-motion no-op.
- `frontend/src/pages/home/m4Stepper.css` — handoff module structure
  (base → enhanced → reduced-motion) with SOLEN typography/palette and
  the cinematic additions below.

### Files modified

- `frontend/src/pages/home/HomePage.jsx` — imports + `useEffect(() =>
  initM4Stepper(), [])`; card-grid JSX replaced by stepper JSX (real
  `experiences` data, CTA keeps `/planner?experience=<key>`).
- `frontend/src/pages/home/HomePage.css` — `.app` gains `overflow-x:
  clip` fallback-anchored on `hidden` (see infrastructure note).
- `frontend/src/styles/responsive.css` — same clip pair on the
  `html/body/#root` block and the `.app` media-query block.

### Cinematic additions (the rubric's named tweaks, agent-built)

1. **Background tone scrub + text-colour counterpoint** — the sticky
   panel crossfades per step, in sync with each push: cream `#faf7f1` →
   oatmeal `#f3ebdd` → dusty mauve `color-mix(in srgb, #4a1942 45%,
   #f3ebdd)` (hex fallback provided) → deep plum `#4a1942`, text
   switching to cream on the final chapter. All four colours are SOLEN's
   own palette family; contrast checked (≥ 6:1).
2. **Ghost numerals** — huge Cormorant `01–04` at 8% opacity behind the
   content, `currentColor` so the counterpoint flows through them.
   Travels the same distance per push as the track but settles over
   `--motion-reveal-slow` — the discrete-step analogue of the analysis'
   "ghost numerals slower than the words" parallax.

### Infrastructure note — the sticky fix

`position: sticky` breaks under ancestors with `overflow-x: hidden`
(they become scroll containers). SOLEN had three (`.app`, `html/body/
#root`, responsive `.app`). Each now carries `overflow-x: clip` after
the `hidden` line: modern browsers get clip (visually identical, no
scroll container → sticky works); older browsers keep `hidden` and the
site looks exactly as before. Predicted by the handoff's own README
warning; verified as necessary.

### Handoff adaptations (documented in the module headers)

IIFE → React module with cleanup; STEP_COUNT derived; `--active-index`
hoisted to the section; full-bleed via `margin-inline: -6vw` inside the
padded section; mobile 70vh/step kept from the handoff.

### Uses tokens

`--motion-push`, `--ease-decel`, `--motion-reveal-slow`,
`--ease-decel-soft` — all from `styles/motion.css`. Step colours are
design values (palette family), not motion tokens.

### Open item

The locked cards had images; the stepper is typographic (faithful to the
handoff). Step images as subtle backgrounds remain an option for a later
pass if wanted.

### Known issue — user-reported jank (2026-09-18), fix deferred

User verdict after first look: "doesn't look all that good, kinda
janky." Suspects, ranked (to verify one by one when fixing):

1. **Ghost-numeral lag** — the 850ms slow-settle was a discrete stand-in
   for the reference's *continuous* parallax; a huge element still
   drifting 530ms after content settles may read as an error, not depth.
   Candidate fixes: cut the lag to ~150–200ms, or make ghost offset
   continuous (progress-linked, read-only), or retire the ghost.
2. **Discrete background colour jumps** — the reference scrubbed
   continuously with scroll; per-push crossfades (especially the big
   mauve→plum jump) may feel flickery. Candidates: progress-linked
   blend, or tone steps closer together, or slower colour transition.
3. **Pacing/length** — 400vh may feel long; 320ms push possibly too
   snappy against the luxury register. Candidates: 300–350vh, softer
   push duration toward --motion-reveal.
4. Step composition (left content vs right ghost balance) unverified.

### Verification

- `npm run lint` clean; `npm run build` clean (CSS 62.27 → 65.72 kB).
- Dev server: homepage + `m4Stepper.js` serve (200); `js` flag present;
  step-selection logic previously verified 6/6 in Node (hysteresis,
  jumps, reverse symmetry).
- Live scroll test left to the user's machine + preview.

---

## Animation 02 — Destination title ghost → solid ink-in (M2) · 2026-09-18

Status: user-authored standalone module integrated faithfully onto the
destination detail page's main title (the analysis' mapped target —
"Cormorant … destination titles"). One unified title, one 850 ms
transition: ghost-grey (opacity 0.25 + blur 10px + grayscale + scale
0.985) develops into solid, crisp type. **Reversible** — the title
un-inks again when scrolled back out of view (P1: scroll is the
timeline). No word-splitting, no stagger — that is M3, not this.

### Files added

- `frontend/src/pages/destination/m2GhostSolid.js` — the trigger module
  (port of the handoff's `m2-ghost-solid.js`): IntersectionObserver
  toggles `.is-materialized` both directions; deliberately does NOT reuse
  `reveal.js` (that one is one-shot; M2 is reversible). threshold 0.2 /
  rootMargin `0px 0px -8% 0px` match `reveal.js` for consistent
  "in view" semantics. Reduced-motion: no observer attached, titles
  settled once; mid-session preference flip disconnects and settles.

### Files modified

- `frontend/src/pages/destination/DestinationDetail.jsx` — the hero `<h1>`
  gains `className="m2-title"` + `data-animation="m2-ghost-solid"` (no
  inner markup change); `useEffect(() => initM2GhostSolid(), [slug])` —
  re-initializes per destination, cleanup disconnects the observer.
- `frontend/src/pages/destination/DestinationDetail.css` — appended the
  Animation 02 block verbatim from the handoff module: default-visible
  fallback, `html.js`-gated ghosted state, materialized end state,
  reduced-motion override.

### Adaptations from the handoff

1. IIFE → exported `initM2GhostSolid()` returning a React cleanup
   function (observer disconnect on unmount/route change). Behavior
   otherwise identical.
2. Preview-only token shim dropped — the real tokens already exist in
   `styles/motion.css` with exactly the values the handoff assumed
   (`--motion-reveal-slow: 850ms`, `--ease-decel-soft:
   cubic-bezier(0.33, 1, 0.68, 1)`, `--reveal-blur`, `--ink-ghost-opacity`).
3. `html.js` flag already exists project-wide (added with Animation 01).
4. Preview chrome (spacers, Replay button) not imported — demo only.

### Uses tokens

`--motion-reveal-slow`, `--ease-decel-soft`, `--reveal-blur`,
`--ink-ghost-opacity` — all from `styles/motion.css`. Grayscale is a
filter *value* in the ghost state, not a token (handoff's own note —
trivially removable if unwanted).

### Placement decision (flagged)

The user's module named no target ("representative title … not a real
SOLEN section"). Placed on the destination hero `<h1>` per the analysis
mapping ("M2 → Cormorant hero + destination titles"; homepage hero
already carries M3). **Reversible in one line** — move the class to any
other title, or extend: the observer handles multiple `.m2-title`
elements (candidates: `destination-intro` h2, section h2s).

### Handoff's simplification note (preserved)

The trigger is enter/leave threshold toggling, not continuous
scroll-scrubbing — the 850 ms transition plays on its own clock after
the boundary crossing. Reversible, scroll-tied, no hijacking. Flagged by
the handoff as a simplification, not an established SOLEN rule.

### Verification

- `npm run lint` clean; `npm run build` clean (CSS 61.62 → 62.27 kB).
- Dev server verified: `/destinations/kyoto` serves (200),
  `m2GhostSolid.js` resolves (200).

---

## Animation 01 — Hero headline per-word blur-in (M3) · 2026-09-17

Status: user-authored prototype (standalone HTML/CSS/JS handoff) integrated
faithfully into the homepage hero. Mechanic M3 from `MOTION_ANALYSIS.md`.
Scope: only the hero headline moves — the seven words resolve left to right
from ghosted/blurred (opacity 0.25, blur 10px, +14px) to sharp and still,
200 ms apart, ending completely at rest. No loop, no re-trigger.

### Files added

- `frontend/src/pages/home/heroBlurIn.js` — the trigger module (port of the
  handoff's `script.js`): load trigger (hero is in view on load — see
  handoff README's trigger assumption), double-rAF start so the ghosted
  first frame always paints, reduced-motion check before firing plus a
  `change` listener if the OS preference flips mid-session, and an
  idempotency guard for React StrictMode's double effect.

### Files modified

- `frontend/index.html` — inline `document.documentElement.classList.add('js')`
  in `<head>` (progressive-enhancement flag; gates the ghosted starting
  state so content is fully visible if JS never runs).
- `frontend/src/pages/home/HomePage.jsx` — the `<h1>` words wrapped in
  `<span className="word">` (text, `<br />` line breaks and the
  `<em>discovered.</em>` styling preserved exactly); added
  `data-animation="m3-blur-in"` hook; `useEffect` calls `initHeroBlurIn()`.
- `frontend/src/pages/home/HomePage.css` — appended the Animation 01 block:
  blur-bleed headroom, default-visible state, `html.js`-gated ghosted start,
  revealed end state, per-word stagger, reduced-motion override.

### Adaptations from the handoff (and why)

1. `:nth-of-type` instead of `:nth-child` for the stagger — the locked
   layout's `<br />` elements are siblings and would break nth-child word
   counting.
2. Selectors scoped under `.hero h1[data-animation='m3-blur-in']` (the real
   element) instead of the demo's `.hero-headline`.
3. Blur-bleed headroom is `padding-block: 0.2em` compensated by
   `margin-block: -0.2em calc(28px - 0.2em)` — zero layout shift, because
   the hero is a locked design and `.hero` has `overflow: hidden`.
4. Demo-only stage atmosphere (background, wordmark, context line, demo
   typography rules) deliberately not imported — design stays locked.
5. Easing: the handoff's proposed `cubic-bezier` values for
   `--ease-decel-soft`/`--ease-decel` matched the foundation's exactly —
   no new tokens, no edits to `motion.css` (the handoff's open question #9
   resolves cleanly).

### Uses tokens

`--motion-reveal`, `--motion-stagger`, `--reveal-blur`, `--reveal-rise`,
`--ink-ghost-opacity`, `--ease-decel-soft` — all from `styles/motion.css`.

### Layered-entrance decision (resolved)

The locked hero's `heroContentIn` (fade + 35px rise, 1.2 s) originally ran
on the whole `.hero-content`, layering a second entrance under Animation 01.
**Decision (delegated to agent instinct, confirmed against spec P3 — one
showpiece per beat): re-scope.** The animation values are preserved
byte-for-byte but now apply only to `.hero-eyebrow`, `.hero-description`,
`.hero-buttons`; the headline owns its M3 reveal alone. The supporting
elements look and move exactly as the locked design always did. Also added:
reduced-motion guard for those supporting elements (R7).

### Verification

- `npm run lint` clean; `npm run build` clean (CSS 59.86 → 61.51 kB).
- Dev server verified: `js` flag present in served HTML, `heroBlurIn.js`
  resolves (200), preview host headers accepted.

---

## Motion Foundation — 2026-09-17 · commit `86f8aec`

Status: pushed to `origin/main`. Prerequisite spec: `docs/MOTION_ANALYSIS.md`.
**Scope: vocabulary only — no individual animations were implemented.**
The site renders pixel-for-pixel identically (verified: 0 elements opt into
the reveal primitive).

### Files added

#### 1. `frontend/src/styles/motion.css` (new)
The motion vocabulary for the whole frontend.

- **Duration tokens** (each value traced to a measurement in
  `MOTION_ANALYSIS.md` §17):

  | Token | Value | Measured source |
  |---|---|---|
  | `--motion-push` | 320 ms | mechanical pushes/slides 250–400 ms |
  | `--motion-wipe` | 600 ms | section wipes / flips ~600 ms |
  | `--motion-reveal` | 550 ms | typographic reveals 450–600 ms |
  | `--motion-reveal-slow` | 850 ms | showpiece reveals 700–900 ms |
  | `--motion-stagger` | 200 ms | arrival-order offsets 150–250 ms |

- **Easing tokens** — deceleration curves only ("deceleration, never
  oscillation"): `--ease-decel` (strong settle), `--ease-decel-soft`
  (gentle settle), `--ease-inout` (smooth transit), `--ease-linear`
  (ambient clock).

- **Reveal material tokens:** `--reveal-blur: 10px` (M3 focus-in,
  8–12 px), `--reveal-rise: 14px`, `--ink-ghost-opacity: 0.25` (M2).

- **Reveal primitive (opt-in, dormant):**
  - `[data-reveal]` — fade + rise, token-driven
  - `[data-reveal="blur"]` — adds focus-in from `--reveal-blur`
  - `data-reveal-delay="1..6"` — stagger via `--motion-stagger`
  - Revealed state class: `.is-revealed`

- **Reduced-motion contract:** one `prefers-reduced-motion: reduce`
  block collapses every duration token to ~0, zeroes blur/rise, and
  forces `[data-reveal]` elements to their final visible state. Any
  future token-driven animation is neutralized automatically.

#### 2. `frontend/src/utils/reveal.js` (new)
The JS half of the reveal primitive.

- `IntersectionObserver` (threshold 0.2, rootMargin `0px 0px -8% 0px`)
  adds `.is-revealed` once, then unobserves.
- `MutationObserver` on `document.body` watches for elements added
  later (e.g. the journey-planner result) and observes them too.
- Respects `prefers-reduced-motion`: reveals instantly, no observation.
- Exported as `initReveal()`; dormant until an element opts in.

#### 3. `docs/MOTION_FOUNDATION.md` (new)
The conventions & rulebook that turns the analysis principles into law.

- Rules **R1–R9:**
  - R1 — tokens only, no magic values
  - R2 — animate `transform` / `opacity` / `filter` only
  - R3 — one showpiece per beat (principle P3)
  - R4 — energy decays; loops belong to the ambient clock only (P6)
  - R5 — two clocks: story = scroll, ambience = time (P1)
  - R6 — deceleration, never oscillation — user CSS always wins
  - R7 — reduced motion, always
  - R8 — explicit mobile behaviour per animation (no hover on touch)
  - R9 — animation CSS co-located with its page; locked designs keep
    structure/type/colour untouched
- Usage snippet for the reveal primitive.
- The workflow for adding the first real animation.

### Files modified

#### 4. `frontend/src/main.jsx`
- Added imports: `./styles/motion.css` and `initReveal` from
  `./utils/reveal.js`.
- Calls `initReveal()` after `ReactDOM.createRoot(...).render(...)`.
- No other changes.

### Verification

- `npm run lint` — clean (both workspaces).
- `npm run build` — succeeds; CSS bundle 58.52 kB → 59.86 kB
  (the added tokens/primitive), JS 314.27 kB.
- `grep data-reveal frontend/src/pages frontend/src/components` →
  **0 opt-ins**, so no visual change anywhere.
- Commit `86f8aec` pushed to GitHub.

### On your PC

```bat
cd C:\Users\Admin\projects\solen
git pull
```

No new dependencies — nothing to install.

### Next step (unchanged)

Pick a mechanic (M1–M10 in `MOTION_ANALYSIS.md`) + a target element,
send the CSS (or request a draft), and it gets implemented per rules
R1–R9.
