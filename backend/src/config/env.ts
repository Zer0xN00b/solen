import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

// src/config/env.ts → src/config → src → backend
export const backendRoot = path.dirname(
  path.dirname(path.dirname(fileURLToPath(import.meta.url)))
);

function requireSecret(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[solen-api] Missing ${name}. Copy backend/.env.example to backend/.env and fill it in.`
    );
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  dbFile: process.env.DB_FILE
    ? path.resolve(process.cwd(), process.env.DB_FILE)
    : path.join(backendRoot, 'data', 'solen.db'),

  // Better Auth (scope doc §47) — secret signs session tokens, URL is the
  // API's own base URL (the frontend reaches it through the Vite /api proxy).
  betterAuthSecret: requireSecret('BETTER_AUTH_SECRET'),
  betterAuthUrl: process.env.BETTER_AUTH_URL || 'http://localhost:4000',
};
