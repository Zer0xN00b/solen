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
 * (no spin, frozen clouds, instant focus jumps).
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import ReactGlobe from 'react-globe';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';
import './SolenGlobe.css';
import { globeDestinations } from '../../data/globeDestinations.js';

const MARKER_COLOR = '#ffd9a0';

const markers = globeDestinations.map((destination, index) => ({
  id: index + 1,
  city: destination.name,
  region: destination.region,
  slug: destination.slug,
  coordinates: [destination.lat, destination.lng],
  color: MARKER_COLOR,
  value: 0,
}));

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

const options = {
  enableMarkerTooltip: false, // our labels + preview card replace tippy
};

function SolenGlobe() {
  const navigate = useNavigate();
  const hostRef = useRef(null);
  const labelElsRef = useRef([]);
  const globeInstanceRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [preview, setPreview] = useState(null);
  const [focusCoords, setFocusCoords] = useState(null);
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

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

      for (let i = 0; i < globeDestinations.length; i += 1) {
        const el = labelElsRef.current[i];
        if (!el) continue;
        const d = globeDestinations[i];
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

  const setSpin = (on) => {
    const instance = globeInstanceRef.current;
    if (instance?.orbitControls && !reduced) {
      instance.orbitControls.autoRotate = on;
    }
  };

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
    const destination = globeDestinations.find((d) => d.name === marker.city);
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
    setFocusCoords([destination.lat, destination.lng]);
  };

  return (
    <section className="solen-globe-section">
      <div className="solen-globe-heading">
        <div className="solen-globe-label">
          <span>05</span>
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
              focus={focusCoords}
              globeTexture="/assets/globe/globe.jpg"
              globeCloudsTexture="/assets/globe/clouds.png"
              globeBackgroundTexture="/assets/globe/background.png"
              options={{
                ...options,
                enableCameraAutoRotate: !reduced,
                focusAnimationDuration: reduced ? 0 : 1000,
                focusDistanceRadiusScale: 2.4, // keep the globe in view while focused
              }}
              onGetGlobe={handleGetGlobe}
              onMouseOverMarker={handleOverMarker}
              onMouseOutMarker={handleOutMarker}
              onClickMarker={handleClickMarker}
            />
          )}

          {/* Typed destination names, projected onto the globe. */}
          <div className="solen-globe-labels" aria-hidden="false">
            {globeDestinations.map((destination, index) => (
              <button
                key={destination.name}
                type="button"
                ref={(el) => {
                  labelElsRef.current[index] = el;
                }}
                className="solen-globe-destination-label"
                onMouseEnter={() => {
                  setPreview(destination);
                  setSpin(false);
                }}
                onMouseLeave={() => {
                  setPreview(null);
                  setSpin(true);
                }}
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
        {globeDestinations.map((destination) => (
          <button
            key={destination.name}
            type="button"
            className={preview?.name === destination.name ? 'active' : ''}
            onMouseEnter={() => {
              focusDestination(destination);
              setSpin(false);
            }}
            onMouseLeave={() => {
              setPreview(null);
              setSpin(true);
            }}
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
