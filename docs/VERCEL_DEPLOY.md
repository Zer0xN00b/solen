# SOLEN — Vercel deploy runbook (single full-stack project)

This repo deploys to Vercel as **one project**: static frontend +
serverless API. `vercel.json` at the repo root is the whole contract:

- `outputDirectory: frontend/dist` — the Vite build.
- rewrite `/api/:path* → /api/index` — the Express app compiled to
  `backend/dist/api/vercel.js`, wrapped by `api/index.mjs`.
- rewrite `/(.*) → /index.html` — React Router fallback.

## 0. Pre-requisites

- Vercel account, repo connected (Import Project from GitHub).
- Turso account (free tier is fine) + Turso CLI **or** dashboard access.
- Vercel Build settings (should be auto-detected from `vercel.json`,
  verify they match):
  - Build Command: `npm run build -w frontend && npm run build -w backend`
  - Output Directory: `frontend/dist`
  - Install Command: default (`npm ci` — leave as-is)
  - Root Directory: repo root (leave as `.`)

## 1. Provision Turso (once)

Vercel functions have a read-only, ephemeral filesystem — the local
SQLite file (`DB_FILE`) cannot work there. `backend/src/database/db.ts`
switches to remote libSQL whenever `DB_URL` is set.

```bash
# via CLI
turso db create solen-prod
turso db show solen-prod            # copy the URL  → DB_URL
turso db tokens create solen-prod   # copy the token → DB_AUTH_TOKEN
```

Or via https://turso.tech dashboard: create database → copy URL + token.

## 2. Migrate the remote DB (once, and after every schema change)

Serverless deliberately never migrates on boot
(`backend/src/api/vercel.ts` skips `migrate()` so N concurrent cold
starts can't race on `__drizzle_migrations`). Apply migrations
explicitly from your machine:

```powershell
# PowerShell
$env:DB_URL="libsql://your-db.turso.io"
$env:DB_AUTH_TOKEN="your-turso-token"
npm run db:migrate -w backend
```

```bash
# bash
DB_URL=libsql://your-db.turso.io DB_AUTH_TOKEN=your-turso-token \
  npm run db:migrate -w backend
```

Verify: `turso db shell solen-prod "select name from __drizzle_migrations;"`
should list applied migrations.

## 3. Set Vercel environment variables (Production)

Vercel Dashboard → Project → Settings → Environment Variables.
All six are required for a working deploy:

| Variable | Value | Why |
|---|---|---|
| `BETTER_AUTH_SECRET` | `openssl rand -hex 32` (fresh per env) | Signs session cookies; `backend/src/config/env.ts` throws on boot without it |
| `BETTER_AUTH_URL` | `https://<your-project>.vercel.app` | Must match the public URL **exactly** — Better Auth validates Origin against it |
| `DB_URL` | `libsql://…` from step 1 | Remote DB (no writable disk on serverless) |
| `DB_AUTH_TOKEN` | token from step 1 | Turso auth |
| `TRUST_PROXY` | `1` | Behind Vercel's proxy every visitor looks like one IP without this → rate limiter locks everyone out together |
| `TRUSTED_ORIGINS_EXTRA` | `https://<your-project>.vercel.app` | Belt-and-suspenders for Better Auth CSRF (covers previews if you add them comma-separated) |

Notes:

- `BETTER_AUTH_URL` is already in `trustedOrigins`
  (`backend/src/config/env.ts`), the extra var just makes previews easy.
- Rotating `BETTER_AUTH_SECRET` signs every user out.
- Preview deployments (`*-*.vercel.app`) fail CSRF unless appended to
  `TRUSTED_ORIGINS_EXTRA` — that is expected, not a bug.

## 4. Deploy

- Push to the connected branch → Vercel builds + deploys automatically.
- Or manually: `npx vercel --prod` from the repo root.

## 5. Smoke checklist (every deploy)

```text
GET  https://<app>.vercel.app/api/health        → {"status":"ok",...}
GET  https://<app>.vercel.app/                   → landing renders
GET  https://<app>.vercel.app/api/destinations   → JSON list
POST https://<app>.vercel.app/api/auth/sign-up/email
     {name,email,password}                        → session cookie set
GET  https://<app>.vercel.app/journeys            → client route serves index.html (200, not 404)
GET  https://<app>.vercel.app/api/weather/<slug>  → {live,curated,isLive}
```

PowerShell one-liner:

```powershell
$app="https://<your-project>.vercel.app"
@("$app/api/health","$app/api/destinations") | % { "$_ → " + (Invoke-RestMethod $_ | ConvertTo-Json -Compress).Substring(0,120) }
```

## 6. What drag-and-drop can and cannot do

Dragging `frontend/dist` onto `vercel.com/new` gives a static demo:
landing page renders, but `/api/*`, auth, journeys and weather 404.
The full app requires this git-connected flow — there is no
zero-config single-file deploy for a stateful Express + DB backend.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Missing BETTER_AUTH_SECRET` in function logs | env var not set | Step 3 |
| Sign-in fails, CSRF / origin error | `BETTER_AUTH_URL` ≠ real public URL | Set it to exactly `https://<project>.vercel.app` |
| `no such table` / empty data | migrations never ran against Turso | Step 2 |
| Everyone rate-limited at once | `TRUST_PROXY` unset | Set to `1` |
| Preview URL auth fails, prod works | preview origin untrusted | Append preview URL to `TRUSTED_ORIGINS_EXTRA` |
| `/api/*` returns HTML | rewrite missing / `api/index.mjs` not deployed | Ensure `vercel.json` + `api/` are committed |
