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

/* Split an opted-in heading on its <br> boundaries, wrapping each
 * run of child nodes in a .reveal-line span so the per-line
 * transition in motion.css has something to attach to.
 *
 * Deliberately NOT innerHTML: these headings are React-owned, and
 * rewriting innerHTML out from under the reconciler risks a
 * mismatch on a later render. Moving the existing nodes into spans
 * instead leaves every node React knows about intact.
 *
 * The padding/margin pair cancels the blur's vertical bleed, so
 * splitting a heading never reflows it.
 *
 * Returns true if the element was split. No-ops on a single-line
 * heading — that keeps the ordinary whole-block reveal — and on
 * anything not opted in.
 */
function splitLines(el) {
  if (el.dataset.revealSplit === 'true') return true;
  el.dataset.revealSplit = 'true';

  if (!el.hasAttribute('data-reveal-lines')) return false;

  // Break the child list into runs, starting a new run at each <br>.
  const runs = [[]];
  for (const node of el.childNodes) {
    if (node.nodeType === 1 && node.tagName === 'BR') {
      runs.push([]);
    } else {
      runs[runs.length - 1].push(node);
    }
  }

  // Drop empty runs so a trailing <br> leaves no ghost line.
  const kept = runs.filter((nodes) => nodes.some((n) => n.textContent.trim()));

  if (kept.length < 2) return false;

  const fragment = document.createDocumentFragment();

  kept.forEach((nodes) => {
    const line = document.createElement('span');
    line.className = 'reveal-line';
    line.style.paddingBottom = '0.12em';
    line.style.marginBottom = '-0.12em';
    nodes.forEach((node) => line.appendChild(node));
    fragment.appendChild(line);
  });

  el.replaceChildren(fragment);
  return true;
}

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
      // Deliberately no splitting here: the wrapper is never built,
      // so there is no layout churn for a visitor who asked for
      // calm. motion.css force-shows the lines regardless.
      el.classList.add('is-revealed');
    } else {
      splitLines(el);
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
