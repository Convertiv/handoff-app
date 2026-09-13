ALTER TABLE "components" ADD COLUMN "source_format" text;--> statement-breakpoint
-- Backfill from the authoritative record so components published before this migration get a value too.
UPDATE "components" SET "source_format" = "record"->>'sourceFormat' WHERE "record"->>'sourceFormat' IS NOT NULL;