ALTER TABLE "session_logs" DROP CONSTRAINT "session_logs_session_id_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "session_logs" ADD CONSTRAINT "session_logs_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;