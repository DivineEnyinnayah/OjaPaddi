import { z } from "zod";

export const SaleItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  unitPrice: z.coerce.number().min(0.01, "Unit price must be at least ₦0.01"),
});

export const CreateSaleSchema = z.object({
  orderType: z.enum(["customer", "supermarket"]).default("customer"),
  customerId: z.string().uuid("Invalid customer ID").optional(),
  items: z.array(SaleItemSchema).min(1, "At least one item is required"),
  discount: z.coerce.number().nonnegative().default(0),
  paymentMethod: z.enum(["cash", "transfer", "pos", "cheque", "other"]),
  paymentStatus: z.enum(["paid", "partial", "unpaid"]),
  amountPaid: z.coerce.number().nonnegative(),
  expectedPaymentDate: z.string().optional(),
  notes: z.string().optional(),
});

export const ReturnSaleItemSchema = z.object({
  saleItemId: z.string().uuid("Invalid sale item ID"),
  quantity: z.coerce.number().int().positive("Returned quantity must be positive"),
});

export const ReturnProductsSchema = z.object({
  returns: z.array(ReturnSaleItemSchema).min(1, "At least one return item is required"),
  notes: z.string().optional(),
});

export const SaleQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  customerId: z.string().uuid().optional(),
  orderType: z.enum(["customer", "supermarket"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
