/**
 * Stage layer 3 upgrade — M1 scroll-driven wipe (2026-09-19).
 * Spec: docs-backup/MOTION_ANALYSIS.md (M1): torn wipe, scroll-driven, no
 * hijacking. The static v1 tears now RISE over the previous chapter
 * as their seam enters the viewport: at entry the tear sits +100px
 * low (invisible against the next chapter's identical ground), and
 * as you scroll it sweeps up into place — the next sheet of paper
 * pulling over the previous chapter, continuously tied to scroll.
 *
 * Read-only passive scroll listener, rAF-throttled, transform-only
 * writes (R2).
 *
 * Two corrections (2026-09-19):
 *  1. Reads and writes are BATCHED. The previous version measured one
 *     tear then immediately wrote its transform, then measured the
 *     next — each write invalidating layout for the following read
 *     (forced synchronous reflow, once per tear per frame). Now every
 *     rect is measured first, then every transform is written.
 *  2. Reduced motion is LIVE rather than read once at init. Flipping
 *     the preference mid-session detaches and clears the inline
 *     transforms so the tears rest in their static v1 position.
 *
 * The flip suffix is resolved once at init: `.closest()` walks the
 * tree but does not depend on layout, so it never needs re-reading.
 */

export function initTornWipe() {
  const tears = Array.from(document.querySelectorAll('.torn-edge svg'));
  if (!tears.length) return undefined;

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const flips = tears.map((svg) => (svg.closest('.torn-edge--flip') ? ' scaleX(-1)' : ''));
  const offsets = new Array(tears.length).fill(0);

  let attached = false;
  let ticking = false;

  function update() {
    const vh = window.innerHeight;

    // READ phase — measure every seam before touching the DOM.
    for (let i = 0; i < tears.length; i += 1) {
      const rect = tears[i].parentElement.getBoundingClientRect();
      // 1 while the seam is at/below the entry zone, 0 once settled.
      offsets[i] = Math.min(1, Math.max(0, (rect.top - vh * 0.45) / (vh * 0.55)));
    }

    // WRITE phase — no further reads, so layout is invalidated once.
    for (let i = 0; i < tears.length; i += 1) {
      tears[i].style.transform = `translateY(${(offsets[i] * 100).toFixed(1)}px)${flips[i]}`;
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
    update();
  }

  function detach() {
    if (!attached) return;
    attached = false;
    window.removeEventListener('scroll', requestUpdate);
    window.removeEventListener('resize', requestUpdate);
    // Rest in the static v1 position, flip preserved by CSS/markup.
    for (let i = 0; i < tears.length; i += 1) {
      tears[i].style.transform = flips[i] ? flips[i].trim() : '';
    }
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
