import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const backendRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  dbFile: process.env.DB_FILE
    ? path.resolve(process.cwd(), process.env.DB_FILE)
    : path.join(backendRoot, 'data', 'solen.db'),
};
