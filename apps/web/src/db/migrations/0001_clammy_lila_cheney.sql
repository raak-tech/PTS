CREATE TABLE `support_artifacts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`body_text` text NOT NULL,
	`created_at` integer NOT NULL
);
