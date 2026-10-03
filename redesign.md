# Solen UI Redesign — Progress Tracker

> Living document. Update this file after every change so work can resume after a context loss.
> Skill reference: `C:\Users\Admin\.cline\skills\solen-ui-design\SKILL.md`
> Screenshot helper: `C:\Users\Admin\.cline\skills\solen-ui-design\scripts\shoot.mjs`

## Environment

- Dev server: Vite on port **5199** (running)
- Screenshots output: `c:\Users\Admin\PROJECTS\solen\.ui-shots\` (gitignored)
- Chrome: headless, launched by `shoot.mjs` (raw CDP over WebSocket, no npm deps)
- `shoot.mjs` takes ~15–25s per shot → run detached (`Start-Process node ...`) and poll the log/PNG; `run_commands` has a 30s cap

## How to take a screenshot

```
node C:\Users\Admin\.cline\skills\solen-ui-design\scripts\shoot.mjs <url> <output.png> [selector] [width] [height]
```

- Selector is a **positional 3rd arg** (not `--selector`; there is no `--full-page` flag — pass a tall `height` instead, e.g. `1440 4000`).
- Without a selector: primes all scroll reveals top-to-bottom, waits 2.5s, captures viewport (default 1440x900).
- With a selector: scrolls the element into view first (works with SPA hash anchors), waits for reveals, captures.
- Verified baselines (9): `before-home-full.png`, `before-destinations.png`, `before-intro.png`, `before-feeling.png`, `before-cta.png`, `before-footer.png`, `before-planner.png`, `before-dest-detail.png`, `before-globe.png` (the last captured later via the `git stash push -- <file>` trick during Phase 3). Note: `before-home-full.png` is a hero-only viewport capture (selector scroll didn't apply) and pairs consistently with `after-home-full.png`; the globe section is covered by the `*-globe.png` pair.
- **Junk files — ignore**: `before-home-top/destinations/experiences/planner/about/full.png` are all failed captures (duplicates of the hero — selector scroll didn't apply when they were taken). `before-destination.png` (1440x4000) is an early tall dest-detail shot of unknown provenance.

## Status

| Phase | Status |
|---|---|
| Phase 1 — Skill + screenshot tooling | ✅ Done |
| Phase 1b — Baseline "before" screenshots | ✅ Done |
| Phase 2 — UI restyling audit vs SKILL.md | ✅ Done |
| Phase 3 — Edit frontend CSS/JSX | ✅ Done (see Change log) |
| Phase 4 — "after" screenshots + comparison | ✅ Done (all 9 pairs verified) |

## Changelog

### 2026-09-25

1. **Created skill `solen-ui-design`** — `C:\Users\Admin\.cline\skills\solen-ui-design\SKILL.md`
   - 8 sections: design principles, color tokens (oatmeal/plum/ink/cream/mist), typography (Cormorant Garamond + Inter), spacing, motion tokens, file conventions, locked material, workflow.
   - Rules of note: no border-radius, hairlines over shadows, asymmetric grids, torn-edge joins between chapters, motion tokens only, port 5199.
2. **Created screenshot helper** — `...\solen-ui-design\scripts\shoot.mjs`
   - Node script, zero dependencies: finds Chrome, launches headless, raw CDP over WebSocket.
   - Waits on `Page.loadEventFired` **event** (it's an event, not a command — must listen on the ws message stream).
   - Supports selector-scrolled captures (fixes SPA hash-anchor scrolling) and full-page capture; primes scroll reveals before shooting.
   - Fixed during build: syntax errors from chunked inserts (findChrome tail restored, duplicate EOF removed).
3. **Verified tooling**: captured `before-home-full.png` (hero) and `before-destinations.png` (selector scroll) — both visually confirmed.
4. **Batch baseline capture** — `batch.ps1` in `.ui-shots\`, background job (pid 4656 at the time).
   - `.feeling-section` failed once due to a Chrome launch race; retry succeeded — `before-feeling.png` verified (torn edge, reveals, plum chapter all correct).
   - All 6 batch shots done: intro, feeling, cta, footer, planner, dest-detail.
5. **Updated `.gitignore`** — added `.ui-shots/` so screenshots stay out of the repo.

### ~~No frontend changes yet~~ (superseded)

Phase 2 audit and Phase 3 edits are complete — see the Change log below.

## Next steps

1. Review all `before-*.png` in `.ui-shots\` for correctness.
2. Phase 2: audit the frontend against SKILL.md using the baselines (note violations: radius, shadows, palette drift, type, spacing, motion).
3. Phase 3: apply fixes to frontend CSS/JSX; append each change to the Changelog below with file paths.
4. Phase 4: re-capture `after-*.png` via `shoot.mjs` and compare.

## Change log (Phase 3+ — frontend edits)

### 2026-09-25 — Phase 2 audit

Full audit of frontend CSS/JSX vs SKILL.md, cross-checked against the 8 `before-*.png` baselines.

**Violations found (all in `frontend/src/components/globe/SolenGlobe.css`):**
1. `.solen-globe-canvas` — `border-radius: 14px` (spec §1.3: sharp corners; globe panel is a *shadow* exception, not a radius exception)
2. `.solen-globe-destination-label:focus-visible` — `border-radius: 4px` (focus ring = outline only)
3. `.solen-globe-preview-card` — `border-radius: 10px`
4. `.solen-globe-preview-card img` — `border-radius: 6px` (no radius on images)

**Verified clean (no action needed):**
- **Fonts**: all `font-family` = Cormorant Garamond / Inter / inherit / serif fallback. No foreign families.
- **Palette**: every hex in `src/` maps to a token (oatmeal `#f3ebdd`, cream `#faf7f1`, plum `#4a1942`, ink `#241c1d`, mist `#8fa8b8`) or the documented bridge tone `#8a6478` (HANDOVER.md §4) or documented globe gold `#ffd9a0` (CHANGELOG: "gold markers glow" — deliberate, kept).
- **Radii kept (allowed)**: `.destination-tags span` 100px + globe chips 999px (chips = pills), planner route markers `50%` (dots), slider thumb (stepper control).
- **Shadows kept (allowed)**: globe panel `0 35px 90px`, planner journey-card hovers (spec §1.2 exceptions); route-marker/thumb `0 0 0 Xpx` are halo rings, not drop shadows.
- **Layout**: destination grid = asymmetric 12-col (varied `grid-column` + `margin-top` per `.destination-N`); experiences = 2-col with staggered `margin-top` 130px on items 2 & 4; section padding 130–170px ✓ (`.experiences-section` bottom is 180px — slightly generous, on the safe side of "do not compress", left alone on a locked page).
- **Torn edges**: all 4 chapter joins on HomePage pass `fill`/`flip` correctly (oatmeal→plum→oatmeal→cream→ink footer).
- **Motion (page CSS entrances)**: homepage/destination-detail reveals use `data-reveal` + `--motion-*` tokens ✓; reduced-motion contracts present in `motion.css`, `m4Stepper.css`, `DestinationDetail.css`, `TripPlanner.css` ✓. Raw-ms *hover* transitions (250–350ms) are out of scope — SKILL.md §5 scopes the token rule to entrance/reveal work.
- **Focus ring**: site-wide `:focus-visible` plum + cream override for dark grounds in `index.css` ✓.

**Flagged, NOT auto-fixed (needs a dedicated motion pass):**
- `TripPlanner.css` journey-results choreography: ~24 entrance animations with raw ms durations/delays + raw `cubic-bezier(0.22, 1, 0.36, 1)` (R1 drift — "tokens only"). Sequenced delays 80→2250ms are deliberate choreography; values have no matching tokens (R1 says *propose a new token first*), and blind mapping to `--motion-reveal*` would flatten the sequence. Reduced-motion is separately guarded there, so nothing is broken — just untokenized.
- `TripPlanner.css` `.planner-crafting` glow `5s ease-in-out infinite` — infinite loop outside `--motion-ambient-loop` (R4-adjacent); it's a loading-state wait, arguably ambient. Flag only.

### 2026-09-25 — Phase 3 fix

- **`frontend/src/components/globe/SolenGlobe.css`** — removed the 4 spec-violating `border-radius` declarations listed above (globe canvas, label focus ring, preview card, preview image). Structure/shadow/type untouched (globe section = home §05, treat as near-locked). Validated: `npm run build` + `npm run lint`.

### 2026-09-25 — Phase 4 after-screenshots + comparison

Captured 9 `after-*.png` (1440x900, selector-scrolled) via `after-batch.ps1` + a `cta-retry` run. Every pair visually compared:

| Pair | Verdict |
|---|---|
| `intro` | ✅ layout identical; only canvas particle positions differ (expected) |
| `destinations` | ✅ no regressions; tag pills stay 100px (allowed exception) |
| `globe` | ✅ the actual change: canvas/preview/img corners now square, focus ring radius gone; chips, gold `#ffd9a0`, bridge tone, panel shadow untouched |
| `feeling` | ✅ plum chapter, torn edges, reveals unchanged |
| `planner` | ✅ route dots (50%) + chips intact; crafting glow still `5s infinite` (flagged, intentionally untouched) |
| `dest-detail` | ✅ hero identical; only particle jitter |
| `cta` | ✅ no regressions; button corners square |
| `footer` | ✅ square corners at the ink footer join |
| `home-full` | ⚠️ both captures are hero-only viewport shots (consistent with each other); full coverage comes from the section pairs above |

**Result: no regressions; Phase 3 fixes visible; spec compliant.** Reveal animations fire in both before and after shots (`shoot.mjs` primes them before capture). Note: `after-batch.log` lists only 8 shots — `after-cta.png` came from the separate retry run, whose `.log/.err` are empty (redirect didn't write) but whose PNG exists and was verified visually.

## Gotchas

- Editor tool: 6000-char limit per call; `insert_line` must be a valid 1-based line or the file corrupts.
- Avoid inner quotes in `Start-Process -ArgumentList`; paths have no spaces.
- `Get-Process -Id <pid>` failing after a script exits is normal (cmdlet exit code 1).
