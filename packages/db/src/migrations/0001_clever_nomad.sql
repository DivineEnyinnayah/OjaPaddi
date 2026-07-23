ALTER TABLE "sales" ADD COLUMN "voided_at" timestamp;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "voided_by" uuid;