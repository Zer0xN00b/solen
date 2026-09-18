import { useEffect, useRef } from 'react';
import './AmbientField.css';

/**
 * Stage layer 1 — ambient particle field (M5/M6 as permanent chrome).
 * Spec: docs/MOTION_ANALYSIS.md (M5/M6, P5) & docs/MOTION_FOUNDATION.md
 * ("The density lesson").
 *
 * Site-wide plum dust drifting on the ambient clock: ~50-70 particles,
 * slow drift + gentle twinkle + a touch of scroll parallax for depth.
 * Pure atmosphere — pointer-events off, aria-hidden, soft-light blend
 * so it whispers on both cream and plum chapters.
 *
 * Performance: one canvas, plain arcs (no shadow/blur), rAF paused
 * while the tab is hidden, particle count capped by area, DPR capped
 * at 2. Reduced motion: a single static frame — grain, not drift.
 */

const PLUM = '74, 25, 66'; // #4a1942, alpha applied per particle
const CREAM = '250, 247, 241'; // #faf7f1 — two-tone field: plum motes
// darken the light chapters, cream motes glow on the dark ones.

function makeParticles(width, height) {
  const count = Math.min(90, Math.round((width * height) / 15000));
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: 1 + Math.random() * 1.6,
    alpha: 0.2 + Math.random() * 0.3,
    phase: Math.random() * Math.PI * 2,
    twinkle: 0.3 + Math.random() * 0.7,
    vx: (Math.random() - 0.5) * 0.24,
    vy: (Math.random() - 0.5) * 0.16,
    depth: 0.3 + Math.random() * 0.7,
    light: Math.random() < 0.5,
  }));
}

export default function AmbientField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let particles = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let rafId = null;

    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = dpr();
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = makeParticles(width, height);
      if (reduceMotionQuery.matches) drawStatic();
    }

    function drawStatic() {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.light ? CREAM : PLUM}, ${p.alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawFrame() {
      frame += 1;
      const scroll = window.scrollY;
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        // Drift + wrap.
        p.x = (p.x + p.vx + width) % width;
        p.y = (p.y + p.vy + height) % height;

        // Twinkle and a touch of scroll parallax for depth.
        const alpha = p.alpha * (0.6 + 0.4 * Math.sin(frame * 0.01 * p.twinkle + p.phase));
        const y = (((p.y - scroll * 0.1 * p.depth) % height) + height) % height;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.light ? CREAM : PLUM}, ${alpha.toFixed(3)})`;
        ctx.arc(p.x, y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(drawFrame);
    }

    function start() {
      if (reduceMotionQuery.matches) {
        drawStatic();
        return;
      }
      if (rafId === null && !document.hidden) rafId = requestAnimationFrame(drawFrame);
    }

    function stop() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    const onVisibility = () => (document.hidden ? stop() : start());
    const onPreferenceChange = (event) => {
      stop();
      if (event.matches) drawStatic();
      else start();
    };

    resize();
    start();

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    if (typeof reduceMotionQuery.addEventListener === 'function') {
      reduceMotionQuery.addEventListener('change', onPreferenceChange);
    }

    return () => {
      stop();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      if (typeof reduceMotionQuery.removeEventListener === 'function') {
        reduceMotionQuery.removeEventListener('change', onPreferenceChange);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="ambient-field" aria-hidden="true"></canvas>;
}
