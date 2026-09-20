/**
 * Animation 03 — M4 Horizontal Stepper (pinned, discrete pushes).
 * Spec: docs/MOTION_ANALYSIS.md (M4) · Handoff: user module, 2026-09-18
 * (rubric score 89/100 — see docs/ANIMATION_REVIEW_RUBRIC.md).
 *
 * Vertical scroll position → discrete step index → one horizontal push.
 * No scroll-jacking: this only *reads* scroll position (one
 * getBoundingClientRect per animation frame) and writes CSS state. It
 * never calls preventDefault, never sets scrollTo, never traps
 * wheel/touch. Hysteresis around each midpoint prevents boundary
 * flicker; large jumps resolve in one recompute.
 *
 * Integration adaptations from the handoff IIFE (both documented):
 *  1. React-lifecycle module returning a cleanup function (listeners
 *     removed on unmount).
 *  2. STEP_COUNT derived from the DOM instead of hardcoded.
 *  3. `--active-index` is set on the SECTION (not the track) so the
 *     integration's ghost-numeral layer — a sibling of the track —
 *     inherits the same variable.
 *  4. `data-active` is set on the section to drive the background
 *     tone scrub + text-colour counterpoint (integration addition).
 *
 * Reduced motion is fully LIVE (2026-09-19). Previously the module
 * returned early when the preference was already set, which meant it
 * never attached a change listener — so turning reduced motion OFF
 * mid-session left the stepper permanently dead. It now always
 * observes the query and attaches or detaches in both directions.
 */

export function initM4Stepper() {
  const section = document.querySelector('[data-animation="m4-horizontal-stepper"]');
  if (!section) return undefined;

  const track = section.querySelector('.m4-stepper__track');
  const panels = section.querySelectorAll('.m4-stepper__step');
  const dots = section.querySelectorAll('.m4-stepper__dot');
  if (!track || !panels.length) return undefined;

  const STEP_COUNT = panels.length;
  const HYSTERESIS = 0.08; // fraction of one step's span, each side of .5

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  let currentIndex = 0;
  let attached = false;
  let ticking = false;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function applyStep(index) {
    currentIndex = index;
    section.style.setProperty('--active-index', String(index));
    section.setAttribute('data-active', String(index));

    panels.forEach((panel, i) => {
      panel.setAttribute('aria-hidden', i === index ? 'false' : 'true');
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
    });
  }

  function currentProgress() {
    const rect = section.getBoundingClientRect();
    const scrollable = section.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    return clamp(-rect.top / scrollable, 0, 1);
  }

  function update() {
    const progress = currentProgress();
    const rawFloat = progress * (STEP_COUNT - 1);

    // Continuous scrub value for the cinematic layers (background
    // blend + ghost parallax) — set every frame, unlike the discrete
    // step commit below (fix pass 2026-09-19).
    section.style.setProperty('--scrub', progress.toFixed(4));
    section.classList.toggle('is-dark', progress > 0.58);

    const lower = currentIndex - 0.5 + HYSTERESIS;
    const upper = currentIndex + 0.5 - HYSTERESIS;

    if (rawFloat < lower || rawFloat > upper) {
      applyStep(clamp(Math.round(rawFloat), 0, STEP_COUNT - 1));
    }
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }

  function attach() {
    if (attached) return;
    attached = true;
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });

    // Initial paint: commit step 0 state, then read the real scroll
    // position in case the page loaded already scrolled in.
    applyStep(0);
    update();
  }

  function detach() {
    if (!attached) return;
    attached = false;
    window.removeEventListener('scroll', requestUpdate);
    window.removeEventListener('resize', requestUpdate);
    // Stop driving; the reduced-motion CSS block owns the static
    // stacked presentation from here.
    section.style.removeProperty('--scrub');
    section.classList.remove('is-dark');
  }

  // If the OS preference flips mid-session, stop or resume driving.
  const onPreferenceChange = (event) => {
    if (event.matches) detach();
    else attach();
  };

  if (!reduceMotionQuery.matches) attach();

  if (typeof reduceMotionQuery.addEventListener === 'function') {
    reduceMotionQuery.addEventListener('change', onPreferenceChange);
  }

  // React cleanup on unmount.
  return () => {
    detach();
    if (typeof reduceMotionQuery.removeEventListener === 'function') {
      reduceMotionQuery.removeEventListener('change', onPreferenceChange);
    }
  };
}
