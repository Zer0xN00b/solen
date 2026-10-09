# Splitting Solen: frontend on Vercel, backend on Railway/Render

Moves the backend off Vercel's serverless functions (which kept building it
wrong) onto a host that runs it as a normal, long-lived Node process —
which is what `backend/src/server.ts` already is. No rewrite needed there.

## What changed, and why each change is required

1. **`backend/Dockerfile`** — new. Builds with `tsc`, runs `node dist/server.js`.
   Copy to `backend/Dockerfile` in your repo. (If your host doesn't need
   Docker — e.g. Railway can build Node apps without one — you can skip
   this and just set the host's start command to `npm run build && npm start`.
   `npm start` already runs `node dist/server.js`.)

2. **`backend/app.ts`** → replaces `backend/src/app.ts`. Adds real CORS
   middleware (`cors` package). The app previously had NONE — it was built
   single-origin only. Without this, every cross-origin request is blocked
   by the browser, even though it looks fine in curl or Postman (neither
   enforces CORS). Uses your existing `trustedOrigins` list as the source
   of truth, wildcard entries included.

3. **`backend/auth.ts`** → replaces `backend/src/auth/auth.ts`. Makes the
   session cookie's `SameSite` attribute configurable. This is the part
   that's easy to miss entirely: the default `SameSite=Lax` cookie is
   silently NOT sent on cross-site fetch requests by any browser. Sign-in
   would return 200 with a Set-Cookie header, look successful, and then the
   very next request reads the user as signed out — with no error anywhere.
   Set `COOKIE_CROSS_SITE=true` (below) to switch to `SameSite=None; Secure`.

4. **`backend/env.ts`** → replaces `backend/src/config/env.ts`. Adds the
   `COOKIE_CROSS_SITE` env var read.

5. **`frontend/src/api/client.js`** → same path. `API_BASE` now reads
   `VITE_API_BASE` (falls back to `/api` so same-origin deployments are
   unaffected). Must be set at BUILD time, not runtime — Vite inlines it.

6. **`frontend/vercel.json`** — new, goes in `frontend/vercel.json`. A
   plain static-site config, no `services` block. In the Vercel dashboard,
   set this project's **Root Directory** to `frontend`, and delete the
   `services` block from the repo-root `vercel.json` (or delete that file
   — the frontend no longer needs the root one).

Also run, in the repo root: `npm install cors -w backend && npm install -D @types/cors -w backend`
(updates package.json/package-lock.json — commit both).

## Deploying

**Backend (Railway or Render):**
- This repo uses npm workspaces — there is ONE `package-lock.json`, at the
  repo root, not inside `backend/`.
- **If using the Dockerfile** (recommended — it's written for this): leave
  Root Directory EMPTY/unset (the repo root). Railway will find
  `backend/Dockerfile` automatically once you point the Dockerfile path at
  it in Settings, or it auto-detects it. Do NOT set Root Directory to
  `backend` — that breaks `npm ci` (no lockfile in that subfolder) and was
  the actual cause of the first build failure.
- **If NOT using the Dockerfile** (letting Railway run its own Node
  buildpack instead): same rule applies — Root Directory must stay at the
  repo root, Build Command becomes `npm ci -w backend && npm run build -w backend`,
  Start Command `npm start -w backend`.
- Env vars: everything already in your `backend/.env`, plus:
  - `COOKIE_CROSS_SITE=true`
  - `TRUSTED_ORIGINS_EXTRA=https://your-frontend.vercel.app` (your real
    Vercel URL — sign-in fails with a 403 if this doesn't match exactly)
  - `BETTER_AUTH_URL=https://your-backend.up.railway.app` (your real
    backend URL once the host assigns one — some hosts need a second
    deploy after the URL exists for the first time)
  - `PORT` — most hosts inject this themselves; `server.ts` already
    reads `process.env.PORT`
  - `TRUST_PROXY=1` — you're now behind Railway/Render's own proxy

**Frontend (Vercel, same project or a fresh one):**
- Root Directory: `frontend`
- Env var: `VITE_API_BASE=https://your-backend.up.railway.app/api`
- Deploy as usual — Vercel auto-detects Vite.

## Order matters
Deploy the backend first, copy its real URL into the frontend's
`VITE_API_BASE`, redeploy the frontend, then set
`TRUSTED_ORIGINS_EXTRA`/`BETTER_AUTH_URL` on the backend to the frontend's
and backend's real URLs and redeploy the backend once more. Both sides
need the other's real URL, so the first deploy of each is provisional.

## Verifying it actually works (not just curl)
Open the deployed frontend in a real browser, DevTools → Network tab, and
sign up. Confirm:
- The `sign-up/email` request has response header
  `access-control-allow-origin` set to your frontend's exact origin.
- Its `set-cookie` header shows `SameSite=None; Secure`.
- A follow-up request to `/api/auth/get-session` includes the cookie
  (DevTools → Application → Cookies) and returns the signed-in user, not
  null.

curl cannot catch either of the above two failure modes — browsers
enforce CORS and SameSite, curl does not — so a curl 200 is not proof
this works for a real user. I confirmed both headers appear correctly
locally (cross-origin CORS headers present, cookie shows
`Secure; SameSite=None` with `COOKIE_CROSS_SITE=true`), but I can't open
a real browser against your actual deployed URLs, so please do that
check once it's live.
