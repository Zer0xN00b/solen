# Motion Reference Analysis (v2) — principles first, evidence second

**Source:** 17.7 s screen recording (1360×684, 30 fps) of the inspo site,
analyzed with ffmpeg: overview 1 fps + dense passes at 6–10 fps across
every transition window (0–1 s, 0.9–2.4 s, 2.2–4.4 s, 4.4–6.4 s,
7.3–8.9 s, 8.8–10.8 s, 10.6–13.2 s, 13.2–14.6 s, 14.5–17.6 s).
**Date:** 17 Sep 2026. **Supersedes v1.**

> ⚠️ Extracts **motion language only**. The reference's branding, layout,
> copy, palette (black/white/neon pink, brutalist mono) are NOT to be
> copied. SOLEN's design (oatmeal/plum, Cormorant + Inter, editorial
> calm) stays the source of truth; mechanics below get re-skinned.

---

# PART 0 — THE PRINCIPLES BEHIND THE MOTION

These are the rules the reference obeys in *every* sequence. Any single
effect can be re-skinned badly and still feel okay; break these
principles and no amount of pretty easing saves it.

**P1 — The user's scroll is the timeline.**
Nearly all narrative motion is *scrubbed* by scroll position, not fired
by timers: the headline inks in as you scroll into it and **un-inks if
you scroll back** (evidence: 2.2–4.4 s window). Timers are reserved for
ambient life (marquee drift, particle simmer) and short settle
animations. Result: the visitor feels in control; motion reads as a
response, never as a cutscene.

**P2 — One material metaphor, used everywhere.**
Everything behaves like *ink and print*: text develops from ghost-grey
to solid (developing print), section edges tear like paper, particles
spray like ink off a moving press, words come into focus like a lens.
A single metaphor is what makes ten different effects feel like one
language. *(For SOLEN the metaphor should be re-chosen to match the
brand — e.g. "light, tide and sand": soft fades, slow swells — but the
discipline of ONE metaphor transfers.)*

**P3 — Contrast choreography: every beat is defined by its opposite.**
Fast push (250–400 ms) vs long still dwell (1–2 s+). Giant type vs
6 px mono microcopy. Pure white vs pure black. One showpiece at a time.
The stillness is not a pause between animations — it is part of the
animation design.

**P4 — Progressive disclosure, always.**
Nothing appears all at once. Headlines word-by-word; lists line-by-line;
footers column-by-column; chips one after another. Hierarchy is
expressed as *arrival order*.

**P5 — Continuity through persistent layers.**
Particles, the floating nav pill, the left orb, the progress rail and
the diagonal marquee survive across section boundaries. Because some
layers never reset, section changes read as *chapters of one organism*,
not new pages.

**P6 — Energy is injected by movement and decays at rest.**
Particle bursts fire during a step-push and dissipate after (~1 s);
blur resolves; counters stop; the page returns to perfect stillness.
This decay is the site's sense of physics.

**P7 — Motion is information architecture.**
Animation explains structure: the horizontal stepper IS the 5-step
method; the filling rail IS your position; the torn edge IS a chapter
break; the background darkening IS narrative progression ("Evolve"
arrives in darkness). Nothing moves just to move.

---

# PART 1 — THE 22 CHECKLIST ITEMS, WITH EVIDENCE

*(Timings from 6–10 fps samples; easings inferred from inter-frame
spacing; ±15%.)*

### 1. How sections transition into one another
Three distinct transition grades:
- **Torn/ink-edge wipe** (~600 ms, scroll-driven, irregular silhouette
  with subtle wobble) — used once, dark→light, as *the* chapter break.
- **Background tone crossfade** (light → grey → charcoal, scrubbed) —
  inside the method stepper; same chapter, next page.
- **No transition** (dark stays dark between friction → statement →
  footer) — when the narrative doesn't change, neither does the light.
Principle: transitions are *semantic*, graded by how big the change is.

### 2. Scroll-driven animation / motion ↔ scroll position
Headline ghost→solid is a bidirectional scrub (reverses when scroll
reverses). Step pushes are scroll-jacked horizontal translation.
Marquee + particles run on their own clock (ambient). Two clocks,
clearly separated: **scroll = story, time = atmosphere**.

### 3. Large typography: enter / leave / move / scale / transform
- Enter: horizontal slide-in from right (stepper words); blur-in
  per word (statement lines); ghost→solid ink-in (section headline).
- Leave: slide out left (stepper); scroll-up exit with the section.
- Scale: essentially none — the reference trusts translate + opacity +
  blur + colour, never zoom. *(Worth noting: no scaling at all.)*
- Transform character: mono/typewriter face, hard edges, no rotation
  except the marquee band (-4°).

### 4. Horizontal and vertical movement
Vertical = the reader's journey (page scroll, cards rising).
Horizontal = the narrative's journey (step words, marquee, testimonial
row drift, logo strip). The two axes never fight: a section is either
a vertical moment or a horizontal moment.

### 5. Image / graphic reveal techniques
No photography — graphics only. Techniques used: staggered rise for
cards/chips/columns; blur→sharp for type; ghost→solid for headlines;
torn silhouette for the section itself. Reveal = develop, never pop.

### 6. Particle / grain / displacement effects
- **Spray trails**: fine dot swarms that fire off moving words during
  a push, densest mid-motion, dissipating ~1 s after rest.
- **Torus/galaxy**: thousands of dots assembling a slowly rotating ring
  behind the final statement (~1.5 s assemble).
- **Orb emissions**: the fixed left orb puffs small bursts on scroll.
- No film grain or displacement shaders observed; darks are clean.

### 7. Independent speeds (multi-velocity layers)
Ghost numerals translate slower than the words above them; particles
drift on their own vector; marquee ignores scroll entirely; body copy
trails its headline. At least four velocities coexist in one viewport.

### 8. Parallax and depth
Depth planes, back→front: background tone → ghost numeral → particle
field → headline/copy → fixed chrome (nav pill, orb, rail). Parallax
comes from the numeral/text speed difference; depth is *layered
flatness*, not 3D.

### 9. Overlapping elements and layered composition
Numerals sit behind and bleed past words; the marquee band overlaps
section boundaries; nav pill overlaps everything; the statement sits on
the torus. Overlap is constant but always tonal (ghost opacity), so
layers never compete for reading order.

### 10. Background and foreground transitions
Background tone scrubs with step progress; **foreground text colour
crossfades in counterpoint** (black→white as bg darkens) so contrast is
preserved at every intermediate frame. Fixed chrome survives all of it.

### 11. Light/dark section transitions
Rare and therefore meaningful: one torn wipe (dark→light) early, one
scrubbed darkening (light→dark) mid-page, then dark persists. The site
treats inversion as punctuation, not decoration.

### 12. Progressive reveal
Word-level blur stagger for headlines (≈450–600 ms/word, 150–250 ms
stagger); line-level stagger for lists/subcopy; column-level stagger in
the footer; chip-level stagger. Hierarchy = arrival order (P4).

### 13. Fixed / sticky elements
Nav pill (whole page), left orb + right "OPEN" edge label (whole page),
progress rail (method chapter), marquee band (its chapter). Fixed
elements are few, small, and persistent — the P5 layers.

### 14. Navigation and progress indicators
Step rail: labels DISCOVER…EVOLVE as dots+line, filling segment per
step, final node accent-coloured. Nav pill persistent. Right-edge
"OPEN". The rail doubles as wayfinding *and* narrative ("you are here
in the method").

### 15. Hover and cursor interactions
Captured evidence is thin (recording rarely idles): chip hover flips
the chip to accent pink (14.5–17.6 s window). Cursor otherwise default;
a custom cursor is not visible. Honest limit of the source material.

### 16. Button and link micro-interactions
- Input placeholder **types itself out** char-by-char
  ("I don't even know my…") — a typewriter micro-copy gag.
- Counter counts up ("153 frictions diagnosed", ease-out).
- CTA pill persistent; other hovers not captured. Same honesty limit.

### 17. Timing, easing, acceleration / deceleration
- Pushes ≈250–400 ms with strong deceleration (entering word arrives
  fast, settles slow — frame spacing compresses at rest).
- Blur-ins ≈450–600 ms ease-out on blur+opacity.
- Wipes/tone shifts ≈600 ms, near-linear because scroll-scrubbed.
- Ambient marquee: perfectly linear, very slow.
- Counters: ease-out.
- No springs/bounces anywhere. The easing personality is
  **deceleration, never oscillation**.

### 18. Pacing between major visual moments
Beat map: 0–1 intro settle · ~1–2 torn wipe · 2–4.4 headline + push 1 ·
4.4–7.3 pushes 2–4 (~1 s each incl. settle) · 7.3–8.9 darkening +
Evolve · 8.9–11 statement words · 11–13 counter + typewriter input ·
13–14.6 marquee + torus statement · 14.6–17.6 footer.
≈ one beat every 1.5–2.5 s, each followed by visible stillness (P3).

### 19. Continuity between separate sections
P5 in action: particles cross the torn edge; the rail spans all five
steps; the marquee bridges friction→footer; the orb never leaves.
Continuity is carried by layers, not by transitions.

### 20. Stillness / whitespace between animated moments
After every reveal the page holds perfectly still 0.5–2 s; giant words
float in large empty fields; dark sections are mostly negative space.
Stillness is compositional — the whitespace *is* the rest note.

### 21. Responsive considerations
Not observable — the recording is desktop-only. Flag for SOLEN: every
mechanic adopted needs its own mobile behaviour decision (touch has no
hover; horizontal steppers become vertical stacks or swipe).

### 22. (See PART 0) Principles
P1–P7 above are the answer to this item.

---

# PART 2 — WHAT SOLEN TAKES (mechanic → element, re-skinned)

| Mechanic | SOLEN element (suggestion, your call) |
|---|---|
| M3 per-word blur-in | journey-summary line; homepage statement lines · **→ implemented as Animation 01 (hero headline)** |
| M2 ghost→solid ink-in | Cormorant hero + destination titles · **→ implemented as Animation 02 (destination title, reversible)** |
| M4 horizontal stepper | THE WILD / TABLE / SOUL / ESCAPE showcase · **→ implemented as Animation 03 (user module 89/100 + agent cinematic layers)**; planner step rail (M10) |
| M1 torn-edge wipe | hero → discovery chapter break, as a soft oatmeal/plum tear |
| M5/M6 particles | globe ambience + crafting screen, as plum dust |
| M7 marquee | quiet feelings ticker · implemented as Animation 04, then **retired by user taste** (2026-09-18) — technically sound, didn't belong; lesson in CHANGELOG |
| M8 accent word | plum accent on the final word of a statement |
| M16 typewriter placeholder | planner input easter-egg (optional) |

What NOT to import: scroll-jack heaviness (luxury = user in control),
neon/brutalist identity, hard black/white flips without softening.

---

# PART 3 — METHOD NOTES

- Foundation (tokens / reduced-motion / reveal utility): **built** in
  commit `86f8aec` — see `docs/MOTION_FOUNDATION.md` and
  `docs/CHANGELOG.md`.
- Honest limits: no audio; hovers under-sampled; easings inferred;
  no responsive evidence; timings ±15%.
- Workflow unchanged: you pick mechanic + element, send CSS (or request
  a draft), I implement with tokens + guards, you review on your PC.
