/**
 * Animation 02 — M2 Ghost → Solid Ink-In (reversible).
 * Spec: docs/MOTION_ANALYSIS.md (M2) · Handoff: user module, 2026-09-18.
 *
 * Trigger: IntersectionObserver toggles `.is-materialized` as each
 * `.m2-title` enters/leaves the viewport — reversible, tied to normal
 * scrolling, no scroll-jacking (no preventDefault, no hijacked scroll
 * position). Titles un-ink again when scrolled back out of view.
 *
 * This deliberately does NOT reuse reveal.js: that primitive unobserves
 * after the first reveal (one-shot), while M2 is documented as reversing
 * on scroll-back. threshold/rootMargin match reveal.js's parameters so
 * "in view" means the same thing everywhere on the site.
 *
 * Reduced motion: the observer is never attached; titles are settled to
 * their final state once. If the OS preference flips mid-session, the
 * observer disconnects and titles settle.
 *
 * Adapted from the handoff IIFE into a React-lifecycle module: returns
 * a cleanup function so the observer is disconnected when the page
 * unmounts (route change) — behavior is otherwise identical.
 */

export function initM2GhostSolid() {
  const titles = document.querySelectorAll('.m2-title');
  if (!titles.length) return undefined;

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  function settleAll() {
    titles.forEach((title) => {
      title.classList.add('is-materialized');
    });
  }

  if (reduceMotionQuery.matches) {
    // Reduced motion: final state immediately and permanently —
    // re-ghosting on scroll would itself be the motion opted out of.
    settleAll();
    return undefined;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-materialized', entry.isIntersecting);
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }
  );

  titles.forEach((title) => {
    observer.observe(title);
  });

  const onPreferenceChange = (event) => {
    if (event.matches) {
      observer.disconnect();
      settleAll();
    }
  };

  if (typeof reduceMotionQuery.addEventListener === 'function') {
    reduceMotionQuery.addEventListener('change', onPreferenceChange);
  }

  // React cleanup: disconnect on unmount (route change).
  return () => {
    observer.disconnect();
    if (typeof reduceMotionQuery.removeEventListener === 'function') {
      reduceMotionQuery.removeEventListener('change', onPreferenceChange);
    }
  };
}
