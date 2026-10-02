import { z } from "zod";

export const RegistrationSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const OnboardingSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  category: z.string().min(1, "Category is required"),
  whatsappNumber: z.string().regex(/^\d{10,15}$/, "Enter a valid WhatsApp number"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const CompleteRegistrationSchema = z.object({
  registration: RegistrationSchema,
  onboarding: OnboardingSchema.partial().optional(),
});

export const RefreshTokenSchema = z.object({
  refresh_token: z.string().min(1, "Refresh token is required"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  new_password: z.string().min(8, "New password must be at least 8 characters"),
});
