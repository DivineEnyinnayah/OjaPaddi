import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer, emailOTP } from "better-auth/plugins";
import { env } from "@ojapaddi/env/server";
import { createDb } from "@ojapaddi/db";
import * as schema from "@ojapaddi/db/schema";
import { sendEmail } from "./email";
import { dash } from "@better-auth/infra"

/**
 * Better Auth instance.
 *
 * The mobile app already sends `Authorization: Bearer <token>` and knows how to
 * refresh on a 401, so the `bearer` plugin exposes session tokens over that
 * header instead of forcing a cookie-based rewrite of `apps/native/lib/api.ts`.
 *
 * SQLite has no native decimal type, so money is TEXT end to end (see the
 * schema comments) — that is a storage concern only and does not change the
 * REST contract.
 */
export const auth = betterAuth({
  appName: "OjaPaddi",
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,


  database: drizzleAdapter(createDb(), {
    provider: "sqlite",
    schema,
  }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days, matching the old TOKEN_EXPIRY_DAYS
    updateAge: 60 * 60 * 24, // rotate a day in
  },

  advanced: {
    // Native clients are not browsers and cannot hold cookies safely.
    useSecureCookies: false,
    cookiePrefix: "ojapaddi",
  },

  user: {
    additionalFields: {
      fullName: { type: "string", required: false },
      phone: { type: "string", required: false },
      plan: { type: "string", required: false, defaultValue: "free" },
      planExpiresAt: { type: "date", required: false },
    },
  },

  // Mobile requests arrive without an Origin header, so trusted origins are
  // only meaningful for the web/dashboard surfaces.
  trustedOrigins: [env.CORS_ORIGIN].flatMap((o) =>
    o
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  ),

  plugins: [
    bearer(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "forget-password") {
          await sendEmail({
            to: email,
            subject: "Reset your OjaPaddi password",
            text: [
              "Hi,",
              "",
              "Use this code to set a new password for your OjaPaddi account:",
              "",
              `    ${otp}`,
              "",
              "It expires in 10 minutes.",
              "",
              "If you did not request this, you can ignore this email.",
            ].join("\n"),
          });
        }
      },
      // Security Hardening
      otpLength: 6,
      expiresIn: 600, // 10 minutes
      allowedAttempts: 3, // Prevent brute force
    }),
    dash({ apiKey: env.BETTER_AUTH_API_KEY }),
  ],
});

export type Auth = typeof auth;
