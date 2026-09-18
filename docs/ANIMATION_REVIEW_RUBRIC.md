# Animation Review Rubric — the 75% gate

Created 2026-09-18, **before** evaluating the M4 prototype, at the user's
proposal: user-supplied prototypes are scored against this rubric;
**≥ 75% → the user keeps supplying**, **< 75% → the agent drafts against
`MOTION_ANALYSIS.md` instead**. Scoring is itemized — every deduction
named, no inflation. Even a sub-75 prototype is never wasted: it informs
the draft.

Trial case: **M4 — the pinned horizontal stepper** (the showpiece mechanic,
`MOTION_ANALYSIS.md` M4). Categories generalize to future reviews.

---

## A — M4 mechanic fidelity · 25 pts

| Pts | Check |
|---|---|
| 10 | Pin + scroll-driven stepping: the section pins, scroll advances one step per beat, each push feels like the documented 250–400 ms class, and it plays **backwards** when scrolling up (P1 — scroll is the timeline) |
| 6 | The layered details from the analysis: ghost numerals travelling *slower* than the words (parallax), and a progress rail that reflects position |
| 5 | Background tone scrub tied to progression (light → dark) with text-colour counterpoint so contrast survives the transition |
| 4 | Deceleration easing only — zero bounce/overshoot/oscillation; **no scaling** (analysis §17: translate + blur + opacity + colour only) |

## B — Foundation & rulebook compliance · 20 pts

| Pts | Check |
|---|---|
| 6 | Values map cleanly onto the existing `motion.css` tokens, or new tokens are honestly proposed (R1 — no silent magic numbers) |
| 4 | Only `transform` / `opacity` / `filter` / colour animated — never layout properties (R2) |
| 4 | Ends perfectly still; no infinite loops in the narrative layer — loops belong to the ambient clock only (R4) |
| 3 | `prefers-reduced-motion` genuinely handled (not just acknowledged) (R7) |
| 3 | Mobile/touch behaviour decided: no hover-dependence, and an explicit answer for how pinning behaves on small screens (R8) |

## C — SOLEN fit · 15 pts

| Pts | Check |
|---|---|
| 8 | Reads as SOLEN — oatmeal/plum, Cormorant + Inter, editorial calm. The reference's *motion language*, not its neon/brutalist identity (P2) |
| 7 | One showpiece at a time (R3); no collision with existing page animations; locked designs untouched (R9) |

## D — Craft & smoothness · 15 pts

| Pts | Check |
|---|---|
| 8 | Smooth under real scrolling: no jitter, no layout thrashing, compositor-friendly; survives viewport resize |
| 7 | Edge cases: pin boundaries, fast flicks, mid-step direction reversal, partial steps |

## E — Handoff quality · 15 pts

| Pts | Check |
|---|---|
| 8 | Modularity: drop-in CSS/JS, clear hooks/classes, no hidden dependencies, no global leakage |
| 7 | Documentation: assumptions stated, decisions flagged, simplifications admitted (the standard set by the M3/M2 handoffs) |

## F — Feel · 10 pts

| Pts | Check |
|---|---|
| 6 | Feels expensive, calm, intentional — luxury pacing with stillness at rest (P3/P6) |
| 4 | The agent would keep it rather than rewrite it |

**Total: 100 · Pass mark: 75**

## Scoring bands (for context)

| Score | Outcome |
|---|---|
| 90–100 | Integrate essentially as-is |
| 75–89 | Integrate with named minor tweaks |
| 60–74 | Good parts harvested; workflow flips to agent-drafted |
| < 60 | Agent drafts from the spec; prototype informs taste only |

## Method

The prototype is **run, not just read**: scrolled in both directions at
several speeds, resized, tested with reduced-motion emulated, checked
against the live SOLEN pages for collisions. Deductions are itemized in
the verdict with the exact rule or measurement cited.
