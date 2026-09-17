# Motion Reference Analysis — "inspo" screen recording

**Source:** 17.7 s screen recording (1360×684, 30 fps), analyzed frame-by-frame
with ffmpeg (overview 1 fps + dense passes 8–10 fps on each transition).
**Date:** 17 Sep 2026.

> ⚠️ This document extracts **motion language only** — mechanics, timing,
> pacing, feel. The reference site's branding, layout, content, typography
> and palette are NOT to be copied. SOLEN's existing design
> (oatmeal/plum, Cormorant Garamond + Inter, editorial calm) remains the
> source of truth. Everything below must be *re-skinned* into SOLEN's
> voice before use.

---

## 1. Overall motion personality

The reference moves like **ink and machinery**: high-contrast
black/white section flips, brutalist mono display type, particle
"spray" that behaves like ink in water, and mechanical horizontal
stepping. The feeling is confident, deliberate, slightly raw.

What makes it feel premium (the part SOLEN wants):

- **One showpiece at a time.** Quiet stretches between big moments.
- **Fast pushes, long dwells.** Transitions are quick (250–600 ms);
  content then rests fully still for a beat.
- **Everything resolves.** No animation is left half-finished on screen.
- **Scroll drives almost everything** — motion is tied to progress,
  not to arbitrary timers.

---

## 2. The mechanics (observed + measured)

Timings measured from 8–10 fps samples; easings inferred from frame
spacing. Treat as ±15%.

### M1 — Organic torn-edge section wipe · ~600 ms
Dark→light section boundary is an **irregular torn/ink silhouette**,
scroll-driven, with subtle wobble. Not a straight clip — the edge looks
hand-ripped.
*SOLEN fit:* between the homepage hero and discovery section, or into
the footer — re-skinned as a soft oatmeal/plum tear instead of ink.

### M2 — Ghost→solid "ink-in" headline · ~700–900 ms, scroll-linked
A huge headline enters at ~25% grey and **inks in to full black** as the
section settles. The text literally develops, like a print being
developed in a darkroom.
*SOLEN fit:* Cormorant display lines (hero, destination titles) —
plum-ghost to full-ink. Very portable, zero layout risk.

### M3 — Per-word blur-in reveal · ~450–600 ms per word, stagger ~150–250 ms
Words enter **blurred (≈8–12px) + faint**, then focus to sharp, one
word after another ("What's" → "slowing" → "you" → "down?").
The reference's signature typography move; reads as the sentence
*coming into focus*.
*SOLEN fit:* the journey-result personalized summary line; statement
lines on the homepage. The single most transferable mechanic.

### M4 — Horizontal pinned stepper · ~250–400 ms per push
Vertical scroll is translated into a **horizontal slide** between giant
step words (Discover → Diagnose → …). Behind them, **huge ghost
numerals** (01, 02…) slide at ~6–8% opacity; the **background tone
shifts per step** (white → grey → near-black); a **progress rail**
of dots+line fills along the bottom.
*SOLEN fit:* the four experiences (THE WILD / THE TABLE / THE SOUL /
THE ESCAPE) as a stepped showcase — SOLEN's own rhythm, its own palette
steps (oatmeal → plum shades).

### M5 — Particle spray trails · continuous, motion-reactive
A swarm of fine dots **trails moving elements**, densest while things
move, dissipating at rest — like ink spray off the sliding words.
*SOLEN fit:* sparingly — around the globe during rotation, or as a
trail during the journey-crafting loader.

### M6 — Particle torus / galaxy backdrop · assembles ~1.5 s, slow rotation
For the final statement, thousands of dots form a **rotating ring/galaxy**
behind the text — pure emotional punctuation.
*SOLEN fit:* behind a final CTA or the crafting screen, in plum dust.

### M7 — Diagonal marquee · continuous slow drift, ~-4° tilt
A giant uppercase ticker crosses the dark section on a slight diagonal,
scrolling slowly forever.
*SOLEN fit:* a quiet feelings strip ("disconnect · fall in love · eat
everything …") — low contrast, slow, elegant.

### M8 — Accent-colour final word · ~300–500 ms colour-in
The last word of a statement lands in the **accent colour** ("evolve"
in pink) while the rest stays neutral.
*SOLEN fit:* the plum accent — e.g. "…deserves to *wander*".

### M9 — Light↔dark inversion rhythm
Sections alternate light/dark; the flips are part of the drama.
*SOLEN fit:* already exists structurally (oatmeal vs deep plum sections)
— M1 can make the flips themselves a designed moment.

### M10 — Progress rail · fills as you pass
Bottom rail of step labels connected by a line that fills in.
*SOLEN fit:* the planner's multi-step flow — a quiet plum rail showing
how far through the journey-building you are.

---

## 3. Pacing philosophy (the real takeaway)

| Beat type | Reference timing | Rule |
|---|---|---|
| Mechanical push/slide | 250–400 ms | quick, decisive |
| Wipes / flips | ~600 ms | never linger mid-transition |
| Typographic reveals | 450–900 ms | slow enough to be felt |
| Dwell | 1–2 s+ fully still | let content breathe after every beat |

Never two showpieces at once. Reveal → rest → next.

---

## 4. What NOT to import into SOLEN

- Heavy scroll-jacking (luxury keeps the user in control)
- The brutalist mono identity & neon pink (SOLEN is serif, oatmeal, plum)
- Aggressive contrast flips without softening (SOLEN softens everything)

---

## 5. How this feeds the two-way workflow

This list is the **menu**. For each element you want animated in SOLEN:

1. You pick a mechanic (M1…M10) + the target element,
2. You send the CSS (or request a draft to spec),
3. I implement it in the right file with tokens + reduced-motion guards.

Foundation (tokens, reduced-motion layer, reveal utility) is still
**unbuilt — waiting for your green light.**
