-- Add unique index for customer phone per business (prevents duplicates)
CREATE UNIQUE INDEX "customer_phone_business_idx" ON "customers" USING btree ("business_id", "phone") WHERE "phone" IS NOT NULL;

-- Add unique index for expense description per business per date (prevents duplicate entries)
CREATE INDEX "expenses_business_date_idx" ON "expenses" USING btree ("business_id", "incurred_at");

-- Add index for sales voided_at filtering (analytics performance)
CREATE INDEX "sales_voided_at_idx" ON "sales" USING btree ("voided_at") WHERE "voided_at" IS NOT NULL;

-- Add index for products active status filtering
CREATE INDEX "products_active_idx" ON "products" USING btree ("business_id", "is_active");
