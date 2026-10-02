import { z } from "zod";

/** Coerce empty string / undefined / null to undefined so optional fields work cleanly. */
const emptyToUndefined = z.preprocess(
  (val) => (val === "" || val === null ? undefined : val),
  z.string().optional()
);

export const CreateProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: emptyToUndefined,
  sku: emptyToUndefined,
  category: emptyToUndefined,
  price: z.coerce.number().min(0, "Price cannot be negative").max(100_000_000, "Price too large"),
  costPrice: z.coerce.number().min(0, "Cost price cannot be negative").max(100_000_000, "Cost price too large").optional(),
  quantity: z.coerce.number().int("Quantity must be a whole number").nonnegative("Quantity cannot be negative").max(1_000_000, "Quantity too large"),
  lowStockThreshold: z.coerce.number().int().nonnegative().default(5),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const AdjustStockSchema = z.object({
  quantity: z.coerce.number().int("Quantity must be an integer"),
});

export const ProductQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  lowStock: z.preprocess((val) => val === 'true', z.boolean().optional()),
});
