import { z } from "zod";

export const SaleItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  unitPrice: z.coerce.number().min(0.01, "Unit price must be at least ₦0.01"),
});

export const CreateSaleSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID").optional(),
  items: z.array(SaleItemSchema).min(1, "At least one item is required"),
  discount: z.coerce.number().nonnegative().default(0),
  paymentMethod: z.enum(["cash", "transfer", "pos", "other"]),
  paymentStatus: z.enum(["paid", "partial", "unpaid"]),
  amountPaid: z.coerce.number().nonnegative(),
  notes: z.string().optional(),
});

export const SaleQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  customerId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
