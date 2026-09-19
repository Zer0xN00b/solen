# SOLEN Handover Manual

_Everything a new person (or a new AI session) needs to take this
project over cold: what it is, how it's built, the rules that govern
the collaboration, and the full git workflow. Last updated 2026-09-19._

---

## 0. How to use this document

Read this file first — it is the index and the contract. Then read, in
order:

1. `README.md` — one-paragraph project identity + quick start.
2. `SOLEN_COMPLETE_SCOPE.md` — the full product scope. **§5 (homepage)
   and §7 (destination detail) are DONE and LOCKED.** The planner page
   design is also locked (its layout is not to be redesigned).
3. `docs/WHERE_WE_ARE.md` — the one-page orientation map: goal, the
   three-move story, what to look at, what's not done.
4. `docs/MOTION_FOUNDATION.md` — the motion engineering rules (tokens,
   reduced-motion contract, the reporting rule).
5. `docs/MOTION_ANALYSIS.md` — the reference-site motion language,
   principle-level, with the mechanic→element table and what is
   implemented / deferred / retired.
6. `docs/CHANGELOG.md` — the chronological record; every change ships
   with a where-report (see §2).
7. `docs/ANIMATION_REVIEW_RUBRIC.md` — the scoring rubric for any
   externally supplied animation prototype (the 75% gate).
8. `LOCAL_SETUP.md` — machine setup for a human on a fresh PC.

The workspace `uploads/` folder is a drop zone for user-supplied media
and prototypes. **Delete uploads after implementation and verification**
— that is a standing instruction, not a suggestion.

---

## 1. The project in one breath

SOLEN is a luxury travel concierge + personalized trip planner. A
React/Vite frontend (the finished product so far) over a
TypeScript/Express backend (scaffolded, auth-ready, features deferred).
The current phase is **motion polish**: layering a reference site's
motion *language* (density, staged reveals, multi-velocity depth,
layered continuity) onto SOLEN's own locked visual design. We extract
principles from the reference — never its branding, layout or content.

Status at handover: homepage + destination pages built and locked;
five animations + a three-layer "stage" shipped; polish batches in
flight under full user delegation; backend auth UI and journeys API
deferred until the user green-lights them.

---

## 2. The collaboration contract (rules the successor must follow)

These are **user-stated standing instructions**. Violating them has
cost rework before; they are not style preferences.

- **"Slowly but perfectly."** Never rush. Never choose *for* the user
  on matters they own. Jumping ahead = stop and undo. "Slow down" is a
  stop signal.
- **The user leads every decision** unless they explicitly delegate.
  As of 2026-09-19 the polish phase is **fully delegated** ("I basically
  want everything like that website") — within polish, the agent's taste
  drives; feature scope and design changes still require green-lights.
- **Reporting rule (pinned in MOTION_FOUNDATION.md):** EVERY change,
  however small, is reported with (1) **code where** — exact file +
  block, (2) **page where** — where on the live site to look,
  (3) **before → after**.
- **Two-way animation workflow:** the user supplies (a) where,
  (b) CSS, (c) trigger; the agent integrates with guards, protects
  locked designs, adds `prefers-reduced-motion` + responsive/touch
  handling, verifies, commits + pushes, iterates. Killing any layer =
  one revert (hence: **one concern per commit**).
- **75% rubric deal:** user-supplied animation prototypes are scored
  per `ANIMATION_REVIEW_RUBRIC.md`.
- **M7 marquee is RETIRED by user taste.** The ticker/marquee pattern
  does not belong on this site. Never re-propose it.
- **Presence calibration:** the user's eye needs clearly visible
  presence. Start present; tune down only if asked.
- **One-shot reveals are accepted as a feature** ("rarely gets
  triggered" is fine).
- **Analysis is principle-level**, not an effects catalog.
- **No feature work beyond green-lights** (auth UI, journeys API wait).
- **Design locks:** homepage (§5), destination detail (§7), planner
  layout. Motion layers may be added; the layouts may not be changed.
- Stack commitments: SQLite→Postgres-portable schema, Express,
  Prettier + EditorConfig, Better Auth (no localStorage auth,
  email/password first), backend TypeScript.
- The user runs/tests on their own Windows PC — deliverables must be
  self-contained with setup docs. Chat blocks `.zip`/`.mp4` uploads, so
  the user renames such files before uploading.
- New dependency with install scripts → add a **name-only**
  `allowScripts: true` entry in the root `package.json` *before*
  pushing (npm 11/12 blocks dependency install scripts by default).

---

## 3. Tech stack & repo map

Monorepo, npm workspaces, single `main` branch.

```
solen/
├── package.json            workspaces [frontend, backend]; scripts:
│                           dev (both via concurrently), dev:frontend,
│                           dev:backend, build, lint, format(:check);
│                           allowScripts: better-sqlite3, esbuild,
│                           @prisma/client
├── .nvmrc / .editorconfig / .prettierrc.json / .prettierignore
├── LOCAL_SETUP.md          fresh-PC setup for humans
├── SOLEN_COMPLETE_SCOPE.md the product scope (design locks live here)
├── docs/                   this manual + motion docs (see §0)
├── frontend/               React 19 + Vite 8, plain CSS per module
│   └── src/
│       ├── main.jsx                  boots app + initReveal()
│       ├── AppRoutes.jsx             global layout: ScrollToTop,
│       │                             AmbientField, ProgressRail, Routes
│       ├── styles/
│       │   ├── index.css             base styles
│       │   ├── motion.css            MOTION TOKENS + reduced-motion
│       │   │                         contract + reveal variants
│       │   └── responsive.css
│       ├── utils/reveal.js           [data-reveal] one-shot IO primitive
│       ├── components/
│       │   ├── ambient/  AmbientField   stage 1: canvas dust, all pages
│       │   ├── rail/     ProgressRail   stage 2: hairline + chapter dots
│       │   ├── edges/    TornEdge       stage 3: torn-paper SVG seams
│       │   │             tornWipe.js    M1: tears sweep up with scroll
│       │   ├── globe/    SolenGlobe     particle globe section
│       │   └── navbar/   Navbar
│       ├── pages/
│       │   ├── home/       HomePage + heroBlurIn.js (M3) +
│       │   │               m4Stepper.js/.css (M4) + heroParallax.js
│       │   ├── destination/ DestinationDetail + m2GhostSolid.js (M2)
│       │   └── planner/     TripPlanner (locked; budget slider is the
│       │                    only <input>, line ~988)
│       ├── data/           destinations, experiences, feelings,
│       │                   editorial copy, planner options, globe data
│       └── engine/         budget / journey / personalization logic
└── backend/                Express + TS, Drizzle ORM, better-sqlite3,
    ├── drizzle/            Better Auth wired (src/auth/auth.ts);
    │                       migration 0000 committed; features deferred
    └── .env.example / scripts/ensure-env.mjs
```

Co-location convention: every animation is a small module living next
to the page it animates, reading tokens from `styles/motion.css`.

---

## 4. Design system & grounds (verified facts)

- Palette: oatmeal `#f3ebdd` (app ground), cream `#faf7f1`, plum
  `#4a1942`, ink `#241c1d`, bridge tone `#8a6478`.
- Type: Cormorant-style display serif for statements; sans for UI.
- Section grounds (matters when layering motion): `.intro`,
  `.destinations-section`, `.experiences-section`, `.solen-globe-section`
  are transparent over oatmeal; `.planner-section` cream;
  `.feeling-section` plum; `.footer` already dark `#241c1d` with cream
  text (the site already closes dark — no inversion needed).

---

## 5. The motion system

**Foundation (`styles/motion.css`, `utils/reveal.js`):** duration /
easing tokens; a site-wide reduced-motion contract (everything must
degrade to a static, fully-visible state); `[data-reveal]` one-shot
IntersectionObserver primitive with a `blur` variant. Global
`initReveal()` runs from `main.jsx` after render.

**Stage (persistent chrome, all pages):**
1. `AmbientField` — canvas plum dust, DPR-capped, rAF paused when tab
   hidden, one static frame under reduced motion.
2. `ProgressRail` — scroll hairline + chapter dots, hidden ≤640px.
3. `TornEdge` seams at chapter breaks + `tornWipe.js` (M1) — tears
   start +100px low and sweep up with scroll.

**Implemented inventory (file → mechanic):**
- Animation 01 — hero headline per-word blur-in (M3) · `heroBlurIn.js`
- Animation 02 — destination title ghost→solid ink-in (M2, reversible)
  · `m2GhostSolid.js`
- Animation 03 — experiences pinned horizontal stepper (M4) ·
  `m4Stepper.js/.css` (340vh chapter, `--scrub` var, `@supports not`
  discrete fallbacks)
- Animation 05 — M8 accent word (intro "personal." blooms plum) · CSS
  at the end of `HomePage.css`
- Polish batch 1 — `data-reveal="blur"` on every home + destination h2
  (P4 staged disclosure) · `heroParallax.js` hero depth layer (12%
  drift, on the wrapper — the img's fill-forwards entrance animation
  would override an inline transform)

**Retired:** Animation 04 (M7 marquee) — user taste. Do not revive.

**Deferred:** M5 spray trails; M6 particle-torus/globe upgrade;
M16 typewriter (**no host exists** — the locked planner has no text
input; revisit only if feature work adds one).

---

## 6. Running & verifying

**On the user's PC (Windows):**
```bat
cd C:\Users\Admin\projects\solen
git pull
npm ci            :: NOT npm install — protects the lockfile (see §8)
npm run dev       :: frontend on :5173 (backend concurrently)
```

**In an agent sandbox:** after any reset, run
`solen_project/.sync/ensure-ready.sh` (heals git identity, remote, hook
permissions, node_modules). Dev server:
`npm run dev --workspace frontend -- --host 0.0.0.0 --port 5173`.

**Headless verification (the agent's eyes):** sandboxes lose Chromium
on reset; reinstall with
`sudo apt-get update -qq && sudo apt-get install -y -qq chromium`.
Test rig pattern (`/tmp/e2e`, not persisted):
```js
// npm i puppeteer-core in /tmp/e2e, then:
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium', headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
```
Screenshot sections and read the PNGs; assert computed styles (e.g. a
reveal goes opacity 0 → 1 with `.is-revealed`). Always verify before
declaring a bug — "no animation" reports have twice been delivery
issues, not logic (see §8).

---

## 7. Git workflow — the complete picture

**Topology.** GitHub `origin` = `github.com/Zer0xN00b/solen`, single
branch `main`. Two working copies: the user's Windows PC
(`C:\Users\Admin\projects\solen`) and the agent sandbox
(`/home/user/solen_project/solen`). GitHub is the relay between them.

**Identity.** Sandbox uses local config `SOLEN Developer <solen@local>`
(set by hooks/ensure-ready; resets wipe it). The PC uses the user's own
identity. Never commit credentials; `.git/config` is excluded from
snapshots.

**Hooks (sandbox-local; `.git` is not synced by git itself):**
- `pre-commit` — self-heals a missing git identity.
- `post-commit` — **auto-pushes every commit to `origin main`**,
  re-adding the remote from `solen_project/.sync/remote-url` if a reset
  removed it; warns on failure. On the PC there are no hooks: push
  manually (`git push origin main`).

**The change loop (both sides):**
1. `git pull` first (the other side may have pushed).
2. Make one concern per commit — any motion layer must be revertible
   with a single `git revert <sha>`.
3. `npm run lint` + `npm run build` clean; headless-verify new motion.
4. Update `docs/CHANGELOG.md` (and `MOTION_ANALYSIS.md` traceability
   rows when a mechanic lands or retires).
5. Commit with the house style — see lineage below
   (`Animation 0X: …`, `Stage step N: …`, `Polish batch N: …`,
   `… fix — …`).
6. Push (auto in sandbox; manual on PC).
7. Report the change with code-where / page-where / before→after.

**Lineage (orientation, newest first):** `98feafe` polish batch 1 ·
`3e10fd2` WHERE_WE_ARE · `82702c7` M1 scroll-wipe · `55260ec` M4 audit
fix + Animation 05 · `698653e` reporting rule · `6c34e3c` M4 fix pass ·
`018085a` torn edges · `627e1eb` rail + sprite · `45ae165`/`a45f18e`
presence tunes · `4419902` ambient field · `dd0c8d5` **retire M7** ·
`b59c270` Animation 03 · `80e60d6` Animation 02 · `afd9e93` npm ci doc ·
`d5be…`/`e5b673e`/`86f8aec` foundation.

**Killing a layer:** `git revert <sha>` (keeps history) and push; the
other side just `git pull`s. Never rewrite pushed history — both
copies pull from GitHub; force-pushes would strand the other machine.

**Sandbox resets:** `.git` config loses identity/remote but the repo +
hooks survive; `ensure-ready.sh` heals everything including
`node_modules`. `/tmp`, installed Chromium and puppeteer do not survive.

**Dependencies:** new dep with install scripts → name-only entry in
root `package.json` `allowScripts` **before** pushing (the other
machine's npm 11/12 will otherwise block its install scripts).

---

## 8. Pitfalls & non-bugs (earned the hard way)

- **"No animation" is often delivery, not logic.** Check: has the
  other side pulled the commit? Is Windows "Animation effects" off
  (that sets `prefers-reduced-motion`, which by design renders the
  static state)? Verify headless before concluding a bug.
- **`npm install` on the PC rewrites `package-lock.json`** (npm 11/12)
  and then blocks `git pull`. Use `npm ci`; if rewritten,
  `git restore package-lock.json`.
- **CSS specificity inversion:** later-in-file does NOT beat
  higher-specificity earlier rules. The M4 fallbacks are gated with
  `@supports not (…)` for exactly this reason.
- **JS transform writes override CSS transforms, and vice versa:**
  `tornWipe.js` must recompose `scaleX(-1)` into the same transform
  string; parallax targets the wrapper because the img's
  fill-forwards animation wins over inline styles.
- **`mix-blend-mode: soft-light` on the ambient canvas = invisible.**
  Use honest alpha (0.2–0.5) for visibility-critical layers.
- **Under-calibrated presence reads as "missing".** Start visible.
- **CRLF:** the PC is Windows; `.editorconfig`/Prettier keep peace.
  Don't fight line endings in fuzzy text edits.
- **`sudo apt-get install` fails without a prior `apt-get update`**
  in fresh sandboxes.
- Chained `&&` cleanup commands silently skip later steps when one
  fails — run cleanups as separate commands.

---

## 9. Handover checklist (step by step)

For a new human or agent taking over:

1. Read §0's reading list, top to bottom.
2. `git clone`/`git pull`; confirm `git log --oneline -1` matches the
   lineage in §7 (else pull again — delivery issues are real).
3. PC: `npm ci` + `npm run dev`, open `:5173`. Sandbox:
   `ensure-ready.sh`, then the dev server command from §6.
4. Walk the site slowly: hero blur-in → intro reveal + accent word →
   torn seams sweeping → destinations reveals + card hovers → feeling
   (plum chapter) → M4 stepper → globe → planner → dark footer. Watch
   the progress rail and ambient dust on every page.
5. Check `prefers-reduced-motion` (OS setting) shows the calm static
   site.
6. Adopt the contract (§2) — especially the reporting rule and the
   design locks.
7. Pick up where `WHERE_WE_ARE.md` says work remains.

---

## 10. Where the project goes next

- **Polish (delegated):** M5 spray trails; M6 globe/particle upgrade;
  hover micro-interactions audit; further staged-reveal tuning.
- **Deferred features (need green-light):** auth UI on Better Auth
  (`better-auth/react`, email/password first, no localStorage auth) and
  a journeys API over the existing Drizzle schema (SQLite now,
  Postgres-portable).
- **Standing hygiene:** delete uploads after use; one concern per
  commit; CHANGELOG + where-report with every change.
