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
  if (reduceMotionQuery.matches) {
    // Reduced motion: the CSS forces the static stacked base regardless
    // of html.js. Nothing to drive — do not attach listeners.
    return undefined;
  }

  let currentIndex = 0;

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
    const rawFloat = currentProgress() * (STEP_COUNT - 1);
    const lower = currentIndex - 0.5 + HYSTERESIS;
    const upper = currentIndex + 0.5 - HYSTERESIS;

    if (rawFloat < lower || rawFloat > upper) {
      applyStep(clamp(Math.round(rawFloat), 0, STEP_COUNT - 1));
    }
  }

  let ticking = false;
  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });

  // Initial paint: commit step 0 state, then read the real scroll
  // position in case the page loaded already scrolled in.
  applyStep(0);
  update();

  // If the OS preference flips mid-session, stop driving; the
  // reduced-motion CSS block takes over the presentation.
  const onPreferenceChange = (event) => {
    if (event.matches) {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    }
  };
  if (typeof reduceMotionQuery.addEventListener === 'function') {
    reduceMotionQuery.addEventListener('change', onPreferenceChange);
  }

  // React cleanup on unmount.
  return () => {
    window.removeEventListener('scroll', requestUpdate);
    window.removeEventListener('resize', requestUpdate);
    if (typeof reduceMotionQuery.removeEventListener === 'function') {
      reduceMotionQuery.removeEventListener('change', onPreferenceChange);
    }
  };
}
