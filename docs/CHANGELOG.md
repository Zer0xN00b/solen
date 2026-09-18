# SOLEN Changelog

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
