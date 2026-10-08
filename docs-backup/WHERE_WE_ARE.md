# SOLEN — Where We Are

*Read this whenever the project feels foggy. One page, no jargon.*
*Last updated 2026-10-05. **The scope is closed — SOLEN is complete.***

## The goal, in one sentence

Make SOLEN feel like the inspiration video — **one continuous, living
journey** — but in SOLEN's own quiet-luxury skin (oatmeal & plum,
Cormorant & Inter), never a copy of the reference's neon identity.

## The story so far, in three moves

1. **We learned the language first.** We studied the reference video
   frame by frame and wrote down *why* it feels alive (7 principles,
   22 observations) → `MOTION_ANALYSIS.md`. We were never guessing.
2. **We built the grammar.** Tokens (durations/easings), rules, and a
   safety net for reduced-motion & mobile → the motion foundation.
   Then we shipped five "moments" (below) and learned a hard, valuable
   lesson from the marquee failure: *vibe comes from layered density,
   not from isolated effects.*
3. **We built the stage.** The always-on layers that make every page
   feel inhabited (below). This was the missing 60% the marquee
   taught us about.

## What the site does today — and where to see it

**Always on, every page (the stage):**

| Layer | Look at… |
|---|---|
| Drifting plum/cream dust | anywhere; stop scrolling and watch it breathe |
| Progress rail with chapter dots | right edge while you scroll |
| Torn-paper chapter seams | the four boundaries on the homepage — they sweep up as they enter view |

**Special moments (the scenes):**

| Moment | Look at… |
|---|---|
| Hero words focusing in one by one | homepage, first paint |
| "personal." blooming to plum | homepage intro, on scroll-in |
| Destination title developing from ghost-grey | any destination page, scroll away & back |
| The four experiences as a pinned chapter that turns cream→plum as you travel | homepage EXPERIENCES, scroll slowly |

Everything is calm under reduced-motion, considered on mobile, and
every piece is one git revert away from undo.

## What we deliberately have NOT done — and why

*(Updated 2026-10-05, when the scope closed.)*

- **Maps.** Route intelligence needs a vendor and a billing decision, and was
  descoped (scope §53). Nothing else is blocked on it.
- **Server-side itinerary engine.** Descoped — it stays in the frontend by
  decision (§50): no secret to protect, nothing to offload, no second consumer.
- **Travel logistics, packing list, cost transparency.** All descoped 5 Oct
  (§42), with the reasoning on the record. Cost transparency was already built.
- **Prettier.** Never enforced in this repo; running it would rewrite every
  file for no behavioural gain.

**Live weather** is *conditions*-aware, not *forecast*-aware — there is no
outdoor/indoor reselection or clothing logic behind it, by design (§52).

## What did land since then

- **Accounts** — sign-up, sign-in, sign-out, and a session-aware navbar.
- **Persistent journeys** — the planner saves to the database; no longer
  localStorage-only.
- **Journey Library** — `/journeys`, list, open, delete.
- **Shareable journeys** — a Share control per journey and a public, read-only
  `/shared/:slug` page.
- **Live conditions** — a real Open-Meteo reading beside the curated weather
  note, falling back to the curated prose when the provider is unreachable.
- **The clean pass** — stray indentation repaired, budget slider labelled,
  favourite-heart tap target taken to 44px, meta description added, and all
  eight pages swept for alt text, button types, labels, landmarks, focus
  states, motion, assets and stray debug output.
- **Final polish (7 Oct)** — the two §40 optionals landed: a
  skip-to-content link on every route, and the WCAG contrast audit (mist
  token darkened for light grounds, low-alpha label text raised, heart
  glyph to the 3:1 icon minimum). Plus a site-wide reduced-motion guard on
  smooth scrolling.
- **66 tests**, and a deployment config.

**Nothing open.** The clean pass has been run (scope §61) and the scope is
closed — SOLEN is called **complete** as of 2026-10-05.

Optional extras, if anyone ever wants to go past "complete": the Prettier
reformat (never enforced here — running it would rewrite every file).
The skip link and the contrast audit from scope §40 shipped on 7 Oct.

## How we work (the deal)

- **You judge, I build.** Your taste is the final vote; the reporting rule
  (file + page-location + before/after) keeps me honest. The animation
  rubric that used to score prototypes was retired with the workspace
  cleanup — that phase is over.
- Nothing ships unverified — I now check my own work in a real
  headless browser before it reaches your eyes.
- Every decision, lesson and revert lives in `docs/CHANGELOG.md`, so
   nothing is ever "just trust me."

## If you feel lost, remember

The site went from *static pages* to *a breathing, chaptered journey*
in four days, with the locked designs intact and a paper trail for
every step. That is not a project that's failing. That is a project
that's halfway to its soul.
