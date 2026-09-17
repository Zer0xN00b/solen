/* Scroll-reveal primitive for [data-reveal] elements.
 *
 * Foundation only: it observes opted-in elements and adds
 * .is-revealed when they enter the viewport. Nothing on the site
 * uses it until an element opts in. Elements rendered later
 * (e.g. the journey result) are picked up automatically.
 *
 * Respects prefers-reduced-motion: elements are revealed
 * immediately, no observation.
 */

const SELECTOR = '[data-reveal]';

export function initReveal() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }
  );

  const watch = (el) => {
    if (reduced.matches) {
      el.classList.add('is-revealed');
    } else {
      observer.observe(el);
    }
  };

  document.querySelectorAll(SELECTOR).forEach(watch);

  // Pick up elements added later (planner results, libraries, …).
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.matches(SELECTOR)) watch(node);
        node.querySelectorAll(SELECTOR).forEach(watch);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
}
