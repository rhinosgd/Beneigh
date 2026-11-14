CREATE INDEX `availability_date_slot_idx` ON `availability` (`date`,`time_slot`);--> statement-breakpoint
CREATE INDEX `bookings_date_slot_status_idx` ON `bookings` (`preferred_date`,`time_slot`,`status`);--> statement-breakpoint
CREATE INDEX `messages_conversation_id_idx` ON `messages` (`conversation_id`,`id`);