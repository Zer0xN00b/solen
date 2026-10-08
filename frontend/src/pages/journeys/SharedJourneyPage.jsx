/**
 * A shared journey, read by someone who has no account and no cookies.
 *
 * The first page on the site that renders content this visitor did not make
 * and cannot edit. Two consequences shape everything here:
 *
 *   - It never fetches anything but the one shared journey. No session, no
 *     library, no "your journeys" — a stranger has none of those.
 *   - It is strictly read-only. No save, no regenerate, no favourite toggle,
 *     because each would imply ownership the visitor does not have. A
 *     disabled control would be worse than no control.
 *
 * It also never renders the owner's identity: the public endpoint is an
 * allowlist and does not return one, so there is nothing here to leak even if
 * that response changed later.
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { shared } from '../../api/client.js';
import { describe, formatBudget, formatDate } from './journeyFormat.js';
import { normalizeJourney } from '../../engine/journey.js';
import './SharedJourneyPage.css';

function SharedJourneyPage() {
  const { slug } = useParams();

  const [payload, setPayload] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | missing | error
  const [error, setError] = useState('');

  /* Retry bumps a token the effect depends on, rather than calling a loader
     from the click handler. That keeps exactly one code path that performs
     the fetch — the effect — and it also keeps the setState calls inside
     promise callbacks, where they belong. A synchronous setState in an effect
     body is a cascading render. */
  const [reloadToken, setReloadToken] = useState(0);

  const handleRetry = () => {
    setError('');
    setStatus('loading');
    setReloadToken((token) => token + 1);
  };

  useEffect(() => {
    const controller = new AbortController();

    shared
      .journey(slug)
      .then((response) => {
        if (controller.signal.aborted) return;
        setPayload(response?.sharedJourney ?? null);
        setStatus(response?.sharedJourney ? 'ready' : 'missing');
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        // 404 is a normal outcome — someone followed an old or truncated link,
        // or the owner revoked it. Not a fault worth alarming about.
        if (err?.status === 404) {
          setStatus('missing');
          return;
        }
        setError('We could not reach this journey right now.');
        setStatus('error');
      });

    return () => controller.abort();
  }, [slug, reloadToken]);

  const journey = payload?.data?.journey ?? payload?.data ?? null;
  const itinerary = normalizeJourney(journey);
  const days = itinerary?.days ?? [];
  const facts = payload ? describe(payload) : [];

  return (
    <main className="shared-page" id="main-content" tabIndex={-1}>
      <header className="shared-header">
        <Link to="/" className="shared-brand">
          SOLEN
        </Link>

        <Link to="/planner" className="shared-header-link">
          Design your own
        </Link>
      </header>

      {status === 'loading' && (
        <p className="shared-status" role="status" aria-live="polite">
          Opening this journey…
        </p>
      )}

      {status === 'missing' && (
        <div className="shared-inner shared-inner--narrow">
          <p className="shared-eyebrow">Not available</p>

          <h1 className="shared-title">
            This journey is
            <br />
            <em>no longer shared.</em>
          </h1>

          <p className="shared-copy">
            The person who made it may have stopped sharing it, or the link may have been copied
            incompletely. Their journey is theirs to close.
          </p>

          <div className="shared-actions">
            <Link to="/planner" className="shared-button">
              Craft your own <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="shared-inner shared-inner--narrow">
          <p className="shared-eyebrow">Something went wrong</p>

          <h1 className="shared-title">
            We could not
            <br />
            <em>open this journey.</em>
          </h1>

          <p className="shared-copy">{error}</p>

          <div className="shared-actions">
            <button
              type="button"
              className="shared-button"
              onClick={handleRetry}
            >
              Try again
            </button>

            <Link to="/planner" className="shared-secondary">
              Craft your own
            </Link>
          </div>
        </div>
      )}
      {status === 'ready' && payload && (
        <div className="shared-inner">
          <p className="shared-eyebrow">A shared journey</p>

          <h1 className="shared-title">{payload.title}</h1>

          {facts.length > 0 && (
            <p className="shared-facts">
              {facts.map((fact) => (
                <span key={fact} className="shared-fact">
                  {fact}
                </span>
              ))}
            </p>
          )}

          {payload.createdAt && (
            <p className="shared-saved">Shared from {formatDate(payload.createdAt)}</p>
          )}

          {/* An empty day list is real for a hand-made row, so it says so
              rather than rendering a section heading with nothing under it.
              normalizeJourney already guarantees `days` is an array. */}
          {days.length === 0 ? (
            <p className="shared-empty">
              This journey was shared before its day-by-day itinerary was complete.
            </p>
          ) : (
            <>
              <section className="shared-route">
                <h2 className="shared-section-title">The route</h2>

                <ol className="shared-days">
                  {days.map((day, index) => (
                    <li key={`${day.title}-${index}`} className="shared-day">
                      <p className="shared-day-number">
                        DAY {String(index + 1).padStart(2, '0')}
                      </p>

                      <h3 className="shared-day-title">{day.title}</h3>

                      {day.description && <p className="shared-day-copy">{day.description}</p>}

                      {Array.isArray(day.activities) && day.activities.length > 0 && (
                        <ul className="shared-activities">
                          {day.activities.map((activity) => (
                            <li key={activity} className="shared-activity">
                              {activity}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ol>
              </section>

              {(itinerary.accommodation || itinerary.dining || itinerary.weather) && (
                <section className="shared-details">
                  {itinerary.accommodation && (
                    <div className="shared-detail">
                      <p className="shared-detail-label">Stay</p>
                      <p className="shared-detail-value">{itinerary.accommodation}</p>
                    </div>
                  )}

                  {itinerary.dining && (
                    <div className="shared-detail">
                      <p className="shared-detail-label">Dining</p>
                      <p className="shared-detail-value">{itinerary.dining}</p>
                    </div>
                  )}

                  {itinerary.weather && (
                    <div className="shared-detail">
                      <p className="shared-detail-label">Weather</p>
                      <p className="shared-detail-value">{itinerary.weather}</p>
                    </div>
                  )}
                </section>
              )}

              {payload.budget != null && (
                <p className="shared-budget">
                  Budget {formatBudget(payload.budget, payload.currency)}
                </p>
              )}
            </>
          )}

          <div className="shared-actions shared-actions--closing">
            <Link to="/planner" className="shared-button">
              Craft your own <span aria-hidden="true">→</span>
            </Link>

            <p className="shared-closing-note">
              This journey was designed and shared by its owner.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

export default SharedJourneyPage;