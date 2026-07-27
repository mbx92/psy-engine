ALTER TABLE "open_invitations" ADD COLUMN "test_type_ids" jsonb;
UPDATE "open_invitations" SET "test_type_ids" = jsonb_build_array("test_type_id") WHERE "test_type_ids" IS NULL;
