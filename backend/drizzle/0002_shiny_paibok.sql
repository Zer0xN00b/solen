CREATE TABLE `destination` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`region` text,
	`image` text,
	`card_description` text,
	`hero_description` text,
	`intro_title` text,
	`intro` text,
	`best_time` text,
	`travel_styles` text,
	`experiences` text,
	`lat` real,
	`lng` real,
	`weather_summary` text,
	`accommodation_standard` text,
	`accommodation_premium` text,
	`dining_standard` text,
	`dining_premium` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `destination_slug_unique` ON `destination` (`slug`);--> statement-breakpoint
CREATE INDEX `destination_name_idx` ON `destination` (`name`);--> statement-breakpoint
CREATE TABLE `itinerary_day` (
	`id` text PRIMARY KEY NOT NULL,
	`destination_id` text NOT NULL,
	`day_index` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`activities` text,
	`budget` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`destination_id`) REFERENCES `destination`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `itinerary_day_destination_day_idx` ON `itinerary_day` (`destination_id`,`day_index`);
