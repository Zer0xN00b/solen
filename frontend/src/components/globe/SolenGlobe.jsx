/**
 * The SOLEN globe — v3 (2026-09-21): user-supplied react-globe globe.
 *
 * The user chose the chrisrzhou/react-globe look (blue marble, cloud
 * layer, starfield background, tippy tooltips on city markers) over
 * the previous three-globe night Earth. Integration notes:
 *
 * - The section chrome (heading, info panel, preview image,
 *   destination list) is unchanged locked design; only the stage's
 *   canvas host now renders <ReactGlobe>.
 * - Textures are VENDORED in public/assets/globe (the package
 *   hotlinks GitHub raw URLs by default — overridden via options so
 *   the site is self-contained).
 * - Markers are the seven SOLEN destinations at real coordinates;
 *   hover syncs the info panel (onMouseOverMarker), click travels to
 *   the destination page (onClickMarker).
 * - The globe is measured into its container; size changes remount
 *   it (react-globe sizes once at mount).
 * - Reduced motion: camera auto-rotate off, live preference flips
 *   remount the globe; markers/tooltips stay usable (position is
 *   information, not animation).
 * - Lazy-loaded from HomePage, so react-globe + three ship in their
 *   own chunk.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const options = {
  markerTooltipRenderer: (marker) => `${marker.city} · ${marker.region}`,
};

function SolenGlobe() {
  const navigate = useNavigate();
  const hostRef = useRef(null);
  const [activeDestination, setActiveDestination] = useState(globeDestinations[0]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const globeInstanceRef = useRef(null);

  // react-globe drifts its cloud layer inside the render loop with no
  // option to stop it; under reduced motion we freeze it directly on
  // the instance so the globe is truly static.
  useEffect(() => {
    const instance = globeInstanceRef.current;
    if (!instance) return;
    if (reduced) {
      instance.animateClouds = () => {};
      if (instance.orbitControls) instance.orbitControls.autoRotate = false;
    }
  }, [reduced, size]);

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

  // react-globe's unmount cleanup REMOVES its canvas from the DOM, but
  // React owns that node — under StrictMode's dev double-mount the
  // second Globe instance would render into a detached canvas. Cache
  // the node while connected and re-insert it after later commits;
  // idempotent and invisible in production.
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

  // All three callbacks must keep stable identities: react-globe's
  // mount effect depends on onGetGlobe, so a new function per render
  // would teardown/rebuild the WebGL globe on every parent render.
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
    if (destination) setActiveDestination(destination);
  }, []);

  const handleClickMarker = useCallback(
    (marker) => {
      navigate(`/destinations/${marker.slug}`);
    },
    [navigate]
  );

  const handleFocus = (destination) => setActiveDestination(destination);

  const handleOpen = (destination) => navigate(`/destinations/${destination.slug}`);

  const activeIndex = globeDestinations.findIndex((d) => d.name === activeDestination.name);

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

      <div className="solen-globe-layout">
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
                options={{ ...options, enableCameraAutoRotate: !reduced }}
                onGetGlobe={handleGetGlobe}
                onMouseOverMarker={handleOverMarker}
                onClickMarker={handleClickMarker}
              />
            )}
          </div>
        </div>

        <div className="solen-globe-info">
          <div className="solen-globe-preview" key={activeDestination.slug}>
            <img src={activeDestination.image} alt={activeDestination.name} />
          </div>

          <p className="solen-globe-info-label">CURRENTLY EXPLORING</p>

          <span className="solen-globe-number">0{activeIndex + 1}</span>

          <h3>{activeDestination.name}</h3>

          <p className="solen-globe-region">{activeDestination.region}</p>

          <p className="solen-globe-description">{activeDestination.description}</p>

          <button
            type="button"
            className="solen-globe-explore"
            onClick={() => handleOpen(activeDestination)}
          >
            Explore {activeDestination.name}
            <span>↗</span>
          </button>

          <div className="solen-globe-destination-list">
            {globeDestinations.map((destination, index) => (
              <button
                key={destination.name}
                type="button"
                className={activeDestination.name === destination.name ? 'active' : ''}
                onMouseEnter={() => handleFocus(destination)}
                onFocus={() => handleFocus(destination)}
                onClick={() => handleOpen(destination)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>

                {destination.name}

                <small>→</small>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SolenGlobe;
