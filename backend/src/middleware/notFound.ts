import type { Request, Response } from 'express';

/** 404 for any request that matched no route. */
export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
  });
}
