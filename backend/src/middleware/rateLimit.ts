import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

/**
 * Rate limiting for the public API.
 *
 * Two limits at deliberately different strengths, because the two surfaces
 * have different costs:
 *
 *   auth — credential stuffing, email enumeration, password-hash CPU. Tight,
 *          and the failed-attempt window is long so a real user mistyping a
 *          password twice is never caught.
 *   api  — public content reads, all cacheable and cheap. Loose; this is a
 *          ceiling against scripted amplification, not a quota.
 *
 * `standardHeaders` emits RFC-compliant `RateLimit-*` headers and
 * `legacyHeaders: false` suppresses the deprecated `X-RateLimit-*` set.
 */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Shared handler.
 *
 * The body is deliberately plain and says what happened rather than leaking
 * the limit's internals — but `retryAfter` is genuinely useful to a client
 * and is already exposed in the standard headers.
 */
function handler(_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  res.status(429).json({
    error: 'Too many requests. Please wait a moment and try again.',
  });
}

/** Auth endpoints: sign-in, sign-up, and everything else Better Auth serves. */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProduction ? 10 : 100,

  // Keyed by client IP. `ipKeyGenerator` normalises IPv6 into a /64 subnet,
  // which is the documented fix for a bypass where one attacker rotates
  // through addresses inside a single allocation.
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ''),

  standardHeaders: 'draft-7',
  legacyHeaders: false,

  // Skip successful traffic: signing in normally must never spend budget,
  // and this keeps a legitimate user's counter clean while an attacker's
  // failed attempts are what exhausts the limit.
  skipSuccessfulRequests: true,

  handler,
});

/** Everything else under /api. */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: isProduction ? 120 : 1000,

  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ''),

  standardHeaders: 'draft-7',
  legacyHeaders: false,

  handler,
});