/**
 * Stage layer 3 upgrade — M1 scroll-driven wipe (2026-09-19).
 * Spec: docs/MOTION_ANALYSIS.md (M1): torn wipe, scroll-driven, no
 * hijacking. The static v1 tears now RISE over the previous chapter
 * as their seam enters the viewport: at entry the tear sits +100px
 * low (invisible against the next chapter's identical ground), and
 * as you scroll it sweeps up into place — the next sheet of paper
 * pulling over the previous chapter, continuously tied to scroll.
 *
 * Read-only passive scroll listener, rAF-throttled, transform-only
 * writes (R2). Reduced motion: never attaches — tears rest in their
 * final static position (v1 behaviour).
 */

export function initTornWipe() {
  const tears = Array.from(document.querySelectorAll('.torn-edge svg'));
  if (!tears.length) return undefined;

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotionQuery.matches) return undefined;

  function update() {
    const vh = window.innerHeight;
    for (const svg of tears) {
      const rect = svg.parentElement.getBoundingClientRect();
      // 1 while the seam is at/below the entry zone, 0 once settled.
      const t = Math.min(1, Math.max(0, (rect.top - vh * 0.45) / (vh * 0.55)));
      const flip = svg.closest('.torn-edge--flip') ? ' scaleX(-1)' : '';
      svg.style.transform = `translateY(${(t * 100).toFixed(1)}px)${flip}`;
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
  window.addEventListener('resize', requestUpdate);
  update();

  return () => {
    window.removeEventListener('scroll', requestUpdate);
    window.removeEventListener('resize', requestUpdate);
  };
}
