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
 * transform-only (R2).
 *
 * Reduced motion is LIVE (2026-09-19): the preference is no longer read
 * once at init. Flipping it mid-session detaches the listener and
 * clears the inline transform so the photo rests in its static
 * position; flipping back re-attaches. Matches the contract that
 * reduced motion yields a static, fully visible site at all times.
 */

export function initHeroParallax() {
  const layer = document.querySelector('.hero .hero-image');
  if (!layer) return undefined;

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  let attached = false;
  let ticking = false;

  function update() {
    const y = window.scrollY;
    if (y <= window.innerHeight * 1.2) {
      layer.style.transform = `translateY(${(y * 0.12).toFixed(1)}px)`;
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
    update();
  }

  function detach() {
    if (!attached) return;
    attached = false;
    window.removeEventListener('scroll', requestUpdate);
    // Hand the element back to CSS: no inline drift left behind.
    layer.style.transform = '';
  }

  const onPreferenceChange = (event) => {
    if (event.matches) detach();
    else attach();
  };

  if (!reduceMotionQuery.matches) attach();

  if (typeof reduceMotionQuery.addEventListener === 'function') {
    reduceMotionQuery.addEventListener('change', onPreferenceChange);
  }

  return () => {
    detach();
    if (typeof reduceMotionQuery.removeEventListener === 'function') {
      reduceMotionQuery.removeEventListener('change', onPreferenceChange);
    }
  };
}
