# SOLEN Motion Foundation — conventions & rules

Companion to `MOTION_ANALYSIS.md` (the spec). The analysis is the
*why*; this file is the *how*. Built 17 Sep 2026. **No individual
animations are implemented yet** — this is vocabulary only.

## What exists

| Piece | Where | Purpose |
|---|---|---|
| Motion tokens | `frontend/src/styles/motion.css` | durations, easings, blur/ghost values — all derived from measured ranges in the spec (§17) |
| Reveal primitive | same file + `frontend/src/utils/reveal.js` | opt-in `[data-reveal]` focus/rise-in, auto-observes late-rendered elements |
| Reduced-motion contract | same file | collapses every token & reveal when the OS asks for calm |
| This document | `docs/MOTION_FOUNDATION.md` | the rules below |

## Tokens (source → value)

| Token | Value | From the spec |
|---|---|---|
| `--motion-push` | 320 ms | mechanical pushes 250–400 ms |
| `--motion-wipe` | 600 ms | torn wipes / flips ~600 ms |
| `--motion-reveal` | 550 ms | typographic reveals 450–600 ms |
| `--motion-reveal-slow` | 850 ms | showpiece reveals 700–900 ms |
| `--motion-stagger` | 200 ms | arrival stagger 150–250 ms |
| `--ease-decel` / `-soft` | expo/cubic-out | "deceleration, never oscillation" |
| `--ease-inout` | smooth transit | scrubbed/ambient moves |
| `--reveal-blur` | 10 px | blur-in 8–12 px (M3) |
| `--reveal-rise` | 14 px | subtle vertical arrival |
| `--ink-ghost-opacity` | 0.25 | ghost state before ink-in (M2) |

## The rules (how the spec's principles become law)

- **R1 — Tokens only.** No magic durations/easings in page CSS. If a
  value you need doesn't exist, propose a new token first.
- **R2 — Compositor-friendly properties.** Animate `transform`,
  `opacity`, `filter`. Never `width/height/top/left`.
- **R3 — One showpiece per beat** (spec P3). Two loud animations never
  run simultaneously.
- **R4 — Energy decays** (P6). Every animation ends at perfect rest;
  nothing loops in the narrative layer. Loops belong to the ambient
  clock (marquee-style atmosphere) and must be slow + linear.
- **R5 — Two clocks** (P1). Story motion is scroll-driven; timers are
  for ambience and short settles only.
- **R6 — Deceleration, never oscillation** (spec §17) unless a CSS you
  send explicitly says otherwise — your CSS always wins.
- **R7 — Reduced motion, always.** Everything routes through the
  contract in `motion.css`; JS-driven effects check
  `prefers-reduced-motion` like `reveal.js` does.
- **R8 — Mobile decision per animation.** The spec had no responsive
  evidence; every adopted mechanic gets an explicit small-screen
  behaviour (touch has no hover).
- **R9 — Placement.** Individual animation CSS lives co-located with
  its page (`pages/*/[Page].css`); shared vocabulary lives in
  `styles/motion.css`. Locked designs (§5/§7 of the scope doc) get
  animation added without touching structure, type, or colour.

## Using the reveal primitive

```html
<h2 data-reveal>Quiet line</h2>
<p data-reveal="blur" data-reveal-delay="1">Focuses in, second.</p>
```

Nothing else on the site uses it until deliberately opted in.

## The density lesson (added 2026-09-18, after M7's retirement)

Isolated effects read as stickers; *vibe* is made of layer density and
identity coherence. The reference's marquee worked because it sat
inside a dense, loud composition; the same craft, floating in SOLEN's
quiet single-layer sections, read generic. Element-level mechanics
(M2, M3, M4) fit quiet luxury; composition-level patterns demand
composition-level support around them.

Consequence for build order: before adding more isolated effects,
build the **persistent layers** — site-wide ambient particles/grain
(M5/M6 as chrome), the progress rail (M10), chaptering transitions
(M1) — so every new element lands inside a composed scene, not on an
empty stage (P5, P7).

1. You pick mechanic (M1–M10 in the analysis) + target element.
2. You send the CSS (or request a draft to spec).
3. I implement: co-located file, tokens per R1, guards per R7/R8,
   verify build + live, commit, you `git pull` and review.
4. Iterate until it feels right.

## Reporting rule (added 2026-09-19, user request)

Every change, no matter how small, is reported with three parts:

1. **Code where** — exact file(s) and block(s) touched.
2. **Page where** — exactly where on the live site to look.
3. **Before → after** — what the eye should compare against memory.
