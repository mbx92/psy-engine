CREATE TABLE "psikograms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"session_id" uuid,
	"examiner_id" integer NOT NULL,
	"exam_date" date NOT NULL,
	"participant" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sections" jsonb DEFAULT '{}'::jsonb,
	"recommendation" varchar(20),
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"notes" text,
	"public_token" varchar(64),
	"public_token_expiry" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "psikograms_public_token_unique" UNIQUE("public_token")
);
--> statement-breakpoint
CREATE TABLE "psychology_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"logo" text,
	"footer" text,
	"primary_color" varchar(7) DEFAULT '#1e3a5f',
	"secondary_color" varchar(7) DEFAULT '#6b7280',
	"psychologist_name" varchar(255),
	"license_number" varchar(100),
	"email" varchar(255),
	"phone" varchar(50),
	"institution_name" varchar(255),
	"tagline" varchar(255),
	"address" text,
	"institution_website" varchar(255),
	"institution_email" varchar(255),
	"institution_phone" varchar(50),
	"instagram" varchar(100),
	"report_title" varchar(100) DEFAULT 'PSIKOGRAM',
	"report_subtitle" varchar(255) DEFAULT 'Hasil Pemeriksaan Psikologis',
	"report_footer" text,
	"show_logo" boolean DEFAULT true NOT NULL,
	"show_signature" boolean DEFAULT true NOT NULL,
	"show_watermark" boolean DEFAULT false NOT NULL,
	"signature" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "psikograms" ADD CONSTRAINT "psikograms_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psikograms" ADD CONSTRAINT "psikograms_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psikograms" ADD CONSTRAINT "psikograms_examiner_id_users_id_fk" FOREIGN KEY ("examiner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "psikograms_participant_id_idx" ON "psikograms" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "psikograms_session_id_idx" ON "psikograms" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "psikograms_examiner_id_idx" ON "psikograms" USING btree ("examiner_id");--> statement-breakpoint
CREATE INDEX "psikograms_status_idx" ON "psikograms" USING btree ("status");