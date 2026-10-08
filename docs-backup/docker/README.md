# Archived Docker files (not used by Vercel)

`Dockerfile`, `docker-compose.yml` and `.dockerignore` were moved here on
8 Oct 2026 to keep the repo root clean for the Vercel deploy.

- **Vercel** builds via `vercel.json` (`npm run build -w frontend &&
  npm run build -w backend`) and never reads these files.
- **To use Docker again** (local prod-like run or a future VPS move):
  move the three files back to the repo root and run
  `docker compose up --build`.
- Note: the image was never built before archiving (no Docker in that
  environment) — expect to fix something small on first build.
  See `../DEPLOYMENT.md` §7.
