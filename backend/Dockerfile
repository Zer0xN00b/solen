# Backend only — deploy this service on Railway / Render / Fly, etc.
# Builds with tsc (dist/) and runs the long-lived server (src/server.ts),
# NOT the Vercel bundle (backend/index.mjs + build/app.mjs), which is for
# Vercel's serverless function and is unrelated to this image.
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx tsc

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
EXPOSE 4000
CMD ["node", "dist/server.js"]
