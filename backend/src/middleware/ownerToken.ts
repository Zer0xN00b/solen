import crypto from 'node:crypto';
import type { Request, Response } from 'express';

const OWNER_COOKIE = 'solen_owner';
const OWNER_TOKEN_BYTES = 32;

// Anonymous saves are scoped by a random token in an httpOnly cookie, so
// one browser cannot read or delete another's journeys. It is NOT an
// auth credential — it grants no access to account data — it is just a
// stable per-browser handle until the journey is claimed at signup.
const maxAgeMs = 365 * 24 * 60 * 60 * 1000; // 1 year

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

/** Returns the caller's anonymous owner token, or null if they have none. */
export function readOwnerToken(req: Request): string | null {
  return parseCookies(req.headers.cookie)[OWNER_COOKIE] ?? null;
}

/**
 * Returns a persistent owner token for this browser, minting one if
 * needed. Always sets the cookie so the value the client later sends
 * back is the one we actually scoped rows to.
 */
export function ensureOwnerToken(req: Request, res: Response): string {
  const existing = readOwnerToken(req);
  if (existing) return existing;

  const token = crypto.randomBytes(OWNER_TOKEN_BYTES).toString('hex');
  res.cookie(OWNER_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: maxAgeMs,
    path: '/',
  });
  return token;
}