/**
 * Polish — hero image scroll parallax (depth layer, analysis item 8).
 * The hero wrapper drifts at 12% of scroll speed while the hero is on
 * screen: the photo moves slower than the page, adding depth between
 * the image, the M3 headline and the content below.
 *
 * Applied to the WRAPPER, not the img — the img's entrance animation
 * is fill-forwards and would permanently override an inline transform.
 * The wrapper is over-sized in CSS (inset -10% vertical) so the drift
 * never exposes an edge. Read-only passive scroll, rAF-throttled,
 * transform-only (R2). Reduced motion: never attaches.
 */

export function initHeroParallax() {
  const layer = document.querySelector('.hero .hero-image');
  if (!layer) return undefined;

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotionQuery.matches) return undefined;

  function update() {
    const y = window.scrollY;
    if (y <= window.innerHeight * 1.2) {
      layer.style.transform = `translateY(${(y * 0.12).toFixed(1)}px)`;
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
  update();

  return () => {
    window.removeEventListener('scroll', requestUpdate);
  };
}
