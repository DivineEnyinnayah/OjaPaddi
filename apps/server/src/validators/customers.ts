import { z } from "zod";

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, "Customer or supermarket name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  customerType: z.enum(["individual", "supermarket"]).default("individual"),
  expectedPaymentPeriodDays: z.coerce.number().int().nonnegative().optional(),
  suppliedProductIds: z.array(z.string()).optional(),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

export const CustomerQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  customerType: z.enum(["individual", "supermarket"]).optional(),
});
