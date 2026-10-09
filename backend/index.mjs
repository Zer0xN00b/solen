// Vercel entrypoint for the api service. Thin on purpose: the real app is
// bundled into build/app.mjs by `npm run build` (scripts/bundle.mjs).
// .mjs is always ESM, so there is no module-format guesswork.
import app from './build/app.mjs';

export default app;
