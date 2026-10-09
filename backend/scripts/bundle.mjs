// Bundles the Express app into ONE plain-ESM file for Vercel.
//
// Why: Vercel's own per-file TypeScript handling can emit the entry as ESM
// and its sibling modules as CommonJS, which makes Node's ESM linker reject
// named imports ("does not provide an export named ...") and crashes the
// whole function on boot. A single pre-bundled .mjs file has no sibling
// modules and no format to disagree about. npm packages stay external
// (Vercel installs and traces them from node_modules as usual).
import { build } from 'esbuild';

await build({
  entryPoints: ['src/app.ts'],
  outfile: 'build/app.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  packages: 'external',
  sourcemap: true,
  logLevel: 'info',
});
