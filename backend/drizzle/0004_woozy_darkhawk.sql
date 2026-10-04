ALTER TABLE `journey` ADD `share_slug` text;--> statement-breakpoint
ALTER TABLE `journey` ADD `is_public` integer DEFAULT false NOT NULL;