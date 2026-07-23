import { z } from "zod";

export const CreateProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  price: z.coerce.number().min(0.01, "Price must be at least ₦0.01"),
  costPrice: z.coerce.number().min(0.01, "Cost price must be at least ₦0.01").optional(),
  quantity: z.coerce.number().int().nonnegative("Quantity cannot be negative").max(1_000_000, "Quantity too large"),
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
