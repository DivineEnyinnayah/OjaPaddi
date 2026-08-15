import { z } from "zod";

export const waitlistSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name (at least 2 characters).")
    .max(100, "That name looks a bit long — 100 characters max."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address."),
  // Honeypot field. Bots fill it; humans never see it.
  company: z.string().max(500).optional(),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
