CREATE TABLE "app_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"system_name" varchar(100) DEFAULT 'PsyEngine',
	"tagline" varchar(255) DEFAULT 'Psychology Test System',
	"timezone" varchar(64) DEFAULT 'Asia/Jakarta',
	"logo" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
INSERT INTO "app_settings" ("system_name", "tagline", "timezone") VALUES ('PsyEngine', 'Psychology Test System', 'Asia/Jakarta');
