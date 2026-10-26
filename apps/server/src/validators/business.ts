import { z } from "zod";

/**
 * Coerce empty / whitespace-only / null to undefined so optional free-text fields
 * behave exactly like an omitted key. Mirrors the helper in validators/products.ts.
 *
 * This matters because `businessService.updateBusiness` assigns every column it is
 * handed: an omitted key (`undefined`) is skipped by Drizzle, but an empty string
 * is written straight over an existing value.
 */
const emptyToUndefined = z.preprocess(
  (val) => (val === null || (typeof val === "string" && val.trim() === "") ? undefined : val),
  z.string().optional()
);

/** Same empty-to-undefined coercion as `emptyToUndefined`, but keeps email shape validation. */
const emptyToUndefinedEmail = z.preprocess(
  (val) => (val === null || (typeof val === "string" && val.trim() === "") ? undefined : val),
  z.string().email("Invalid email address").optional()
);

/**
 * NOTE: `z.object()` strips unknown keys rather than rejecting them, so any field
 * missing from this schema is silently discarded before it reaches the service.
 * The profile screen edits description / phone / email / address, so every one of
 * them must be declared here or the user's input is lost with a success response.
 */
export const UpdateBusinessSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters").optional(),
  category: z.string().min(1, "Category is required").optional(),
  whatsappNumber: z.string().regex(/^\d{10,15}$/, "Enter a valid WhatsApp number").optional(),
  description: emptyToUndefined,
  phone: emptyToUndefined,
  email: emptyToUndefinedEmail,
  address: emptyToUndefined,
  city: z.string().min(1, "City is required").optional(),
  state: z.string().min(1, "State is required").optional(),
  logoUrl: z.string().url("Invalid logo URL").optional(),
});