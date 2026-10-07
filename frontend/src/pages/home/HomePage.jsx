import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './HomePage.css';
import './m4Stepper.css';
import {
  getExperiences,
  getFeelings,
  getHomeDestinations,
  loadDestinationContent,
  subscribe,
} from '../../data/destinationSource.js';
import TornEdge from '../../components/edges/TornEdge.jsx';

// The 3D globe pulls in three.js — code-split so the rest of the site
// never pays for it.
const SolenGlobe = lazy(() => import('../../components/globe/SolenGlobe.jsx'));
import { initTornWipe } from '../../components/edges/tornWipe.js';
import { initHeroBlurIn } from './heroBlurIn.js';
import { initHeroParallax } from './heroParallax.js';
import { initM4Stepper } from './m4Stepper.js';

// Pixels scrolled before the nav switches from transparent to solid.
const NAV_SOLID_AT = 40;

function HomePage() {
  const navigate = useNavigate();
  const navRef = useRef(null);

  // Refresh destination cards from the API, then re-render when it lands.
  // The bundled cards render on the first frame, so the locked grid is never
  // empty and never shifts. `experiences` and `feelings` are homepage-only
  // marketing content with no database table, and stay bundled.
  const [, setContentVersion] = useState(0);
  useEffect(() => {
    loadDestinationContent();
    return subscribe(setContentVersion);
  }, []);

  const destinations = getHomeDestinations();
  const experiences = getExperiences();
  const feelings = getFeelings();

  // Animation 01 — hero headline per-word blur-in (M3). Trigger: page ready.
  useEffect(() => {
    initHeroBlurIn();
  }, []);

  // Nav scroll state. Over the hero the bar is transparent so the photograph
  // runs edge to edge; once scrolled, the sections beneath are pale, so the
  // cream links would vanish without it. Passive listener + rAF-throttle,
  // matching ProgressRail, and a class toggle rather than inline styles.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return undefined;

    let ticking = false;

    const update = () => {
      nav.classList.toggle('is-solid', window.scrollY > NAV_SOLID_AT);
      ticking = false;
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener('scroll', requestUpdate, { passive: true });
    update();

    return () => window.removeEventListener('scroll', requestUpdate);
  }, []);

  // Polish — hero image scroll parallax (depth layer). Trigger: scroll.
  useEffect(() => {
    initHeroParallax();
  }, []);

  // Animation 03 — M4 horizontal stepper over the four experiences.
  useEffect(() => initM4Stepper(), []);

  // Stage layer 3 upgrade — torn edges sweep up with scroll (M1).
  useEffect(() => initTornWipe(), []);

  return (
    <div className="app">
      {/* NAVIGATION */}
      <header className="navbar" ref={navRef}>
        <Link to="/" className="brand">
          <span className="hero-wordmark">SOLEN</span>
        </Link>

        <nav className="nav-links">
          <a href="#destinations">Destinations</a>
          <a href="#experiences">Experiences</a>
          <a href="#planner">Plan a Journey</a>
          <a href="#about">About</a>
        </nav>

        <a href="#planner" className="nav-cta">
          Start Planning <span>→</span>
        </a>

        {/* Account entry point (scope §47). Last in the bar so it never
            competes with the primary CTA. */}
        <Link to="/auth" className="nav-account">
          Sign in
        </Link>

        {/* Journey library (scope §48). Sits beside the account link, not
            inside .nav-links — those are in-page anchors that collapse on
            mobile, and the library is a real route that must stay reachable
            at every width. */}
        <Link to="/journeys" className="nav-library">
          Journeys
        </Link>
      </header>

      {/* HERO */}
      <main id="main-content" tabIndex={-1}>
        <section className="hero">
          <div className="hero-image">
            <img src="/assets/hero/hero-main.webp" alt="A cinematic travel destination" />
          </div>

          <div className="hero-overlay"></div>

          <div className="hero-content">
            <p className="hero-eyebrow">LUXURY TRAVEL CONCIERGE</p>

            <h1 data-animation="m3-blur-in">
              <span className="word">Some</span> <span className="word">journeys</span>
              <br />
              <span className="word">are</span> <span className="word">meant</span>{' '}
              <span className="word">to</span> <span className="word">be</span>
              <br />
              <span className="word">
                <em>discovered.</em>
              </span>
            </h1>

            <p className="hero-description">
              Curated journeys, beautiful places and experiences designed around the way you want to
              travel.
            </p>

            <div className="hero-buttons">
              <a href="#planner" className="button button-primary">
                Start Planning <span>→</span>
              </a>

              <a href="#destinations" className="button button-light">
                Explore Destinations
              </a>
            </div>
          </div>

          <div className="scroll-indicator">
            <span>Scroll to discover</span>
            <div></div>
          </div>
        </section>

        {/* Stage layer 3 — torn edge: hero photo -> oatmeal chapter. */}
        <TornEdge fill="#f3ebdd" />

        {/* GLOBE — promoted from section 05 to sit directly under the
            hero. It was previously 8+ viewports deep (after the 340vh
            stepper), which is why it went unnoticed. Loaded eagerly at
            the top now, but still code-split and still behind
            Suspense; the 770kB three.js chunk loads async so the hero
            paints first. */}
        <Suspense fallback={<div className="solen-globe-suspense" aria-hidden="true"></div>}>
          <SolenGlobe />
        </Suspense>

        {/* INTRO */}
        <section className="intro" id="about">
          <div className="section-label">
            <span>01</span>
            THE SOLEN WAY
          </div>

          <div className="intro-content">
            <h2 data-reveal="blur" data-reveal-lines>
              Travel should feel
              <br />
              <em>personal.</em>
            </h2>

            <div className="intro-copy">
              <p>Not a checklist. Not a package. Not another crowded itinerary.</p>

              <p>
                SOLEN creates thoughtful journeys around your curiosity, your pace and the way you
                want to feel when you arrive.
              </p>
            </div>
          </div>
        </section>

        {/* DESTINATIONS */}
        <section className="destinations-section" id="destinations">
          <div className="section-heading">
            <div className="section-label">
              <span>03</span>
              DESTINATIONS
            </div>

            <div>
              <h2 data-reveal="blur" data-reveal-lines>
                Where are you
                <br />
                <em>drawn to?</em>
              </h2>

              <p>Places chosen for the stories they have to tell.</p>
            </div>
          </div>

          <div className="destination-grid">
            {destinations.map((destination, index) => (
              <Link
                to={`/destinations/${destination.slug}`}
                className={`destination-card destination-${index + 1}`}
                key={destination.name}
              >
                <div className="destination-image">
                  <img src={destination.image} alt={destination.name} />
                </div>

                <div className="destination-info">
                  <div>
                    <span className="destination-number">0{index + 1}</span>

                    <h3>{destination.name}</h3>

                    <p>{destination.description}</p>
                  </div>

                  <span className="destination-arrow" aria-hidden="true">
                    ↗
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Stage layer 3 — torn edge into the plum chapter. */}
        <TornEdge fill="#4a1942" flip />

        {/* FEELING */}
        <section className="feeling-section">
          <div className="feeling-background"></div>

          <div className="feeling-content">
            <div className="section-label light-label">
              <span>04</span>
              START WITH A FEELING
            </div>

            <h2 data-reveal="blur" data-reveal-lines>
              How do you want
              <br />
              to <em>feel?</em>
            </h2>

            <p>Sometimes the destination comes later. Start with the feeling.</p>

            <div className="feeling-list">
              {feelings.map((feeling) => (
                <button
                  key={feeling.key}
                  type="button"
                  onClick={() => navigate(`/planner?feeling=${feeling.key}`)}
                >
                  {feeling.label}
                  <span>→</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Stage layer 3 — torn edge out of the plum chapter. */}
        <TornEdge fill="#f3ebdd" />

        {/* EXPERIENCES */}
        <section className="experiences-section" id="experiences">
          <div className="section-heading experience-heading">
            <div className="section-label">
              <span>05</span>
              EXPERIENCES
            </div>

            <div>
              <h2 data-reveal="blur" data-reveal-lines>
                Travel beyond
                <br />
                <em>the itinerary.</em>
              </h2>

              <p>The experiences you'll remember long after you've returned home.</p>
            </div>
          </div>

          <div className="m4-stepper" data-animation="m4-horizontal-stepper">
            <div className="m4-stepper__sticky">
              <div className="m4-stepper__ghosts" aria-hidden="true">
                {experiences.map((experience, i) => (
                  <span className="m4-stepper__ghost" key={experience.key}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                ))}
              </div>

              <div className="m4-stepper__track">
                {experiences.map((experience, i) => (
                  <article className="m4-stepper__step" key={experience.key}>
                    <p className="m4-stepper__index">
                      {String(i + 1).padStart(2, '0')} / {String(experiences.length).padStart(2, '0')}
                    </p>

                    <h3 className="m4-stepper__title">{experience.title}</h3>

                    <p className="m4-stepper__line">{experience.description}</p>

                    <button
                      type="button"
                      className="m4-stepper__cta"
                      onClick={() => navigate(`/planner?experience=${experience.key}`)}
                    >
                      Discover <span>→</span>
                    </button>
                  </article>
                ))}
              </div>

              <div className="m4-stepper__indicator" aria-hidden="true">
                {experiences.map((experience, i) => (
                  <span
                    className={`m4-stepper__dot${i === 0 ? ' is-active' : ''}`}
                    key={experience.key}
                  ></span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Stage layer 3 — torn edge into the cream planner chapter. */}
        <TornEdge fill="#faf7f1" flip />

        {/* PLANNER CTA */}
        <section className="planner-section" id="planner">
          <div className="planner-inner">
            <p className="planner-eyebrow">YOUR JOURNEY AWAITS</p>

            <h2 data-reveal="blur" data-reveal-lines>
              Your next story
              <br />
              is <em>waiting.</em>
            </h2>

            <p>
              Tell us where you're dreaming of going, how you want to travel and what matters to
              you.
            </p>

            <Link to="/planner" className="button planner-button">
              Build My Journey <span>→</span>
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-brand">
          <img src="/assets/brand/solen-logo.png" alt="SOLEN" />

          <p>
            Travel thoughtfully.
            <br />
            Discover beautifully.
          </p>
        </div>

        <div className="footer-links">
          <a href="#destinations">Destinations</a>
          <a href="#experiences">Experiences</a>
          <a href="#planner">Plan a Journey</a>
          <a href="#about">About SOLEN</a>
        </div>

        <div className="footer-bottom">
          <span>© 2026 SOLEN</span>
          <span>Luxury Travel Concierge</span>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
