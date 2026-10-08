import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, journeys } from '../../api/client.js';
import { normalizeAuthError } from './authErrors.js';
import AuthPanel from './AuthPanel.jsx';
import './AuthPage.css';

/**
 * Sign in / sign up (scope doc §47 — "Frontend auth UI").
 *
 * One page, two modes. Splitting these into separate routes was
 * considered and rejected: a traveller arriving at /auth to sign in and
 * then being bounced to a different URL to register is friction for no
 * benefit, and it doubles the surface for a form this small.
 *
 * Deliberately does NOT import the better-auth/react client. That would
 * add a React-side session store and context provider for what is, right
 * now, two POSTs and a session check — and it would put a copy of the
 * session token in the JS bundle, which cuts against the httpOnly-cookie
 * decision the backend already made. `api/client.js` talks to the same
 * endpoints directly.
 *
 * Styling mirrors the brand language (oatmeal ground, plum accent,
 * Cormorant display + Inter copy) in its own CSS rather than importing
 * HomePage.css — same reasoning as NotFoundPage: importing a locked
 * page's stylesheet is the coupling that left the old Navbar broken.
 */

const MIN_PASSWORD_LENGTH = 8; // must match auth.ts emailAndPassword.minPasswordLength

function AuthPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Who is signed in, or null. `auth.getSession()` swallows its own errors
  // and returns null, so a failed check reads as signed out — the safe
  // direction: it shows the form rather than a sign-out button that fails.
  const [session, setSession] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    auth.getSession().then((current) => {
      if (cancelled) return;
      setSession(current?.user ?? null);
      setIsCheckingSession(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);

    try {
      await auth.signOut();
      setSession(null);
      setError('');
    } catch (err) {
      setError(normalizeAuthError(err, false));
    } finally {
      setIsSigningOut(false);
    }
  };

  const isSignUp = mode === 'signup';

  const switchMode = (next) => {
    setMode(next);
    // Clear transient copy so a failed sign-up message doesn't greet you
    // on the sign-in form.
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError('');

    // Client-side length check mirrors the server's. The server still
    // enforces it — this only saves a round trip and gives a clearer
    // message than a raw 400.
    if (isSignUp && password.length < MIN_PASSWORD_LENGTH) {
      setError(`Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await auth.signUp({ name: name.trim(), email: email.trim(), password });
      } else {
        await auth.signIn({ email: email.trim(), password });
      }

      // Adopt anything this browser saved while signed out, so a
      // journey created before registering is not stranded. Best-effort:
      // failing to claim must not block a successful sign-in.
      try {
        await journeys.claim();
      } catch {
        // Non-fatal, as above.
      }

      navigate('/planner', { replace: true });
    } catch (err) {
      setError(normalizeAuthError(err, isSignUp));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page" id="main-content" tabIndex={-1}>
      <header className="auth-header">
        <Link to="/" className="auth-brand">
          SOLEN
        </Link>
      </header>

      <div className="auth-layout">
        {/* Editorial counterpoint — the page is not just a form. */}
        {session ? (
          /* The aside is editorial counterpoint, and copy that talks about
             signing in to someone who already has is exactly the kind of
             small dishonesty this page avoids elsewhere. */
          <section className="auth-aside" aria-hidden="true">
            <p className="auth-aside-eyebrow">YOUR TRAVEL LIBRARY</p>

            <h2 className="auth-aside-title">
              Welcome
              <br />
              <em>back.</em>
            </h2>

            <p className="auth-aside-copy">
              Everything you have designed is here, waiting in whichever browser you sign in from.
            </p>

            <div className="auth-aside-rule" />
          </section>
        ) : (
          <section className="auth-aside" aria-hidden="true">
            <p className="auth-aside-eyebrow">YOUR TRAVEL LIBRARY</p>

            <h2 className="auth-aside-title">
              Every journey you
              <br />
              craft, <em>kept.</em>
            </h2>

            <p className="auth-aside-copy">
              Sign in to gather the journeys you have designed into one place — and to pick up
              wherever you left off.
            </p>

            <div className="auth-aside-rule" />
          </section>
        )}

        {/* Already signed in. Previously this page always rendered the
            sign-in form, so a signed-in visitor who navigated here had no
            way to sign out at all — the endpoint existed and nothing called
            it. Showing the form to someone who is already in is also a small
            lie about their state. */}
        {session ? (
          <section className="auth-panel auth-panel--signed-in">
            <p className="auth-signed-in-eyebrow">Signed in</p>

            <h2 className="auth-signed-in-name">{session.name || session.email}</h2>

            <p className="auth-signed-in-copy">
              Your journeys are saved to this account and follow you to any browser you sign in
              from.
            </p>

            <div className="auth-signed-in-actions">
              <Link to="/journeys" className="auth-submit">
                Your journeys <span aria-hidden="true">→</span>
              </Link>

              <button
                type="button"
                className="auth-signout"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>

            <p className="auth-message" role="alert">
              {error}
            </p>
          </section>
        ) : isCheckingSession ? (
          /* A blank panel, not a spinner: this resolves in one request and
             showing a form that may be about to be replaced is worse than
             showing nothing for a moment. */
          <section className="auth-panel auth-panel--checking">
            <p className="auth-message" aria-live="polite">
              Checking your account…
            </p>
          </section>
        ) : (
          <AuthPanel
          isSignUp={isSignUp}
          name={name}
          email={email}
          password={password}
          error={error}
          isSubmitting={isSubmitting}
          onNameChange={setName}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSwitchMode={switchMode}
          onSubmit={handleSubmit}
          />
        )}
      </div>
    </main>
  );
}

export default AuthPage;