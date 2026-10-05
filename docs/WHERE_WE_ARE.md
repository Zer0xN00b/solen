# SOLEN — Where We Are

*Read this whenever the project feels foggy. One page, no jargon.*
*Last updated 2026-10-04.*

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

## What we deliberately have NOT done yet

*(Updated 2026-10-04. This section was written on 19 Sep and described the
project accurately then; the product layer has since caught up.)*

- **Maps.** Route intelligence needs a vendor and a billing decision, and was
  descoped (scope §53). Nothing else is blocked on it.
- **Polish pass** — the stage layers are still prototype-quality in your eyes.
  That's taste-work, yours to lead.

> **Update, 5 Oct 2026.** This section originally listed two more gaps. The
> *server-side itinerary engine* was descoped (§50 — it stays in the frontend by
> decision), and *live weather* shipped the same day (§52): the planner now
> shows a real Open-Meteo reading beside the curated note. Note that it is
> honestly **conditions**-aware, still not *forecast*-aware — there are no
> outdoor/indoor reselection or clothing logic behind it, by design.

> **Update, 5 Oct 2026:** the section above originally also listed
> *server-side itinerary generation* as undone. That item is **descoped** — the
> engine stays in the frontend by decision (scope §50). It was relocation, not a
> feature: there was no secret to protect, nothing meaningful to offload, and no
> second consumer.

## What did land since then

- **Accounts** — sign-up, sign-in, sign-out, and a session-aware navbar.
- **Persistent journeys** — the planner saves to the database; no longer
  localStorage-only.
- **Journey Library** — `/journeys`, list, open, delete.
- **Shareable journeys** — a Share control per journey and a public, read-only
  `/shared/:slug` page.
- **Live conditions** — a real Open-Meteo reading beside the curated weather
  note, falling back to the curated prose when the provider is unreachable.
- **66 tests**, and a deployment config.

Still open from the original scope: packing list, travel logistics, cost
transparency, and the accessibility and responsive QA passes. Scope §60–61 puts
that at ~3–4 focused working days. No longer on the list: the server-side
itinerary engine (descoped 5 Oct, scope §50) or live weather (§52, shipped 5
Oct).

## How we work (the deal)

- **You judge, I build.** Your taste is the final vote; the rubric and
  the reporting rule (file + page-location + before/after) keep me honest.
- Nothing ships unverified — I now check my own work in a real
  headless browser before it reaches your eyes.
- Every decision, lesson and revert lives in `docs/CHANGELOG.md`, so
   nothing is ever "just trust me."

## If you feel lost, remember

The site went from *static pages* to *a breathing, chaptered journey*
in four days, with the locked designs intact and a paper trail for
every step. That is not a project that's failing. That is a project
that's halfway to its soul.
