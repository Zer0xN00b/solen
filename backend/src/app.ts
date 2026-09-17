import express from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth/auth.js';
import apiRouter from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Better Auth BEFORE express.json(): its handler reads the raw request
  // body itself, so the JSON parser must not consume it first.
  app.use('/api/auth', toNodeHandler(auth));

  app.use(express.json());
  app.use('/api', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
