import { Link } from 'react-router-dom';
import './NotFoundPage.css';

/**
 * Broken-route handling (scope §42, "Broken-route handling").
 *
 * Before this page existed, an unknown URL rendered only the site-wide
 * stage layers — an empty page with no navigation and no way back — and
 * an unknown destination slug silently served Kyoto instead.
 *
 * Additive by design: no locked page is touched, and the brand language
 * (oatmeal ground, plum accent, Cormorant display + Inter copy) is
 * mirrored in this page's own CSS rather than imported from
 * HomePage.css — importing a locked page's stylesheet is the coupling
 * that left the old Navbar component broken.
 */
function NotFoundPage() {
  return (
    <main className="not-found" id="main-content" tabIndex={-1}>
      <header className="not-found-header">
        <Link to="/" className="not-found-brand">
          SOLEN
        </Link>
      </header>

      <div className="not-found-inner">
        <p className="not-found-eyebrow">404 · Off the map</p>

        <h1>
          You&apos;ve wandered
          <br />
          off the <em>map.</em>
        </h1>

        <p className="not-found-copy">
          The page you were looking for isn&apos;t here. Let&apos;s get you back to somewhere
          beautiful.
        </p>

        <div className="not-found-actions">
          <Link to="/" className="not-found-button">
            Back to SOLEN <span aria-hidden="true">→</span>
          </Link>

          <Link to="/planner" className="not-found-secondary">
            Start planning a journey
          </Link>
        </div>
      </div>
    </main>
  );
}

export default NotFoundPage;
