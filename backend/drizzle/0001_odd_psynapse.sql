CREATE TABLE `journey` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`owner_token` text,
	`title` text NOT NULL,
	`destination` text NOT NULL,
	`duration` integer NOT NULL,
	`travel_style` text,
	`budget` integer,
	`currency` text DEFAULT 'INR' NOT NULL,
	`is_premium_plus` integer DEFAULT false NOT NULL,
	`data` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `journey_userId_createdAt_idx` ON `journey` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `journey_ownerToken_idx` ON `journey` (`owner_token`);