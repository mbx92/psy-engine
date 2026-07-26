CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"birth_date" date NOT NULL,
	"gender" varchar(1) NOT NULL,
	"phone" varchar(50),
	"email" varchar(255),
	"nik" varchar(20),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"level" varchar(20) NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_type_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"invitation_id" uuid,
	"token" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb,
	"scores" jsonb DEFAULT '{}'::jsonb,
	"interpretation" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp,
	"completed_at" timestamp,
	"verified_at" timestamp,
	"verified_by" uuid,
	"verified_notes" text,
	"last_activity" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "test_type_norms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_type_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"label" varchar(255),
	"norm_type" varchar(50) NOT NULL,
	"data" jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "test_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"type" varchar(50) NOT NULL,
	"description" text,
	"config" jsonb DEFAULT '{}'::jsonb,
	"questions" jsonb DEFAULT '[]'::jsonb,
	"scoring_config" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "test_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'admin' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "session_logs" ADD CONSTRAINT "session_logs_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_test_type_id_test_types_id_fk" FOREIGN KEY ("test_type_id") REFERENCES "public"."test_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_type_norms" ADD CONSTRAINT "test_type_norms_test_type_id_test_types_id_fk" FOREIGN KEY ("test_type_id") REFERENCES "public"."test_types"("id") ON DELETE no action ON UPDATE no action;