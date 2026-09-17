# SOLEN Changelog

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

### Open item for review

The locked hero already had `heroContentIn` (container fade + 35px rise,
1.2 s) on `.hero-content`. Animation 01 currently runs *alongside* it, so
the headline has two layered entrances for ~1.4 s. Options: keep both,
retire the container animation, or re-scope it away from the headline.
Awaiting the user's call.

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
