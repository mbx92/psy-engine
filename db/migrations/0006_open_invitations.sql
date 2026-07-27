CREATE TABLE "open_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_type_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"label" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"max_uses" integer,
	"use_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "open_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "open_invitations" ADD CONSTRAINT "open_invitations_test_type_id_test_types_id_fk" FOREIGN KEY ("test_type_id") REFERENCES "public"."test_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "open_invitations" ADD CONSTRAINT "open_invitations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "open_invitations_token_idx" ON "open_invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "open_invitations_test_type_id_idx" ON "open_invitations" USING btree ("test_type_id");