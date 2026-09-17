// Creates backend/.env from .env.example on first run, generating a fresh
// BETTER_AUTH_SECRET automatically. Never overwrites an existing .env.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const backendRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envPath = path.join(backendRoot, '.env');
const examplePath = path.join(backendRoot, '.env.example');

if (!fs.existsSync(envPath)) {
  const template = fs.readFileSync(examplePath, 'utf8');
  const secret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(envPath, template.replace('replace-with-a-long-random-string', secret));
  console.log('[solen-api] Created backend/.env with a fresh BETTER_AUTH_SECRET');
}
