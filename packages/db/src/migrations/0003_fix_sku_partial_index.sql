-- Fix: drop the old unique index that treated NULL SKUs as equal (causing a constraint
-- violation when adding a second product without a SKU), and replace it with a partial
-- unique index that only enforces uniqueness when SKU is not null.

DROP INDEX IF EXISTS "sku_business_idx";

CREATE UNIQUE INDEX "sku_business_idx"
  ON "products" USING btree ("business_id", "sku")
  WHERE "sku" IS NOT NULL;
