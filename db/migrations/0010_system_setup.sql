ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "maintenance_mode" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "maintenance_message" text;
--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "system_locked" boolean DEFAULT false NOT NULL;
