CREATE TABLE "rate_limit_settings" (
  "id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
  "policies" jsonb NOT NULL,
  "revision" uuid DEFAULT gen_random_uuid() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "rate_limit_settings_singleton" CHECK ("id" = 1)
);
