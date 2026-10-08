# SOLEN — single-container image.
#
# One process serves BOTH the API and the built SPA, so the browser sees a
# single origin. That is what keeps the httpOnly session cookie working with
# no CORS setup and no token in JS — the same property the Vite dev proxy
# gives you in development. Two services would mean CORS, a CSRF origin
# allowlist, and two deployments to keep in sync.
#
# The layout inside the image mirrors the repo (backend/ and frontend/ as
# siblings) because backend/src/config/env.ts derives backendRoot from its
# own module URL, and app.ts resolves the SPA from ../frontend/dist relative
# to that. Moving things around here silently breaks both.

# ---------- install dependencies ----------
FROM node:22-slim AS deps
WORKDIR /app

# libSQL ships prebuilt native binaries, but a toolchain in THIS layer
# means a platform quirk can still be worked around at build time
# instead of failing with an opaque "Cannot find module" much later.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Manifests only, so this layer is reused whenever application code changes.
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
RUN npm ci

# ---------- build the frontend ----------
FROM deps AS frontend-build
WORKDIR /app
COPY frontend ./frontend
RUN npm run build -w frontend

# ---------- build the backend ----------
FROM deps AS backend-build
WORKDIR /app
COPY backend ./backend
RUN npm run build -w backend

# ---------- runtime ----------
FROM node:22-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000 \
    DB_FILE=/app/backend/data/solen.db

# curl is here solely for the healthcheck below.
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=backend-build /app/backend/dist ./backend/dist
# Migrations run on boot (server.ts calls migrate()). Without this folder the
# container starts and immediately fails to apply pending migrations.
COPY --from=backend-build /app/backend/drizzle ./backend/drizzle
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# The local libSQL file lives on a mounted volume; the directory must exist
# and be writable by the unprivileged user before the process starts.
# (Remote Turso mode needs no volume — DB_URL + DB_AUTH_TOKEN instead.)
RUN mkdir -p /app/backend/data && chown -R node:node /app

USER node

EXPOSE 4000

# Probes the API, not the root document, so a broken SPA cannot look healthy.
HEALTHCHECK --interval=30s --timeout=4s --start-period=20s --retries=3 \
  CMD curl -fsS http://localhost:4000/api/health || exit 1

CMD ["node", "backend/dist/server.js"]