ALTER TABLE "sessions" ALTER COLUMN "verified_by" SET DATA TYPE integer USING NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "invitation_id";