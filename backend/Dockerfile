# Backend only — deploy on Railway / Render / Fly, etc.
#
# IMPORTANT: this repo uses npm workspaces, so there is ONE package-lock.json
# at the repo ROOT, not one inside backend/. That means:
#   - the Docker BUILD CONTEXT must be the repo root, not backend/
#   - Railway: Settings -> Root Directory must be EMPTY/"." (the repo root),
#     NOT "backend" — Root Directory controls the build context, and setting
#     it to backend/ is exactly what broke `npm ci` (no lockfile to find).
#   - `npm ci -w backend` installs ONLY backend's deps, using the root
#     lockfile, which is what workspaces are for.
#
# Builds with tsc (backend/dist/) and runs the long-lived server
# (backend/src/server.ts) — NOT the old Vercel bundle, which is unrelated.
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
RUN npm ci -w backend
COPY backend ./backend
RUN npm run build -w backend

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
RUN npm ci -w backend --omit=dev
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/drizzle ./backend/drizzle
EXPOSE 4000
CMD ["node", "backend/dist/server.js"]
