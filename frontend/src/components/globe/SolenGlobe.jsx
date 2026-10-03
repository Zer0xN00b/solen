/**
 * The SOLEN globe — v4 "the globe is the navigator" (Plan B, 2026-09-21).
 *
 * The destination sidebar is gone. The globe owns the section:
 *  - each destination's NAME is typed at its marker as a live HTML
 *    label (our Cormorant, cream on starfield), projected through the
 *    globe camera every frame and fading as the city swings to the
 *    far side;
 *  - hovering a marker/label/chip pauses the spin and opens a preview
 *    card (photo, region, one-liner) at the foot of the stage;
 *  - clicking a marker, label or chip travels to the destination
 *    page;
 *  - a quiet chip row under the globe is the scannable + touch +
 *    keyboard fallback (Plan B's backup that stayed); focusing a chip
 *    or label flies the globe to that city via the `focus` prop.
 *
 * Labels double as the accessible path: they are real buttons in the
 * DOM, focusable and read by screen readers regardless of opacity.
 *
 * Carried over from v3: react-globe with vendored textures, StrictMode
 * canvas re-attach, stable callbacks, lazy chunk, live reduced-motion
 * (ambient spin + cloud drift frozen; the user-initiated spin-to still
 * animates as navigation feedback).
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import ReactGlobe from 'react-globe';
import './SolenGlobe.css';
import {
  getGlobeDestinations,
  loadDestinationContent,
  subscribe,
} from '../../data/destinationSource.js';

const MARKER_COLOR = '#ffd9a0';

/**
 * Built from the data-source module rather than the raw JS file, and inside
 * the component (memoised) rather than at module scope — the module's cache
 * is replaced when the API answers, and a module-level const would be frozen
 * at import time and never pick that up.
 *
 * `id` stays `index + 1` and the source array keeps its original order, so
 * marker identity and the label/chip rows are unchanged.
 */
function buildMarkers(destinations) {
  return destinations.map((destination, index) => ({
    id: index + 1,
    city: destination.name,
    region: destination.region,
    slug: destination.slug,
    coordinates: [destination.lat, destination.lng],
    color: MARKER_COLOR,
    value: 0,
  }));
}

// react-globe's exact lat/lng -> scene-space formula (radius 300 globe).
function latLngToScene(lat, lng, radius) {
  const phi = (lat * Math.PI) / 180;
  const theta = ((lng - 180) * Math.PI) / 180;
  return [
    -radius * Math.cos(phi) * Math.cos(theta),
    radius * Math.sin(phi),
    radius * Math.cos(phi) * Math.sin(theta),
  ];
}

// Markers carry our own HTML labels and preview card instead of the
// library's tooltips. With tooltips off, react-globe's two tippy
// stylesheets styled nothing that exists — and `tippy.js` is not a
// declared dependency of the frontend, only a transitive one via
// react-globe — so they are no longer imported.
const options = {
  enableMarkerTooltip: false,
};

function SolenGlobe() {
  const navigate = useNavigate();
  const hostRef = useRef(null);
  const labelElsRef = useRef([]);
  const globeInstanceRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [preview, setPreview] = useState(null);
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const spinRafRef = useRef(null);

  // Refresh destination content from the API. Not a gate: the data-source
  // module is already serving the bundled values, so the globe renders fully
  // on the first frame and nothing waits on this.
  useEffect(() => {
    loadDestinationContent();
  }, []);

  // Re-render once the API response replaces the cache. Reading the module's
  // accessor during render is not enough on its own — a module variable
  // changing does not re-render anything by itself. The value is never read;
  // only the setter is needed, to trigger the render that re-reads the cache.
  const [, setContentVersion] = useState(0);
  useEffect(() => subscribe(setContentVersion), []);

  // Labels, chips and the preview card all read the same ordered array the
  // markers were built from, so the three surfaces can never disagree. Named
  // `globeEntries` because `globe` is already the three.js instance inside
  // the rAF loop below.
  const globeEntries = getGlobeDestinations();

  // Memoised on the array itself: the source module keeps a stable reference
  // until the API response replaces the whole cache, at which point this
  // component re-renders (via `contentVersion`) and picks up the new array.
  const markers = useMemo(() => buildMarkers(globeEntries), [globeEntries]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onPreferenceChange = (event) => setReduced(event.matches);
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', onPreferenceChange);
    }
    return () => {
      if (typeof query.removeEventListener === 'function') {
        query.removeEventListener('change', onPreferenceChange);
      }
    };
  }, []);

  // Freeze autonomous motion under reduced motion (cloud drift + spin).
  useEffect(() => {
    const instance = globeInstanceRef.current;
    if (!instance) return;
    if (reduced) {
      instance.animateClouds = () => {};
      if (instance.orbitControls) instance.orbitControls.autoRotate = false;
    }
  }, [reduced, size]);

  // Measure the stage; react-globe sizes once at mount, so size
  // changes remount it via the key below.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    let rafId = null;
    const measure = () => {
      setSize({ width: host.clientWidth, height: host.clientHeight });
    };
    const observer = new ResizeObserver(() => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        measure();
      });
    });
    observer.observe(host);
    measure();

    return () => {
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  // Project the seven labels through the globe camera every frame.
  useEffect(() => {
    if (!size.width) return undefined;

    const world = new THREE.Vector3();
    const projected = new THREE.Vector3();
    const camDir = new THREE.Vector3();

    let rafId = null;
    const tick = () => {
      rafId = requestAnimationFrame(tick);
      const globe = globeInstanceRef.current;
      if (!globe || !globe.camera) return;

      camDir.copy(globe.camera.position).normalize();

      // Read the current array inside the loop rather than closing over a
      // render-scope value: this runs every frame, and it must see the API
      // data once it lands without the effect being torn down and re-registered.
      const entries = getGlobeDestinations();
      for (let i = 0; i < entries.length; i += 1) {
        const el = labelElsRef.current[i];
        if (!el) continue;
        const d = entries[i];
        world.set(...latLngToScene(d.lat, d.lng, 300)).normalize();
        const facing = world.dot(camDir);

        projected.set(...latLngToScene(d.lat, d.lng, 300)).project(globe.camera);
        const x = (projected.x * 0.5 + 0.5) * size.width;
        const y = (-projected.y * 0.5 + 0.5) * size.height;

        const visible = facing > 0.12;
        el.style.opacity = visible ? Math.min(1, (facing - 0.12) / 0.3).toFixed(2) : '0';
        el.style.pointerEvents = visible ? 'auto' : 'none';
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      }
    };
    tick();

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [size]);

  // react-globe's cleanup removes its React-owned canvas from the DOM;
  // under StrictMode's dev double-mount the second instance would
  // render into a detached canvas. Cache + re-insert.
  const canvasNodeRef = useRef(null);
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const wrapper = host.firstElementChild;
    if (!wrapper) return;
    const connected = wrapper.querySelector('canvas');
    if (connected) canvasNodeRef.current = connected;
    else if (canvasNodeRef.current && !canvasNodeRef.current.isConnected) {
      wrapper.insertBefore(canvasNodeRef.current, wrapper.firstChild);
    }
  });

  // Spin the destination to face the camera along a great-circle arc
  // at the CURRENT radius — react-globe's built-in focus tween lerps
  // the camera through space in a straight chord (reads as a jump)
  // and zooms in; this reads as the globe turning. The arc animates
  // for everyone, including prefers-reduced-motion users: it is
  // user-initiated navigation feedback (an accepted reduced-motion
  // exception, and explicitly requested); reduced motion still kills
  // the AUTONOMOUS motion (ambient spin, cloud drift).
  const spinTo = useCallback((destination) => {
    const globe = globeInstanceRef.current;
    if (!globe?.camera?.position) return;

    if (spinRafRef.current !== null) cancelAnimationFrame(spinRafRef.current);

    const radius = globe.camera.position.length();
    const target = new THREE.Vector3(...latLngToScene(destination.lat, destination.lng, 300))
      .normalize()
      .multiplyScalar(radius);
    const from = globe.camera.position.clone();

    if (globe.orbitControls) globe.orbitControls.enabled = false;

    const start = performance.now();
    const duration = 1100;
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

    const step = (now) => {
      const t = ease(Math.min(1, (now - start) / duration));
      globe.camera.position
        .copy(from)
        .lerp(target, t)
        .normalize()
        .multiplyScalar(radius);
      if (t < 1) {
        spinRafRef.current = requestAnimationFrame(step);
      } else {
        spinRafRef.current = null;
        if (globe.orbitControls) globe.orbitControls.enabled = true;
      }
    };
    spinRafRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(
    () => () => {
      if (spinRafRef.current !== null) cancelAnimationFrame(spinRafRef.current);
    },
    []
  );

  const handleGetGlobe = useCallback(
    (instance) => {
      globeInstanceRef.current = instance;
      if (reduced) {
        instance.animateClouds = () => {};
        if (instance.orbitControls) instance.orbitControls.autoRotate = false;
      }
    },
    [reduced]
  );

  const handleOverMarker = useCallback((marker) => {
    const destination = getGlobeDestinations().find(
      (d) => d.name === marker.city,
    );
    if (destination) setPreview(destination);
  }, []);

  const handleOutMarker = useCallback(() => {
    setPreview(null);
  }, []);

  const handleClickMarker = useCallback(
    (marker) => {
      navigate(`/destinations/${marker.slug}`);
    },
    [navigate]
  );

  const openDestination = (destination) => navigate(`/destinations/${destination.slug}`);

  const focusDestination = (destination) => {
    setPreview(destination);
    spinTo(destination);
  };

  return (
    <section className="solen-globe-section">
      <div className="solen-globe-heading">
        <div className="solen-globe-label">
          <span>02</span>
          THE WORLD, CURATED
        </div>

        <div className="solen-globe-heading-copy">
          <h2 data-reveal="blur">
            Your world,
            <br />
            <em>beautifully open.</em>
          </h2>

          <p>Seven places to begin. Countless ways to make the journey your own.</p>
        </div>
      </div>

      <div className="solen-globe-stage">
        <div className="solen-globe-canvas" ref={hostRef}>
          {size.width > 0 && (
            <ReactGlobe
              key={`${size.width}x${size.height}-${reduced ? 'static' : 'live'}`}
              width={size.width}
              height={size.height}
              markers={markers}
              globeTexture="/assets/globe/globe.jpg"
              globeCloudsTexture="/assets/globe/clouds.png"
              globeBackgroundTexture="/assets/globe/background.png"
              options={{
                ...options,
                // Declarative: hovering anything (preview open) pauses
                // the spin; the lib re-applies options every render, so
                // an imperative pause would be overwritten.
                enableCameraAutoRotate: !reduced && !preview,
              }}
              onGetGlobe={handleGetGlobe}
              onMouseOverMarker={handleOverMarker}
              onMouseOutMarker={handleOutMarker}
              onClickMarker={handleClickMarker}
            />
          )}

          {/* Typed destination names, projected onto the globe. */}
          <div className="solen-globe-labels" aria-hidden="false">
            {globeEntries.map((destination, index) => (
              <button
                key={destination.name}
                type="button"
                ref={(el) => {
                  labelElsRef.current[index] = el;
                }}
                className="solen-globe-destination-label"
                onMouseEnter={() => setPreview(destination)}
                onMouseLeave={() => setPreview(null)}
                onFocus={() => focusDestination(destination)}
                onClick={() => openDestination(destination)}
              >
                {destination.name}
              </button>
            ))}
          </div>

          {preview && (
            <div className="solen-globe-preview-card" key={preview.slug}>
              <img src={preview.image} alt={preview.name} />
              <div>
                <p className="solen-globe-preview-region">{preview.region}</p>
                <p className="solen-globe-preview-copy">{preview.description}</p>
                <p className="solen-globe-preview-hint">click to explore ↗</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quiet scannable / touch / keyboard fallback row. */}
      <div className="solen-globe-chips">
        {globeEntries.map((destination) => (
          <button
            key={destination.name}
            type="button"
            className={preview?.name === destination.name ? 'active' : ''}
            onMouseEnter={() => focusDestination(destination)}
            onMouseLeave={() => setPreview(null)}
            onFocus={() => focusDestination(destination)}
            onClick={() => openDestination(destination)}
          >
            {destination.name}
          </button>
        ))}
      </div>
    </section>
  );
}

export default SolenGlobe;
