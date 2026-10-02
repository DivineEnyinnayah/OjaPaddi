import { z } from "zod";

export const UpdateBusinessSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters").optional(),
  category: z.string().min(1, "Category is required").optional(),
  whatsappNumber: z.string().regex(/^\d{10,15}$/, "Enter a valid WhatsApp number").optional(),
  city: z.string().min(1, "City is required").optional(),
  state: z.string().min(1, "State is required").optional(),
  logoUrl: z.string().url("Invalid logo URL").optional(),
});
