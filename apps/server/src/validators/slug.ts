import { z } from "zod";

/**
 * Reserved slugs that cannot be used by businesses.
 * These collide with app routes and common subdomains.
 */
export const RESERVED_SLUGS = new Set([
  // App routes
  "admin",
  "api",
  "dashboard",
  "store",
  "settings",
  "products",
  "sales",
  "customers",
  "analytics",
  "inventory",
  "expenses",
  "profile",
  "login",
  "register",
  "signup",
  "onboarding",
  "welcome",
  "auth",
  "logout",
  "reset-password",
  "forgot-password",
  "verify-email",
  "privacy",
  "terms",
  "help",
  "support",
  "contact",
  "about",
  "blog",
  "docs",
  "documentation",
  "changelog",
  "status",
  "health",
  "ping",
  "webhook",
  "webhooks",
  "callback",
  "oauth",
  "sso",
  "saml",
  // Common subdomains
  "www",
  "mail",
  "ftp",
  "ssh",
  "dev",
  "staging",
  "prod",
  "production",
  "test",
  "testing",
  "local",
  "localhost",
]);

/**
 * Slug validation schema:
 * - 3-50 characters
 * - Lowercase alphanumeric + hyphens only
 * - No leading/trailing hyphens
 * - Not a reserved slug
 */
export const SlugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(50, "Slug must be at most 50 characters")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens")
  .refine((slug) => !RESERVED_SLUGS.has(slug), {
    message: "This slug is reserved and cannot be used",
  });

/**
 * Schema for updating storefront settings (slug + publish toggle)
 */
export const UpdateStorefrontSettingsSchema = z.object({
  slug: SlugSchema.optional(),
  isPublished: z.boolean().optional(),
});

export type SlugInput = z.infer<typeof SlugSchema>;
export type UpdateStorefrontSettingsInput = z.infer<typeof UpdateStorefrontSettingsSchema>;

/**
 * Generate a slug suggestion from a business name.
 * Strips special characters, lowercases, converts spaces to hyphens.
 */
export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Replace non-alphanumeric with hyphens
    .replace(/[^a-z0-9]+/g, "-")
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, "")
    // Collapse multiple hyphens
    .replace(/-+/g, "-")
    // Truncate to 50 chars
    .slice(0, 50);
}