CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id" serial PRIMARY KEY NOT NULL,
  "action" varchar(100) NOT NULL,
  "category" varchar(40) DEFAULT 'other' NOT NULL,
  "level" varchar(20) DEFAULT 'info' NOT NULL,
  "message" text,
  "method" varchar(10),
  "path" text,
  "status_code" integer,
  "actor_user_id" integer,
  "actor_email" varchar(255),
  "actor_name" varchar(255),
  "actor_role" varchar(50),
  "resource_type" varchar(50),
  "resource_id" varchar(100),
  "ip" varchar(64),
  "user_agent" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_logs_created_at_idx" ON "activity_logs" ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_logs_category_idx" ON "activity_logs" ("category");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_logs_action_idx" ON "activity_logs" ("action");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_logs_actor_email_idx" ON "activity_logs" ("actor_email");
