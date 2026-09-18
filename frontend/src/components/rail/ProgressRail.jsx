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
 */

const CHAPTERS = ['.hero', '#about', '#destinations', '.feeling-section', '#experiences', '#planner'];

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

    function buildDots() {
      chapters = CHAPTERS.map((sel) => document.querySelector(sel)).filter(Boolean);
      dotsWrap.innerHTML = '';
      const docH = document.documentElement.scrollHeight;
      chapters.forEach((el) => {
        const top = el.getBoundingClientRect().top + window.scrollY;
        const dot = document.createElement('span');
        dot.className = 'progress-rail__dot';
        dot.style.top = `${Math.min(100, (top / docH) * 100)}%`;
        dotsWrap.appendChild(dot);
      });
    }

    function update() {
      const docH = document.documentElement.scrollHeight;
      const vh = window.innerHeight;
      const progress = Math.min(1, Math.max(0, window.scrollY / (docH - vh || 1)));
      fill.style.transform = `scaleY(${progress})`;

      const mid = window.scrollY + vh * 0.5;
      let active = -1;
      chapters.forEach((el, i) => {
        if (el.getBoundingClientRect().top + window.scrollY <= mid) active = i;
      });
      dotsWrap
        .querySelectorAll('.progress-rail__dot')
        .forEach((d, i) => d.classList.toggle('is-active', i === active));
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

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', rebuild);
    rebuild();

    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', rebuild);
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
