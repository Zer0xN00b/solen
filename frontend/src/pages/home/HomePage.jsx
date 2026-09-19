import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import './m4Stepper.css';
import { destinations, experiences, feelings } from '../../data/homeContent.js';
import SolenGlobe from '../../components/globe/SolenGlobe.jsx';
import TornEdge from '../../components/edges/TornEdge.jsx';
import { initTornWipe } from '../../components/edges/tornWipe.js';
import { initHeroBlurIn } from './heroBlurIn.js';
import { initM4Stepper } from './m4Stepper.js';

function HomePage() {
  const navigate = useNavigate();

  // Animation 01 — hero headline per-word blur-in (M3). Trigger: page ready.
  useEffect(() => {
    initHeroBlurIn();
  }, []);

  // Animation 03 — M4 horizontal stepper over the four experiences.
  useEffect(() => initM4Stepper(), []);

  // Stage layer 3 upgrade — torn edges sweep up with scroll (M1).
  useEffect(() => initTornWipe(), []);

  return (
    <div className="app">
      {/* NAVIGATION */}
      <header className="navbar">
        <a href="#" className="brand">
          <span className="hero-wordmark">SOLEN</span>
        </a>

        <nav className="nav-links">
          <a href="#destinations">Destinations</a>
          <a href="#experiences">Experiences</a>
          <a href="#planner">Plan a Journey</a>
          <a href="#about">About</a>
        </nav>

        <a href="#planner" className="nav-cta">
          Start Planning <span>→</span>
        </a>
      </header>

      {/* HERO */}
      <main>
        <section className="hero">
          <div className="hero-image">
            <img src="/assets/hero/hero-main.png" alt="A cinematic travel destination" />
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

        {/* INTRO */}
        <section className="intro" id="about">
          <div className="section-label">
            <span>01</span>
            THE SOLEN WAY
          </div>

          <div className="intro-content">
            <h2 data-reveal>
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
              <span>02</span>
              DESTINATIONS
            </div>

            <div>
              <h2>
                Where are you
                <br />
                <em>drawn to?</em>
              </h2>

              <p>Places chosen for the stories they have to tell.</p>
            </div>
          </div>

          <div className="destination-grid">
            {destinations.map((destination, index) => (
              <article
                className={`destination-card destination-${index + 1}`}
                key={destination.name}
                onClick={() =>
                  navigate(`/destinations/${destination.name.toLowerCase().replace(/\s+/g, '-')}`)
                }
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

                  <span className="destination-arrow">↗</span>
                </div>
              </article>
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
              <span>03</span>
              START WITH A FEELING
            </div>

            <h2>
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
              <span>04</span>
              EXPERIENCES
            </div>

            <div>
              <h2>
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
        <SolenGlobe />

        {/* Stage layer 3 — torn edge into the cream planner chapter. */}
        <TornEdge fill="#faf7f1" flip />

        {/* PLANNER CTA */}
        <section className="planner-section" id="planner">
          <div className="planner-inner">
            <p className="planner-eyebrow">YOUR JOURNEY AWAITS</p>

            <h2>
              Your next story
              <br />
              is <em>waiting.</em>
            </h2>

            <p>
              Tell us where you're dreaming of going, how you want to travel and what matters to
              you.
            </p>

            <a href="/planner" className="button planner-button">
              Build My Journey <span>→</span>
            </a>
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
