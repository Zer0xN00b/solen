/**
 * SOLEN product tables — HAND-WRITTEN, never generated.
 *
 * Separate from `authSchema.ts` (which the Better Auth generator
 * overwrites wholesale) precisely so that regenerating the auth tables
 * cannot delete anything in this file. Re-exported via `index.ts`, which
 * is what drizzle-kit and the auth adapter both import.
 *
 * Evolve these with drizzle-kit:
 *   npm run db:generate -w backend   → new SQL migration
 *   npm run db:migrate  -w backend   → apply it
 */

import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { user } from "./authSchema.js";

/**
 * Saved journeys (scope doc §48).
 *
 * The planner's journey object is deeply nested (per-day itinerary,
 * experience, budget breakdown), so it is stored as a JSON snapshot in
 * `data`. The fields worth filtering or sorting on are promoted to real
 * columns rather than being dug out of the JSON.
 *
 * `userId` is NULLABLE ON PURPOSE: §47 requires public trip planning to
 * work without an account, so anonymous saves are first-class rows owned
 * by nobody. A signed `ownerToken` cookie scopes them to one browser, and
 * signup can later claim them. Making this column NOT NULL would have
 * forced the choice the spec explicitly defers.
 */
export const journey = sqliteTable(
  "journey",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" }),

    // Anonymous-save scoping. Null for logged-in journeys, which are
    // already scoped by userId.
    ownerToken: text("owner_token"),

    title: text("title").notNull(),

    // Promoted from the JSON snapshot for list/sort/filter use.
    destination: text("destination").notNull(),
    duration: integer("duration").notNull(),
    travelStyle: text("travel_style"),
    budget: integer("budget"),
    currency: text("currency").default("INR").notNull(),
    isPremiumPlus: integer("is_premium_plus", { mode: "boolean" })
      .default(false)
      .notNull(),
// ---- sharing (scope doc §48) ----
    //
    // Deliberately NOT a sequential counter and NOT the row id. A public share
    // URL is enumerable by construction: /shared/1, /shared/2, ... would hand
    // every anonymous visitor someone else's trip. A v4 UUID has no ordering
    // to walk, so guessing one is as hard as guessing a session token.
    //
    // Null means "not shared", and nothing infers consent from a value being
    // present — `isPublic` is the explicit owner decision, kept separate so a
    // half-finished write can never publish anything.
    shareSlug: text("share_slug"),
    isPublic: integer("is_public", { mode: "boolean" }).default(false).notNull(),

    // Full journey snapshot: itinerary days, experience, personalized
    // summary, budget breakdown. Serialized as JSON text — SQLite has no
    // native JSON type, and this keeps the shape evolvable without a
    // migration per planner field.
    data: text("data").notNull(),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    // Listing is always "this owner's journeys, newest first".
    index("journey_userId_createdAt_idx").on(table.userId, table.createdAt),
    index("journey_ownerToken_idx").on(table.ownerToken),
  ],
);

/**
 * Destinations (scope doc §10, §51, §54).
 *
 * This table exists because the same seven destinations were previously
 * described FOUR separate times across the frontend data files
 * (destinations.js, destinationEditorial.js, homeContent.js,
 * globeDestinations.js), each holding a partially overlapping subset of
 * fields. The database is the single source of truth that collapses them.
 *
 * NOTE ON THE TWO DESCRIPTION COLUMNS — this is deliberate and it
 * encodes a real conflict, not a modelling mistake:
 *
 *   Amalfi Coast is described three different ways today:
 *     homeContent        "Cliffside mornings & Mediterranean evenings"
 *     destinationEditorial "Cliffside villages, blue waters, and
 *                           effortless Italian beauty."
 *
 * They were written for different surfaces (a card vs a hero) and are
 * both intentional. A single `description` column would have silently
 * picked one and lost the other. Naming them by SURFACE makes the
 * distinction explicit and impossible to conflate by accident:
 *
 *   cardDescription  → homepage discovery cards (one line, evocative)
 *   heroDescription  → destination detail hero + globe tooltip (a sentence)
 *
 * `slug` is the URL key used by /destinations/:slug. It must match
 * destinationEditorial.js's existing keys (e.g. `amalfi-coast`) or the
 * detail pages 404.
 *
 * `lat`/`lng` come from globeDestinations.js, where they are already real
 * coordinates (the globe is a true 3D sphere, not screen percentages).
 * Promoted to real columns now because Phase 5's weather integration
 * needs them and back-filling later would be a second migration.
 */
export const destination = sqliteTable(
  "destination",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),

    /** e.g. "ITALY · EUROPE" from destinationEditorial.js */
    region: text("region"),
    /** Public asset path, e.g. '/assets/destinations/kyoto.webp' */
    image: text("image"),

    // --- surface-specific descriptions (see the note above) ---
    cardDescription: text("card_description"),
    heroDescription: text("hero_description"),

    /**
     * The globe's own two strings, which are genuinely different content
     * rather than a reformatting of the two above.
     *
     * `globeRegion` is a short plain label ("Italy") where `region` is the
     * display form ("ITALY · EUROPE"). `globeDescription` is a fourth
     * distinct line for 3 of 7 destinations (Amalfi, Paris, Iceland) that
     * matches neither the card nor the hero copy.
     *
     * They were found by diffing `globeDestinations.js` against the
     * database during the frontend migration. Folding them into `region` or
     * `heroDescription` would have silently restyled a locked page, so they
     * get their own columns. Nullable: a destination may be seeded before
     * its globe entry exists.
     */
    globeRegion: text("globe_region"),
    globeDescription: text("globe_description"),

    /** Long-form editorial intro, shown on the destination detail page. */
    introTitle: text("intro_title"),
    intro: text("intro"),
    bestTime: text("best_time"),

    /** JSON string arrays, matching the source data shape. */
    travelStyles: text("travel_styles", { mode: "json" }).$type<string[]>(),
    experiences: text("experiences", { mode: "json" }).$type<string[]>(),

    // Real geographic coordinates — required by the 3D globe and by
    // Phase 5 weather lookups. `real`, NOT integer: the source values are
    // decimal (Kyoto 35.0116, Bali -8.5069, Maldives 4.1755), and an
    // integer column would silently truncate them to whole degrees —
    // ~110km of error per destination, and invisible until a marker
    // lands in the wrong sea. Nullable so a destination can be seeded
    // before its coordinates are known.
    lat: real("lat"),
    lng: real("lng"),

    /**
     * Curated weather prose from destinations.js, e.g. "Warm, sunny days
     * with a gentle Mediterranean breeze." Phase 5 replaces this with a
     * live forecast, but it is kept as the curated fallback for when the
     * weather API is unreachable — the planner must not fail because a
     * third party is down.
     */
    weatherSummary: text("weather_summary"),

    // Accommodation and dining tiers. Two columns each rather than a
    // JSON blob, because the planner branches on premium vs standard
    // and will eventually want to filter or report on them.
    accommodationStandard: text("accommodation_standard"),
    accommodationPremium: text("accommodation_premium"),
    diningStandard: text("dining_standard"),
    diningPremium: text("dining_premium"),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("destination_name_idx").on(table.name),
  ],
);

/**
 * Curated base itineraries (scope doc §10, §19).
 *
 * One row per day-plan per destination — 7 destinations, 49 day blocks
 * today. The planner personalizes and cycles these at generation time
 * (journey.js `buildJourneyDays`), so a 3-day trip draws the first 3 and
 * a 14-day trip cycles the same set with "A Deeper Day" suffixes.
 *
 * `dayIndex` is 0-based and carries a UNIQUE constraint on
 * (destinationId, dayIndex). That is not just tidiness: the seed script
 * re-runs, and without it a re-seed would double every day block and
 * silently corrupt every generated journey.
 */
export const itineraryDay = sqliteTable(
  "itinerary_day",
  {
    id: text("id").primaryKey(),
    destinationId: text("destination_id")
      .notNull()
      .references(() => destination.id, { onDelete: "cascade" }),
    dayIndex: integer("day_index").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    /** JSON string array of activities. */
    activities: text("activities", { mode: "json" }).$type<string[]>(),
    budget: integer("budget"),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("itinerary_day_destination_day_idx").on(table.destinationId, table.dayIndex),
  ],
);

export const journeyRelations = relations(journey, ({ one }) => ({
  user: one(user, {
    fields: [journey.userId],
    references: [user.id],
  }),
}));

export const destinationRelations = relations(destination, ({ many }) => ({
  days: many(itineraryDay),
}));

export const itineraryDayRelations = relations(itineraryDay, ({ one }) => ({
  destination: one(destination, {
    fields: [itineraryDay.destinationId],
    references: [destination.id],
  }),
}));