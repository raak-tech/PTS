CREATE TABLE `email_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`to_email` text NOT NULL,
	`subject` text NOT NULL,
	`body_text` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invite_codes` (
	`code` text PRIMARY KEY NOT NULL,
	`provider_user_id` text NOT NULL,
	`uses` integer DEFAULT 0 NOT NULL,
	`max_uses` integer,
	`expires_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_tokens_token_hash_unique` ON `password_reset_tokens` (`token_hash`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE TABLE `user_consents` (
	`user_id` text PRIMARY KEY NOT NULL,
	`data_storage_enabled` integer DEFAULT false NOT NULL,
	`enabled_at` integer,
	`revoked_at` integer
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);