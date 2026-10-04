/**
 * Journey library (scope doc §48) — the user-facing half of the journeys
 * API, which until now was complete but invisible: `GET /api/journeys`
 * worked, the planner saved to it, and no screen anywhere listed them.
 *
 * Additive by design, on the same reasoning as NotFoundPage and AuthPage:
 * the brand language (oatmeal ground, plum accent, Cormorant display +
 * Inter copy) is mirrored in this page's own CSS rather than imported
 * from HomePage.css, because importing a locked page's stylesheet is
 * exactly the coupling that left the old Navbar component broken.
 *
 * Reads only the promoted COLUMNS the API already returns
 * (title/destination/duration/travelStyle/budget/currency/dates) rather
 * than the `data` snapshot. The list is a summary view — pulling the full
 * snapshot for every row to render a title would be wasteful, and the
 * columns exist precisely so they can be trusted without opening a row.
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { journeys } from '../../api/client.js';
import { deleteJourneyById, hasLocalPending } from '../../api/journeyStorage.js';
import { describe, formatDate, headingFor, isDerivedTitle } from './journeyFormat.js';
import './JourneysPage.css';


function JourneysPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');

  /* Retry works by bumping a token the effect depends on, rather than by
     calling a loader directly from the click handler. That keeps exactly one
     code path that performs the fetch — the effect — so there is no second
     copy to drift out of sync with the first. */
  const [reloadToken, setReloadToken] = useState(0);

  const handleRetry = () => {
    setError('');
    setStatus('loading');
    setReloadToken((token) => token + 1);
  };

  // The row being deleted, or null. Tracked by id rather than with a boolean
  // so two rows can never both render as "deleting", and so a failed delete
  // can restore only the row it affected.
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [localNote, setLocalNote] = useState('');
  // True when this browser holds a journey that never reached the API — the
  // localStorage fallback. Surfaced because the library lists only API rows,
  // so without this a traveller would believe they had saved something that
  // is invisible here and lost the moment they clear cookies.
  const [localPending, setLocalPending] = useState(false);

  const handleDelete = async (journey) => {
    if (!journey.id || deletingId) return;

    setDeletingId(journey.id);
    setActionError('');

    try {
      const { clearedLocal } = await deleteJourneyById(journey.id, journey);

      // Remove from the list only after the API confirmed the delete, so a
      // failure leaves the row visible and retryable rather than making a
      // journey look deleted when it still exists.
      setRows((current) => current.filter((row) => row.id !== journey.id));

      if (clearedLocal) {
        setLocalNote('That was also saved in this browser, so its offline copy was removed too.');
      }
    } catch (err) {
      setActionError(err?.message || 'We could not delete that journey. It may still be saved.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpen = (journey) => {
    if (!journey.id) return;

    // The planner's own resume button always loads the newest journey, so the
    // id travels in the URL and the planner deep-links to exactly this row.
    navigate(`/planner?journey=${encodeURIComponent(journey.id)}`);
  };

  // Which row's share request is in flight, or null. Same reasoning as
  // `deletingId`: two rows must never both look busy, and a failure has to
  // restore only the row it affected.
  const [sharingId, setSharingId] = useState(null);

  const handleShare = async (journey) => {
    if (!journey.id || sharingId) return;

    setSharingId(journey.id);
    setActionError('');

    // Snapshot the previous state so a failed call restores the button to the
    // label it had, rather than leaving a row that claims to be shared when
    // the server disagrees.
    const wasPublic = Boolean(journey.isPublic);

    try {
      if (wasPublic) {
        await journeys.unshare(journey.id);

        setRows((current) =>
          current.map((row) =>
            row.id === journey.id ? { ...row, isPublic: false, shareSlug: null } : row,
          ),
        );

        setLocalNote('Sharing stopped. The link no longer opens for anyone.');
      } else {
        const response = await journeys.share(journey.id);
        const slug = response?.journey?.shareSlug ?? null;

        if (!slug) {
          // No slug came back, so nothing was actually published. Saying
          // otherwise would be the small lie this project keeps refusing.
          throw new Error('The server did not return a share link.');
        }

        setRows((current) =>
          current.map((row) =>
            row.id === journey.id ? { ...row, isPublic: true, shareSlug: slug } : row,
          ),
        );

        setLocalNote('Shared. Anyone with the link can read this journey.');
      }
    } catch (err) {
      setActionError(err?.message || 'We could not change sharing for that journey.');
    } finally {
      setSharingId(null);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    // The setState calls live in the promise callbacks, never synchronously
    // in the effect body — a synchronous setState here is a cascading render.
    journeys
      .list()
      .then((payload) => {
        if (controller.signal.aborted) return;
        // Defensive: the API returns { journeys }, but a malformed body must
        // render the empty state rather than crash the page on `.map`.
        setRows(Array.isArray(payload?.journeys) ? payload.journeys : []);
        setLocalPending(hasLocalPending());
        setStatus('ready');
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err?.message || 'We could not reach your library.');
        setStatus('error');
      });

    return () => controller.abort();
  }, [reloadToken]);

  return (
    <main className="journeys-page">
      <header className="journeys-header">
        <Link to="/" className="journeys-brand">
          SOLEN
        </Link>

        <nav className="journeys-header-nav" aria-label="Primary">
          <Link to="/planner" className="journeys-header-link">
            Plan a journey
          </Link>
          <Link to="/auth" className="journeys-header-link">
            Account
          </Link>
        </nav>
      </header>

      <div className="journeys-inner">
        <p className="journeys-eyebrow">Your travel library</p>

        <h1 className="journeys-title">
          Journeys you&apos;ve
          <br />
          <em>crafted.</em>
        </h1>

        <p className="journeys-copy">
          Every journey you have designed, kept together. Open one to pick up wherever you left
          off.
        </p>

        {status === 'loading' && (
          /* Announced, not just styled: a screen reader user gets told the
             list is still arriving. aria-live because the content that
             replaces it is the announcement they'd otherwise miss. */
          <p className="journeys-status" role="status" aria-live="polite">
            Loading your journeys…
          </p>
        )}

        {status === 'error' && (
          <div className="journeys-error" role="alert">
            <p className="journeys-error-text">{error}</p>

            <div className="journeys-actions">
              <button
                type="button"
                className="journeys-button"
                onClick={handleRetry}
              >
                Try again
              </button>

              <Link to="/planner" className="journeys-secondary">
                Start planning a journey
              </Link>
            </div>
          </div>
        )}

        {status === 'ready' && rows.length === 0 && (
          /* The empty state is the path most likely to become a dead end —
             the failure this project already fixed once for broken routes.
             It offers a way forward rather than just saying "nothing here". */
          <div className="journeys-empty">
            <p className="journeys-empty-text">
              Nothing saved yet. When you design a journey it will wait for you here, in this
              browser and — if you sign in — in your account too.
            </p>

            <div className="journeys-actions">
              <Link to="/planner" className="journeys-button">
                Plan your first journey <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        )}

        {status === 'ready' && localPending && (
          <p className="journeys-banner">
            One journey is saved in this browser only — it never reached your library, and
            clearing your browser data will lose it.
          </p>
        )}

        {status === 'ready' && actionError && (
          <p className="journeys-error-text" role="alert">
            {actionError}
          </p>
        )}

        {status === 'ready' && rows.length > 0 && (
          <>
            {/* Announced politely rather than as an alert: it reports the
                outcome of a delete the user just chose, not a failure. */}
            <p className="journeys-note" role="status" aria-live="polite">
              {localNote}
            </p>
            <ul className="journeys-list">
            {rows.map((journey, index) => {
              const facts = describe(journey);
              const saved = formatDate(journey.updatedAt ?? journey.createdAt);

              return (
                <li
                  key={journey.id}
                  className="journeys-item"
                  /* Stagger is capped by the CSS: data-reveal-delay only
                     supports 1..6, so a long list must not emit 7+. Clamping
                     here rather than in CSS keeps the attribute honest. */
                  data-reveal
                  data-reveal-delay={String(Math.min(index + 1, 6))}
                >
                  <div className="journeys-item-inner">
                    <div className="journeys-item-body">
                      <h2 className="journeys-item-title">{headingFor(journey)}</h2>

                      {/* A derived title is redundant here: the facts row
                          already carries duration, style and budget in Inter,
                          and Cormorant's oldstyle figures render "10" as "to".
                          A genuinely custom title still wins. */}
                      {!isDerivedTitle(journey) && (
                        <p className="journeys-item-destination">{journey.destination}</p>
                      )}

                    {facts.length > 0 && (
                      <p className="journeys-item-facts">
                        {facts.map((fact) => (
                          <span key={fact} className="journeys-fact">
                            {fact}
                          </span>
                        ))}
                      </p>
                    )}

                    {saved && <p className="journeys-item-saved">Saved {saved}</p>}
                    </div>

                    <div className="journeys-item-side">
                      <button
                        type="button"
                        className="journeys-item-action journeys-item-open"
                        onClick={() => handleOpen(journey)}
                        disabled={!journey.id}
                      >
                        Open
                      </button>

                      {/* Delete is a real button with an accessible name, not a
                          bare "×" — an unlabelled icon here would be
                          announced as just "button". */}
                      <button
                        type="button"
                        className="journeys-item-action journeys-item-delete"
                        onClick={() => handleDelete(journey)}
                        disabled={!journey.id || deletingId !== null}
                      >
                        {deletingId === journey.id ? 'Deleting…' : 'Delete'}
                        <span className="sr-only">
                          {headingFor(journey)} journey from your library
                        </span>
                      </button>
{/* Share / Stop sharing. The server mints the slug and
                            is idempotent, so this never has to generate or
                            guess one locally — it only reports what came
                            back. */}
                        <button
                          type="button"
                          className="journeys-item-action journeys-item-share"
                          onClick={() => handleShare(journey)}
                          disabled={!journey.id || sharingId !== null || deletingId !== null}
                        >
                          {sharingId === journey.id
                            ? '…'
                            : journey.isPublic
                              ? 'Stop sharing'
                              : 'Share'}
                          <span className="sr-only">
                            {journey.isPublic ? 'Stop sharing ' : 'Share '}
                            {headingFor(journey)} journey
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* The public link sits on its own line below the row, not
                        inside `.journeys-item-side`. That column is
                        `flex-shrink: 0`, so a full URL inside it forces the
                        column wide and squeezes the destination title into a
                        narrow wrap. */}
                    {journey.shareSlug && (
                      <p className="journeys-share-url">
                        <span className="sr-only">Public link: </span>
                        {`${window.location.origin}/shared/${journey.shareSlug}`}
                      </p>
                    )}
                </li>
              );
            })}
          </ul>
          </>
        )}
      </div>
    </main>
  );
}

export default JourneysPage;
