CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" varchar(255) NOT NULL,
  "name" varchar(255) NOT NULL,
  "password_hash" varchar(255) NOT NULL,
  "role" varchar(50) DEFAULT 'admin' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");

CREATE TABLE IF NOT EXISTS "test_types" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "slug" varchar(100) NOT NULL,
  "type" varchar(50) NOT NULL,
  "description" text,
  "config" jsonb DEFAULT '{}',
  "questions" jsonb DEFAULT '[]',
  "scoring_config" jsonb DEFAULT '{}',
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "test_types_slug_idx" ON "test_types" ("slug");

CREATE TABLE IF NOT EXISTS "participants" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "birth_date" date NOT NULL,
  "gender" varchar(1) NOT NULL,
  "phone" varchar(50),
  "email" varchar(255),
  "nik" varchar(20),
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  "test_type_id" uuid NOT NULL REFERENCES "test_types"("id"),
  "participant_id" uuid NOT NULL REFERENCES "participants"("id"),
  "invitation_id" uuid,
  "token" varchar(255) NOT NULL,
  "status" varchar(50) DEFAULT 'pending',
  "answers" jsonb DEFAULT '{}',
  "scores" jsonb DEFAULT '{}',
  "interpretation" jsonb DEFAULT '{}',
  "metadata" jsonb DEFAULT '{}',
  "started_at" timestamp,
  "completed_at" timestamp,
  "verified_at" timestamp,
  "verified_by" uuid,
  "verified_notes" text,
  "last_activity" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_idx" ON "sessions" ("token");

CREATE TABLE IF NOT EXISTS "session_logs" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "sessions"("id"),
  "level" varchar(20) NOT NULL,
  "event_type" varchar(50) NOT NULL,
  "message" text,
  "metadata" jsonb DEFAULT '{}',
  "created_at" timestamp DEFAULT now()
);
