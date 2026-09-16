// Central error handler — keeps route code clean (scope doc §45, §55).
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  if (status === 500) {
    console.error('[solen-api] error:', err);
  }

  res.status(status).json({ error: message });
}
