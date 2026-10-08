/**
 * Animation 01 — Hero headline per-word blur-in (M3).
 * Spec: docs-backup/MOTION_ANALYSIS.md (M3) · Handoff: user prototype, 2026-09-17.
 *
 * Responsibility (and only this): add `.is-revealed` to the hero headline
 * so the co-located CSS in HomePage.css resolves each word from
 * ghosted/blurred to sharp/still. No viewport detection — the hero is in
 * view on load, so the trigger is "page ready," not "scrolled into view."
 *
 * All timing/easing lives in CSS via the motion tokens; this module only
 * decides *when* the sequence starts. Respects prefers-reduced-motion
 * (checked before firing, and again if the OS preference changes).
 */

export function initHeroBlurIn() {
  const headline = document.querySelector('[data-animation="m3-blur-in"]');
  if (!headline || headline.dataset.m3Init === 'true') return;
  headline.dataset.m3Init = 'true';

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  function revealImmediately() {
    headline.classList.add('is-revealed');
  }

  function revealWithMotion() {
    // Double rAF: let the browser paint the ghosted starting state on its
    // own frame first, so the transition to `.is-revealed` is guaranteed
    // to animate rather than risk being coalesced into the same frame.
    requestAnimationFrame(() => {
      requestAnimationFrame(revealImmediately);
    });
  }

  if (reduceMotionQuery.matches) {
    revealImmediately();
  } else {
    revealWithMotion();
  }

  // If the OS-level preference changes mid-session, honor it immediately.
  if (typeof reduceMotionQuery.addEventListener === 'function') {
    reduceMotionQuery.addEventListener('change', (event) => {
      if (event.matches) revealImmediately();
    });
  }
}
