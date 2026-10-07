import { useEffect, useRef } from 'react';
import './AmbientField.css';

/**
 * Stage layer 1 — ambient particle field (M5/M6 as permanent chrome).
 * Spec: docs-backup/MOTION_ANALYSIS.md (M5/M6, P5) & docs-backup/MOTION_FOUNDATION.md
 * ("The density lesson").
 *
 * Site-wide plum/cream dust on the ambient clock: slow drift, gentle
 * twinkle, slight scroll parallax for depth. Two-tone so motes read on
 * cream chapters (plum) and glow on plum ones (cream). Normal
 * compositing with honest alpha — soft-light blending proved
 * mathematically invisible (tuning rounds, 2026-09-18).
 *
 * Tiny-improvement pass: motes are pre-rendered radial-gradient
 * sprites (soft edges, no hard confetti dots) drawn via drawImage —
 * softer look AND cheaper per frame than live gradients.
 *
 * Performance: one canvas, sprites, rAF paused while the tab is
 * hidden, particle count capped by area, DPR capped at 2.
 * Reduced motion: ONE static frame — grain, not drift.
 *
 * Resize corrections (2026-09-19): the field is PRESERVED across a
 * resize instead of regenerated. Previously every resize event threw
 * away all ~90 motes and rolled a fresh random field, so the dust
 * visibly teleported during a window drag — and did so on every event
 * of the drag. Now positions are scaled proportionally to the new
 * viewport, motes are only added or trimmed when the area-derived cap
 * changes, and the handler is rAF-throttled.
 */

const PLUM = '74, 25, 66'; // #4a1942
const CREAM = '250, 247, 241'; // #faf7f1

function makeSprite(rgb) {
  const s = document.createElement('canvas');
  s.width = s.height = 64;
  const c = s.getContext('2d');
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, `rgba(${rgb}, 1)`);
  g.addColorStop(0.4, `rgba(${rgb}, 0.55)`);
  g.addColorStop(1, `rgba(${rgb}, 0)`);
  c.fillStyle = g;
  c.fillRect(0, 0, 64, 64);
  return s;
}

function particleCount(width, height) {
  return Math.min(90, Math.round((width * height) / 15000));
}

function makeParticles(width, height, count = particleCount(width, height)) {
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

    const sprites = { plum: makeSprite(PLUM), cream: makeSprite(CREAM) };
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let particles = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let rafId = null;
    let resizeRafId = null;

    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

    function paint(p, alpha, y) {
      const size = p.r * 5; // soft halo; visible core is the inner ~40%
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprites[p.light ? 'cream' : 'plum'], p.x - size / 2, y - size / 2, size, size);
    }

    function fitParticles(prevWidth, prevHeight) {
      if (!particles.length) {
        particles = makeParticles(width, height);
        return;
      }

      // Keep the existing field, just move it with the viewport.
      const scaleX = prevWidth > 0 ? width / prevWidth : 1;
      const scaleY = prevHeight > 0 ? height / prevHeight : 1;
      for (const p of particles) {
        p.x *= scaleX;
        p.y *= scaleY;
      }

      const target = particleCount(width, height);
      if (particles.length > target) {
        particles.length = target;
      } else if (particles.length < target) {
        particles = particles.concat(makeParticles(width, height, target - particles.length));
      }
    }

    function resize() {
      const prevWidth = width;
      const prevHeight = height;

      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = dpr();
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      fitParticles(prevWidth, prevHeight);

      if (reduceMotionQuery.matches) drawStatic();
    }

    function requestResize() {
      if (resizeRafId !== null) return;
      resizeRafId = requestAnimationFrame(() => {
        resizeRafId = null;
        resize();
      });
    }

    function drawStatic() {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) paint(p, p.alpha, p.y);
      ctx.globalAlpha = 1;
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

        paint(p, alpha, y);
      }
      ctx.globalAlpha = 1;

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

    window.addEventListener('resize', requestResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    if (typeof reduceMotionQuery.addEventListener === 'function') {
      reduceMotionQuery.addEventListener('change', onPreferenceChange);
    }

    return () => {
      stop();
      if (resizeRafId !== null) cancelAnimationFrame(resizeRafId);
      window.removeEventListener('resize', requestResize);
      document.removeEventListener('visibilitychange', onVisibility);
      if (typeof reduceMotionQuery.removeEventListener === 'function') {
        reduceMotionQuery.removeEventListener('change', onPreferenceChange);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="ambient-field" aria-hidden="true"></canvas>;
}
