/**
 * Animation 04 — M7 Diagonal Marquee: pause control only.
 * Spec: docs/MOTION_ANALYSIS.md (M7) · Handoff: user module, 2026-09-18.
 *
 * The marquee itself is pure CSS and runs whether or not this file
 * loads. This module exists solely for WCAG 2.2.2 — letting a user
 * pause/resume continuous motion via animation-play-state. No scroll
 * listeners, no rAF loop, no per-frame work of any kind.
 *
 * Adapted from the handoff IIFE into a React-lifecycle module (cleanup
 * removes the listeners on unmount); behavior otherwise identical.
 */

export function initM7Marquee() {
  const marquee = document.querySelector('[data-animation="m7-diagonal-marquee"]');
  if (!marquee) return undefined;

  const track = marquee.querySelector('.m7-diagonal-marquee__track');
  const toggle = marquee.querySelector('.m7-diagonal-marquee__toggle');
  if (!track || !toggle) return undefined;

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Reduced motion: the CSS already stops the loop and hides the
  // button. Nothing for the toggle to do.
  if (reduceMotionQuery.matches) return undefined;

  let paused = false;

  const onClick = () => {
    paused = !paused;
    track.classList.toggle('is-paused', paused);
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = paused ? 'Play' : 'Pause';
  };

  toggle.addEventListener('click', onClick);

  // If the OS preference flips mid-session, drop back to the CSS's
  // reduced-motion presentation rather than leaving a paused loop.
  const onPreferenceChange = (event) => {
    if (event.matches) {
      track.classList.remove('is-paused');
    }
  };
  if (typeof reduceMotionQuery.addEventListener === 'function') {
    reduceMotionQuery.addEventListener('change', onPreferenceChange);
  }

  // React cleanup on unmount.
  return () => {
    toggle.removeEventListener('click', onClick);
    if (typeof reduceMotionQuery.removeEventListener === 'function') {
      reduceMotionQuery.removeEventListener('change', onPreferenceChange);
    }
  };
}
