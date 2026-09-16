import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

const server = http.createServer(app);

server.listen(env.port, () => {
  console.log(`[solen-api] ${env.nodeEnv} server listening on http://localhost:${env.port}`);
  console.log(`[solen-api] health check: http://localhost:${env.port}/api/health`);
});
