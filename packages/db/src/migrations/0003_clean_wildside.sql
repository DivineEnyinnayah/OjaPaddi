DROP INDEX "sku_business_idx";--> statement-breakpoint
ALTER TABLE "sale_items" ALTER COLUMN "product_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "slug" varchar(50);--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "is_published" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_visible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX "sku_business_idx" ON "products" USING btree ("business_id","sku") WHERE "products"."sku" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_slug_unique" UNIQUE("slug");