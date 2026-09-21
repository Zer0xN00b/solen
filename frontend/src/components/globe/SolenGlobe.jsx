/**
 * The SOLEN globe — M6 upgrade (2026-09-21): a real 3D night globe.
 *
 * A true sphere (three.js + three-globe) textured with NASA Black
 * Marble night imagery — accurate continents, city lights glowing —
 * wrapped in a plum atmosphere. The seven destinations sit at their
 * real coordinates as warm markers with cream radar rings pulsing
 * out of them; hovering a destination in the list flies the globe to
 * that city (upright-pole quaternion tween) and opens an image
 * preview in the info panel. Drag orbits; idle auto-spins.
 *
 * Entrance: when the section scrolls into view the globe material
 * ramps from black to full — the lights "fill" the cities.
 *
 * Performance & contract: DPR capped at 2, rAF + three-globe paused
 * while the tab is hidden, renderer disposed on unmount. Reduced
 * motion: no idle spin, no ring pulses, the light ramp is instant
 * and fly-to is a jump — a static, fully visible globe. The
 * preference is LIVE: flipping it mid-session re-configures.
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import ThreeGlobe from 'three-globe';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './SolenGlobe.css';
import { globeDestinations } from '../../data/globeDestinations.js';

const CREAM = '250, 247, 241';
const CAMERA_DISTANCE = 320;

// NASA Black Marble night imagery + topology bump, committed under
// public/assets/globe (the three-globe package does not export its
// example images through its exports field).
const earthNight = '/assets/globe/earth-night.jpg';
const earthTopo = '/assets/globe/earth-topology.png';

// Geographic position to a unit-space vector on the globe surface —
// MUST mirror three-globe's internal Polar2Cartesian exactly
// (theta = 90 - lng, unsigned axes) or fly-to lands on the wrong face.
function latLngToVector3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (90 - lng) * (Math.PI / 180);
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Exact upright orientation that brings (lat,lng) to face the camera
// (+Z) with the north pole kept in the screen-up plane: build the
// local orthonormal basis (x right, y up-ish from the pole, z toward
// the viewer) and invert it.
function uprightQuaternionFor(lat, lng) {
  const zL = latLngToVector3(lat, lng, 1).normalize();
  const north = new THREE.Vector3(0, 1, 0);
  const xL = new THREE.Vector3().crossVectors(north, zL).normalize();
  const yL = new THREE.Vector3().crossVectors(zL, xL).normalize();
  const m = new THREE.Matrix4().makeBasis(xL, yL, zL);
  return new THREE.Quaternion().setFromRotationMatrix(m).invert();
}

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

function SolenGlobe() {
  const navigate = useNavigate();
  const stageRef = useRef(null);
  const canvasHostRef = useRef(null);
  const apiRef = useRef(null);
  const [activeDestination, setActiveDestination] = useState(globeDestinations[0]);

  useEffect(() => {
    const host = canvasHostRef.current;
    const stage = stageRef.current;
    if (!host || !stage) return undefined;

    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 2000);
    camera.position.set(0, 0, CAMERA_DISTANCE);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const key = new THREE.DirectionalLight(0xfff2dd, 1.1);
    key.position.set(220, 140, 200);
    scene.add(key);

    // Custom globe material: NASA night texture as both map and
    // emissive map, topology as bump. The emissive channel makes the
    // city lights genuinely glow; `emissiveIntensity` starts at 0 and
    // ramps to full when the section enters view — the "lights
    // filling the cities" beat.
    const loader = new THREE.TextureLoader();
    const nightTex = loader.load(earthNight);
    nightTex.colorSpace = THREE.SRGBColorSpace;
    const bumpTex = loader.load(earthTopo);
    const globeMat = new THREE.MeshPhongMaterial({
      map: nightTex,
      emissiveMap: nightTex,
      emissive: new THREE.Color('#ffe9c4'),
      emissiveIntensity: 0,
      bumpMap: bumpTex,
      bumpScale: 0.4,
      shininess: 4,
      color: new THREE.Color('#141420'),
    });

    const globe = new ThreeGlobe()
      .globeMaterial(globeMat)
      .showAtmosphere(true)
      .atmosphereColor('#8a6478')
      .atmosphereAltitude(0.22)
      .pointsData(globeDestinations)
      .pointLat((d) => d.lat)
      .pointLng((d) => d.lng)
      .pointColor(() => '#ffd9a0')
      .pointRadius(0.8)
      .pointAltitude(0.02)
      .pointResolution(12)
      .ringsData(reduceQuery.matches ? [] : globeDestinations)
      .ringLat((d) => d.lat)
      .ringLng((d) => d.lng)
      .ringColor(() => (t) => `rgba(${CREAM}, ${(1 - t) * 0.8})`)
      .ringMaxRadius(5)
      .ringPropagationSpeed(1.5)
      .ringRepeatPeriod(1300)
      .ringAltitude(0.05);
    scene.add(globe);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.45;

    // --- state ---
    let rafId = null;
    let litStart = null; // set once the section enters view
    let idle = true;
    let idleTimer = null;
    let fly = null; // { fromQ, toQ, fromCam, start, dur }

    const DEFAULT_CAM = new THREE.Vector3(0, 0, CAMERA_DISTANCE);

    function size() {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    function pauseSpin() {
      idle = false;
      if (idleTimer) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        idle = true;
      }, 6000);
    }

    function flyTo(destination) {
      if (reduceQuery.matches) {
        globe.quaternion.copy(uprightQuaternionFor(destination.lat, destination.lng));
        camera.position.copy(DEFAULT_CAM);
        return;
      }
      fly = {
        fromQ: globe.quaternion.clone(),
        toQ: uprightQuaternionFor(destination.lat, destination.lng),
        fromCam: camera.position.clone(),
        start: performance.now(),
        dur: 1200,
      };
      pauseSpin();
    }

    apiRef.current = { flyTo };

    function markLit() {
      if (litStart === null) litStart = performance.now();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          markLit();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(stage);
    if (reduceQuery.matches) markLit();

    function frame(now) {
      rafId = requestAnimationFrame(frame);

      if (fly) {
        const t = easeInOut(Math.min(1, (now - fly.start) / fly.dur));
        globe.quaternion.slerpQuaternions(fly.fromQ, fly.toQ, t);
        camera.position.lerpVectors(fly.fromCam, DEFAULT_CAM, t);
        if (t >= 1) fly = null;
      } else if (idle && !reduceQuery.matches) {
        globe.rotateY(0.0016);
      }

      // Lights-fill ramp: emissive intensity 0 -> glowing.
      if (litStart !== null) {
        globeMat.emissiveIntensity = reduceQuery.matches
          ? 1.6
          : 1.6 * easeInOut(Math.min(1, (now - litStart) / 1800));
      }

      controls.update();
      renderer.render(scene, camera);
    }

    function start() {
      if (rafId === null) {
        globe.resumeAnimation();
        rafId = requestAnimationFrame(frame);
      }
    }
    function stop() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
        globe.pauseAnimation();
      }
    }

    const onVisibility = () => (document.hidden ? stop() : start());
    const onPointerDown = () => pauseSpin();

    const onPreferenceChange = (event) => {
      if (event.matches) {
        globe.ringsData([]);
        idle = false;
      } else {
        globe.ringsData(globeDestinations);
        idle = true;
      }
    };

    const ro = new ResizeObserver(size);
    ro.observe(host);
    size();

    document.addEventListener('visibilitychange', onVisibility);
    controls.addEventListener('start', onPointerDown);
    if (typeof reduceQuery.addEventListener === 'function') {
      reduceQuery.addEventListener('change', onPreferenceChange);
    }

    start();

    return () => {
      stop();
      apiRef.current = null;
      observer.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      controls.removeEventListener('start', onPointerDown);
      if (typeof reduceQuery.removeEventListener === 'function') {
        reduceQuery.removeEventListener('change', onPreferenceChange);
      }
      if (idleTimer) window.clearTimeout(idleTimer);
      controls.dispose();
      globe._destructor?.();
      scene.remove(globe);
      nightTex.dispose();
      bumpTex.dispose();
      globeMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleFocus = (destination) => {
    setActiveDestination(destination);
    apiRef.current?.flyTo(destination);
  };

  const handleOpen = (destination) => {
    navigate(`/destinations/${destination.slug}`);
  };

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
        <div className="solen-globe-stage" ref={stageRef}>
          <div className="solen-globe-orbit orbit-one"></div>
          <div className="solen-globe-orbit orbit-two"></div>

          <div className="solen-globe-canvas" ref={canvasHostRef}></div>
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
