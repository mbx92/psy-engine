CREATE INDEX "participants_email_idx" ON "participants" USING btree ("email");--> statement-breakpoint
CREATE INDEX "participants_nik_idx" ON "participants" USING btree ("nik");--> statement-breakpoint
CREATE INDEX "sessions_status_idx" ON "sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sessions_test_type_id_idx" ON "sessions" USING btree ("test_type_id");--> statement-breakpoint
CREATE INDEX "sessions_participant_id_idx" ON "sessions" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "sessions_created_at_idx" ON "sessions" USING btree ("created_at");