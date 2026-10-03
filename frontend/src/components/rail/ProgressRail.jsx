import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './ProgressRail.css';

/**
 * Stage layer 2 — progress rail (M10). Persistent chrome (P5): a
 * hairline that fills with scroll, plus one dot per chapter placed at
 * the chapter's true position in the document. Read-only scroll
 * reflection — passive listener, rAF-throttled, transform-only
 * writes. Rebuilds its chapter dots on route change.
 *
 * No autonomous motion, so reduced motion keeps the rail fully
 * functional (position is information, not animation); the CSS only
 * removes the dot pulse.
 *
 * Resize corrections (2026-09-19):
 *  1. The resize handler is rAF-throttled like the scroll handler.
 *     It previously ran on every resize event — hundreds during a
 *     window drag — with a full teardown each time.
 *  2. Dots are REUSED rather than destroyed. `innerHTML = ''` threw
 *     away every node and rebuilt it; now nodes are only created or
 *     removed when the chapter count actually changes, and otherwise
 *     just repositioned.
 *  3. Chapter offsets are measured once per rebuild and cached, so
 *     the per-frame scroll update performs no layout reads at all
 *     (it previously measured every chapter on every frame).
 */

const CHAPTERS = [
  '.hero',
  '.solen-globe-section',
  '#about',
  '#destinations',
  '.feeling-section',
  '#experiences',
  '#planner',
];

export default function ProgressRail() {
  const railRef = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;
    const fill = rail.querySelector('.progress-rail__fill');
    const dotsWrap = rail.querySelector('.progress-rail__dots');
    if (!fill || !dotsWrap) return undefined;

    let chapters = [];
    let tops = [];

    function syncDotNodes(count) {
      while (dotsWrap.children.length > count) {
        dotsWrap.removeChild(dotsWrap.lastChild);
      }
      while (dotsWrap.children.length < count) {
        const dot = document.createElement('span');
        dot.className = 'progress-rail__dot';
        dotsWrap.appendChild(dot);
      }
    }

    function buildDots() {
      chapters = CHAPTERS.map((sel) => document.querySelector(sel)).filter(Boolean);

      // READ phase — measure every chapter, cache for later frames.
      const docH = document.documentElement.scrollHeight;
      tops = chapters.map((el) => el.getBoundingClientRect().top + window.scrollY);

      // WRITE phase — reuse existing nodes, only reposition.
      syncDotNodes(chapters.length);
      for (let i = 0; i < chapters.length; i += 1) {
        dotsWrap.children[i].style.top = `${Math.min(100, (tops[i] / docH) * 100)}%`;
      }
    }

    function update() {
      const docH = document.documentElement.scrollHeight;
      const vh = window.innerHeight;
      const scrollY = window.scrollY;
      const progress = Math.min(1, Math.max(0, scrollY / (docH - vh || 1)));
      fill.style.transform = `scaleY(${progress})`;

      // Uses cached offsets — no layout reads in the scroll path.
      const mid = scrollY + vh * 0.5;
      let active = -1;
      for (let i = 0; i < tops.length; i += 1) {
        if (tops[i] <= mid) active = i;
      }
      for (let i = 0; i < dotsWrap.children.length; i += 1) {
        dotsWrap.children[i].classList.toggle('is-active', i === active);
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

    function rebuild() {
      buildDots();
      update();
    }

    let resizeTicking = false;
    function requestRebuild() {
      if (resizeTicking) return;
      resizeTicking = true;
      requestAnimationFrame(() => {
        rebuild();
        resizeTicking = false;
      });
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestRebuild, { passive: true });
    rebuild();

    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestRebuild);
    };
  }, [pathname]);

  return (
    <div className="progress-rail" ref={railRef} aria-hidden="true">
      <div className="progress-rail__dots"></div>
      <div className="progress-rail__line">
        <div className="progress-rail__fill"></div>
      </div>
    </div>
  );
}
