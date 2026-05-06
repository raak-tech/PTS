ALTER TABLE `support_artifacts` ADD `reflection_ciphertext` text;--> statement-breakpoint
ALTER TABLE `support_artifacts` ADD `reflection_encryption_meta` text;--> statement-breakpoint
ALTER TABLE `user_consents` ADD `reflection_encryption_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user_consents` ADD `reflection_salt` text;