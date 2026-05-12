ALTER TABLE "user_consents" ADD COLUMN "provider_access_enabled" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_consents" ADD COLUMN "reflections_enabled" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_consents" ADD COLUMN "red_flags_storage_enabled" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE TABLE "support_audit_events" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "kind" text NOT NULL,
  "detail" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL
);
