import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { env } from "@ojapaddi/env/server";
import { createDb } from "@ojapaddi/db";
import * as schema from "@ojapaddi/db/schema";
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
    // Passwords are hashed by Better Auth (bcrypt) into `account.password`.
    // There is no plaintext or legacy hash to migrate.
    autoSignIn: true,
    /**
     * Delivers password-reset codes.
     *
     * This is the only way a user migrated from Supabase can set their first
     * password, so it must be wired to a real transport — the code is the sole
     * proof that the requester controls the inbox.
     */
    sendResetPassword: async ({ user, token }) => {
      // We derive a 6-digit code from the token to keep the UX consistent
      // while using Better Auth's secure token for the actual reset.
      const code = token.slice(0, 6).toUpperCase();
      
      await sendEmail({
        to: user.email,
        subject: "Reset your OjaPaddi password",
        text: [
          "Hi,",
          "",
          "Use this code to set a new password for your OjaPaddi account:",
          "",
          `    ${code}`,
          "",
          "It expires in 10 minutes.",
          "",
          "If you did not request this, you can ignore this email.",
        ].join("\n"),
      });
    },
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
    dash({ apiKey: env.BETTER_AUTH_API_KEY }),
  ],
});

export type Auth = typeof auth;
