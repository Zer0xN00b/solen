# HANDOVER — Solen UI Redesign (2026-09-25)

**Status: Phases 1–4 COMPLETE, no regressions, build+lint green.** Resume from this file and `redesign.md` (the living tracker). Spec: skill `solen-ui-design` §-references below point at `SKILL.md`.

## §1 Project & goal

- Repo `c:\Users\Admin\PROJECTS\solen` — React + Vite luxury-travel frontend (brand: SOLEN).
- Goal: align frontend styling with skill spec `C:\Users\Admin\.cline\skills\solen-ui-design\SKILL.md`, validate visually via CDP screenshots, log every change in `redesign.md`.
- Screenshot helper: `C:\Users\Admin\.cline\skills\solen-ui-design\scripts\shoot.mjs`.

## §2 Git state

- HEAD `9aaa7e9` (main) — "Hygiene pass 8". **No commits were made by this redesign work.**
- Uncommitted: `M .gitignore` (added `.ui-shots/`), `M frontend/src/components/globe/SolenGlobe.css` (Phase 3), `?? redesign.md`, `?? HANDOVER.md` (this file).

## §3 What was done

- **Phase 1**: created the skill + `shoot.mjs`. **Phase 1b**: 9 `before-*.png` baselines.
- **Phase 2 audit**: full CSS/JSX sweep vs SKILL.md. Only violations = 4 `border-radius` rules in `SolenGlobe.css` (canvas 14px, label focus 4px, preview card 10px, preview img 6px). Fonts/palette/allowed radii/shadows/grids/torn edges/reveals/focus ring all verified clean. Two motion items flagged (§7).
- **Phase 3**: removed those 4 rules; globe section otherwise untouched (near-locked, home §05). `npm run build` + `npm run lint` pass.
- **Phase 4**: 9 `after-*.png` shots; all 9 pairs compared — fixes visible, zero regressions (verdict table in `redesign.md`).

## §4 Design spec quick reference (palette & locked material)

- Tokens: oatmeal `#f3ebdd`, cream `#faf7f1`, plum `#4a1942`, ink `#241c1d`, mist `#8fa8b8`.
- Documented non-token hexes, kept deliberately: bridge tone `#8a6478`, globe gold `#ffd9a0` (CHANGELOG "gold markers glow").
- No `border-radius` EXCEPT: chip pills (100px/999px), route markers + slider thumb (`50%`), stepper controls.
- No drop shadows EXCEPT globe panel `0 35px 90px` and planner journey-card hovers; `0 0 0 Xpx` halo rings are allowed.
- Type: Cormorant Garamond + Inter only. Layout: asymmetric grids, 130–170px section padding, torn-edge chapter joins. Focus: plum `:focus-visible` override in `index.css`.

## §5 Screenshot workflow

- `node C:\Users\Admin\.cline\skills\solen-ui-design\scripts\shoot.mjs <url> <out.png> [selector] [width] [height]` — selector is a **positional 3rd arg**; no `--full-page` (pass a tall height instead).
- Dev server: Vite on port **5199** — start with `npm.cmd run dev` in `frontend\` (**`npm.cmd`, not `npm`**: `npm.ps1` is execution-policy blocked).
- One shot = 15–25s > the 30s command cap → launch detached (`Start-Process node -ArgumentList '...'`, no inner quotes) and poll the log/PNG.
- Chrome launch race fails occasionally → just retry. `shoot.mjs` primes scroll reveals (2.5s) before capture so entrance animations appear in both before/after shots.
- To baseline an uncommitted change: `git stash push -- <file>`, shoot, `git stash pop`.

## §6 Screenshot inventory (`.ui-shots\`, gitignored)

- **Real pairs (9)**: intro, destinations, feeling, cta, footer, globe, planner, dest-detail, home-full — each as `before-*.png` + `after-*.png`. `before-globe` was captured last via the stash trick.
- **Junk — ignore**: `before-home-top/destinations/experiences/planner/about/full.png` (failed hero-duplicate captures). `before-destination.png` = early tall dest-detail shot of unknown provenance.
- `after-cta.png` came from a separate `cta-retry` run (its `.log/.err` are empty — redirect didn't write; PNG exists, verified). `after-batch.log` lists the other 8 after-shots.
- Both `*-home-full.png` are hero-only viewport captures (selector scroll didn't apply) — consistent with each other; section pairs carry full coverage.

## §7 Remaining / flagged (not blocking)

1. `TripPlanner.css` journey-results choreography: ~24 entrance animations with raw ms durations/delays + raw `cubic-bezier(0.22, 1, 0.36, 1)` → R1 drift. Sequencing is deliberate; SKILL.md R1 says *propose a new token first* — do not blindly map to `--motion-reveal*`. Reduced-motion is already guarded.
2. `TripPlanner.css` `.planner-crafting` glow `5s ease-in-out infinite` → R4-adjacent (ambient-loop token); it's a loading-state wait, arguably ambient. Flag only.
3. Minor: `.experiences-section` bottom padding 180px vs the 130–170 range — slightly generous, left alone on a locked page.
- A motion pass touching TripPlanner should re-shoot the `planner` pair only.

## §8 Environment gotchas & validation

- Editor tool: ≤6000 chars per call; `insert_line` must be a valid 1-based line or the file corrupts.
- 30s command cap on `run_commands`; use detached scripts + log polling for anything slower.
- `Get-Process` on an already-exited pid returns exit code 1 — normal.
- Validate frontend changes: `cd c:\Users\Admin\PROJECTS\solen\frontend; npm.cmd run build; npm.cmd run lint`.
- After any CSS/JSX edit: re-run build+lint, re-shoot affected pairs, append to `redesign.md` changelog.
