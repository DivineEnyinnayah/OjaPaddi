import { z } from "zod";

export const CreateProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  price: z.coerce.number().positive("Price must be positive"),
  costPrice: z.coerce.number().positive("Cost price must be positive").optional(),
  quantity: z.coerce.number().int().nonnegative("Quantity cannot be negative"),
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
