import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './DestinationDetail.css';
import {
  getEditorialBySlug,
  isSettled,
  loadDestinationContent,
  subscribe,
} from '../../data/destinationSource.js';
import NotFoundPage from '../notFound/NotFoundPage.jsx';
import { initM2GhostSolid } from './m2GhostSolid.js';

function DestinationDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Refresh from the API, and re-render when it lands. The bundled editorial
  // is served immediately, so a real destination paints on the first frame
  // exactly as it did before this migration.
  const [, setVersion] = useState(0);
  useEffect(() => {
    loadDestinationContent();
    return subscribe(setVersion);
  }, []);

  // No fallback object: an unknown slug is a broken route, not Kyoto.
  // `getEditorialBySlug` also resolves the legacy `amalfi` alias, which is
  // the URL the globe used to link to and which 404'd.
  const destination = getEditorialBySlug(slug);

  // Animation 02 — M2 ghost → solid ink-in on the destination title.
  // Re-initializes per destination so the observer always watches the
  // live title; cleanup disconnects the observer on unmount/change.
  // Keyed on `slug` alone, so the API refresh below does not replay the
  // animation over a page the visitor is already reading.
  useEffect(() => initM2GhostSolid(), [slug]);

  // Broken-slug handling (scope §42). This previously served Kyoto's
  // editorial page for any unknown slug — silently wrong content on a
  // truthful URL. Kept BELOW the effects so the hook order is stable.
  //
  // The not-found verdict waits for the load to settle. Ruling immediately
  // would flash this page for a destination that is in the API but not yet
  // in the bundle, then swap in real content — the same class of bug,
  // reappearing in the other direction. The wait only ever affects slugs
  // that are genuinely missing; the seven real destinations all resolve
  // from the bundle on the first frame and never reach this branch.
  //
  // Returning `null` while undecided, rather than falling through to the
  // hero below, is what stops `destination.image` being read off undefined.
  if (!destination) {
    return isSettled() ? <NotFoundPage /> : null;
  }

  return (
    <main className="destination-detail">
      {/* =========================
          LOCKED DESTINATION HERO
          ========================= */}

      <section className="destination-hero">
        <img src={destination.image} alt={destination.name} className="destination-hero-image" />

        <div className="destination-hero-overlay"></div>

        <div className="destination-hero-content">
          <p className="destination-eyebrow">{destination.region}</p>

          <h1 className="m2-title" data-animation="m2-ghost-solid">
            {destination.name}
          </h1>

          <p className="destination-hero-description">{destination.description}</p>
        </div>
      </section>

      {/* =========================
          DESTINATION CONTENT
          ========================= */}

      <section className="destination-intro">
        <div className="destination-intro-label">
          <span>01</span>
          <p>THE SOLEN EDIT</p>
        </div>

        <div className="destination-intro-content">
          <h2 data-reveal="blur">{destination.introTitle}</h2>

          <p>{destination.intro}</p>
        </div>
      </section>

      {/* =========================
          BEST TIME + TRAVEL STYLE
          ========================= */}

      <section className="destination-details">
        <div className="destination-detail-block">
          <p className="destination-detail-label">BEST TIME TO VISIT</p>

          <h3>{destination.bestTime}</h3>
        </div>

        <div className="destination-detail-block">
          <p className="destination-detail-label">TRAVEL STYLE</p>

          <div className="destination-tags">
            {destination.styles.map((style) => (
              <span key={style}>{style}</span>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          SIGNATURE EXPERIENCES
          ========================= */}

      <section className="destination-experiences">
        <div className="destination-experiences-heading">
          <p className="destination-detail-label">SIGNATURE EXPERIENCES</p>

          <h2 data-reveal="blur">Moments worth travelling for.</h2>
        </div>

        <div className="destination-experience-list">
          {destination.experiences.map((experience, index) => (
            <div className="destination-experience-item" key={experience}>
              <span>0{index + 1}</span>

              <h3>{experience}</h3>

              <span className="experience-arrow">↗</span>
            </div>
          ))}
        </div>
      </section>

      {/* =========================
          PLAN JOURNEY CTA
          ========================= */}

      <section className="destination-plan">
        <p className="destination-detail-label">YOUR NEXT STORY</p>

        <h2 data-reveal="blur">
          Ready to discover
          <br />
          {destination.name}?
        </h2>

        <button
          type="button"
          className="destination-plan-button"
          onClick={() => navigate(`/planner?destination=${slug}`)}
        >
          Plan a Journey Here <span>→</span>
        </button>
      </section>
    </main>
  );
}

export default DestinationDetail;
