/**
 * The sign-in / sign-up form.
 *
 * Split from the page shell so the page owns session orchestration
 * (submit → claim → navigate) and this file stays purely presentational
 * and controlled. Every field is a plain controlled input; no form
 * library, no schema dependency.
 *
 * Accessibility notes that are easy to lose in a refactor:
 *   - the mode switch is a tablist, and the tabs carry aria-selected
 *   - the error is role="alert" but is NOT focused, because stealing
 *     focus mid-form throws away the user's typing context
 *   - autoComplete is set per mode, so a password manager offers the
 *     right thing on each form
 *   - `noValidate` is on the form so the browser's native bubble does
 *     not replace the designed error styling
 */

function AuthPanel({
  isSignUp,
  name,
  email,
  password,
  error,
  isSubmitting,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onSwitchMode,
  onSubmit,
}) {
  return (
    <section className="auth-panel">
      <div className="auth-tabs" role="tablist" aria-label="Account">
        <button
          type="button"
          role="tab"
          aria-selected={!isSignUp}
          className={`auth-tab ${!isSignUp ? 'is-active' : ''}`}
          onClick={() => onSwitchMode('signin')}
        >
          Sign in
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={isSignUp}
          className={`auth-tab ${isSignUp ? 'is-active' : ''}`}
          onClick={() => onSwitchMode('signup')}
        >
          Create account
        </button>
      </div>

      <h1 className="auth-title">{isSignUp ? 'Begin your library' : 'Welcome back'}</h1>

      <p className="auth-subtitle">
        {isSignUp ? 'A place for the journeys you design.' : 'Sign in to return to your saved journeys.'}
      </p>

      <form className="auth-form" onSubmit={onSubmit} noValidate>
        {isSignUp && (
          <div className="auth-field">
            <label htmlFor="auth-name">Name</label>
            <input
              id="auth-name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="Your name"
              required
            />
          </div>
        )}

        <div className="auth-field">
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="auth-field">
          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            name="password"
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder={isSignUp ? 'At least 8 characters' : ''}
            required
          />
        </div>

        {/* Always in the DOM so its height doesn't jump when an error
            arrives. Collapsed via CSS when empty. */}
        <p className="auth-message" role="alert">
          {error}
        </p>

        <button type="submit" className="auth-submit" disabled={isSubmitting}>
          {isSubmitting
            ? isSignUp
              ? 'Creating your account…'
              : 'Signing you in…'
            : isSignUp
              ? 'Create account'
              : 'Sign in'}
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <p className="auth-switch">
        {isSignUp ? 'Already have an account?' : 'New to SOLEN?'}{' '}
        <button
          type="button"
          className="auth-switch-link"
          onClick={() => onSwitchMode(isSignUp ? 'signin' : 'signup')}
        >
          {isSignUp ? 'Sign in' : 'Create an account'}
        </button>
      </p>

      <p className="auth-anonymous">
        You can also plan and save without an account — journeys stay on this browser until you
        sign in.
      </p>
    </section>
  );
}

export default AuthPanel;