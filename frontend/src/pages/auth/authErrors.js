/**
 * Error copy for the auth form.
 *
 * Better Auth's own messages are already written to be user-safe, so
 * this maps the common ones to SOLEN's register and falls back to a
 * plain sentence for anything unrecognised. A status code or a raw
 * upstream string is never shown — "500" is not an explanation, and
 * Better Auth occasionally returns internal phrasing.
 *
 * On failed sign-in the message stays deliberately vague. Telling a
 * caller "no such email" vs "wrong password" would let anyone enumerate
 * which addresses have accounts; the backend returns one generic string
 * for exactly that reason and the UI must not undo it.
 */

const MIN_PASSWORD_LENGTH = 8;

export function normalizeAuthError(err, isSignUp) {
  const message = err?.message || '';

  if (!message || /internal server error|status 5\d\d/i.test(message)) {
    return 'We could not reach SOLEN just now. Please try again.';
  }

  // Bad credentials — the one that must never distinguish cause.
  if (/invalid (email|user|password|credentials|user or password)/i.test(message)) {
    return 'That email and password combination did not match an account.';
  }

  // Duplicate account on sign-up.
  if (/already (exists|registered)|user already|unique constraint/i.test(message)) {
    return 'An account already exists for that email. Try signing in instead.';
  }

  if (/password/i.test(message)) {
    return `Passwords need at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (/origin|unauthorized|forbidden|invalid token|expired|session/i.test(message)) {
    return 'Your session expired. Please sign in again.';
  }

  if (/email/i.test(message)) {
    return isSignUp ? 'That email address does not look right.' : 'Enter your email address.';
  }

  // Last resort: a sentence the user can act on rather than a code.
  return 'Something went wrong. Please try again.';
}