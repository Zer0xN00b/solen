import type { NextFunction, Request, Response } from 'express';
import { auth } from '../auth/auth.js';

/** The session shape routes and controllers rely on. */
export interface SessionUser {
  user: { id: string; email: string; name: string };
}

/**
 * Session helpers (scope doc §47, §48).
 *
 * Better Auth's `getSession` reads the httpOnly session cookie off the
 * incoming request, so this needs the raw headers — that is why the auth
 * handler is mounted before `express.json()` in app.ts.
 *
 * Two modes, because §47 keeps public planning open to anonymous users:
 *   - `getSession`     → resolves the session or null. Never rejects.
 *   - `requireSession` → 401s when there is no session.
 */

/** Resolves `req.session` when signed in; otherwise leaves it undefined. */
export async function getSession(
  req: Request,
): Promise<SessionUser | null> {
  // Better Auth wants a fetch-style Headers object. Node's IncomingMessage
  // headers are a plain record of string | string[] | undefined, so build
  // a real Headers and skip the undefined entries.
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const entry of value) headers.append(key, entry);
    } else if (typeof value === 'string') {
      headers.set(key, value);
    }
  }

  const result = await auth.api.getSession({ headers });
  if (!result?.user) return null;

  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
    },
  };
}

/**
 * Attaches `req.session` if present, then always continues.
 * Used by routes that work both signed-in and signed-out.
 */
export async function attachSession(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const session = await getSession(req);
    if (session) {
      (req as Request & { session?: typeof session }).session = session;
    }
    next();
  } catch (err) {
    // A malformed/expired cookie must not break anonymous browsing.
    console.warn('[solen-api] session lookup failed:', err);
    next();
  }
}

/** 401s unless a valid session is present. */
export async function requireSession(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const session = await getSession(req);
  if (!session) {
    res.status(401).json({ error: 'Sign in required' });
    return;
  }
  (req as Request & { session?: typeof session }).session = session;
  next();
}