CREATE TABLE `availability` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`time_slot` text NOT NULL,
	`capacity` integer DEFAULT 3 NOT NULL,
	`closed` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`file_name` text NOT NULL,
	`content_type` text NOT NULL,
	`url` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_key_unique` ON `media` (`key`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`name_en` text NOT NULL,
	`name_zh` text NOT NULL,
	`description_en` text NOT NULL,
	`description_zh` text NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`image_url` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_content` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reference` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`country` text NOT NULL,
	`preferred_date` text NOT NULL,
	`time_slot` text NOT NULL,
	`services` text NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_bookings`("id", "reference", "name", "email", "phone", "address", "country", "preferred_date", "time_slot", "services", "amount", "notes", "language", "status", "created_at") SELECT "id", "reference", "name", "email", "phone", '', "country", "preferred_date", "time_slot", "services", 0, "notes", "language", CASE WHEN "status"='new' THEN 'pending' ELSE "status" END, "created_at" FROM `bookings`;--> statement-breakpoint
DROP TABLE `bookings`;--> statement-breakpoint
ALTER TABLE `__new_bookings` RENAME TO `bookings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_reference_unique` ON `bookings` (`reference`);
