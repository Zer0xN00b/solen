/**
 * Schema barrel — the single import point for the whole database schema.
 *
 * Both drizzle-kit (`drizzle.config.ts`) and the Better Auth adapter
 * (`auth/auth.ts`) import from here, so the split into auth vs product
 * is invisible to them, and every existing `./schema.js` import keeps
 * working unchanged.
 *
 * WHY A BARREL RATHER THAN A DIRECTORY
 *
 * A `schema/` directory holding the two files would be tidier to read
 * but breaks `./schema.js` resolution for `auth.ts`, `db.ts` and
 * `journeyModel.ts`, and makes the drizzle-kit path longer for no gain.
 * Flat files with one obvious entry point is the smaller change.
 *
 * WHY THE SPLIT EXISTS
 *
 * `authSchema.ts` is overwritten wholesale by the Better Auth generator
 * (`auth:generate-schema`). Product tables in `productSchema.ts` are
 * therefore unreachable by that command, which permanently closes a
 * hazard that previously required a "copy it out first" warning banner.
 *
 * Add new product tables to `productSchema.ts`. The one rule: this barrel
 * must never become the generator's output path. If you ever find
 * `--output src/database/schema.ts` in package.json, that is a data-loss
 * bug — `auth:generate-schema` overwrites its target wholesale, and that
 * target is this file.
 */

export * from "./authSchema.js";
export * from "./productSchema.js";