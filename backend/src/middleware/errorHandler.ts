import type { NextFunction, Request, Response } from 'express';

/** Central error handler — keeps route code clean (scope doc §45, §55). */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  void next; // express identifies error handlers by the 4-argument signature

  const anyErr = err as Error & { status?: number };
  const status = anyErr.status || 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  if (status === 500) {
    console.error('[solen-api] error:', err);
  }

  res.status(status).json({ error: message });
}
