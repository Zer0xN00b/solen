// 404 for any request that matched no route.
export function notFound(req, res) {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
  });
}
