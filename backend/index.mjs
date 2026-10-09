// Vercel entrypoint for the api service. .mjs is ALWAYS ESM to Node,
// regardless of any "type" field or framework auto-detection elsewhere in
// the build — the real app is bundled into build/app.mjs (scripts/bundle.mjs).
import app from './build/app.mjs';
export default app;
