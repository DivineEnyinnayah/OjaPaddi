import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
const serverEnvSchema = {
    // ── SQLite (Turso / libSQL) ───────────────────────────────────────
    // Turso is HTTP-based so the same URL works on Cloudflare Workers and locally.
    // Local dev can point this at a file: URL (e.g. file:local.db) with no auth token.
    TURSO_DATABASE_URL: z.string().min(1),
    TURSO_AUTH_TOKEN: z.string().min(1).optional(),
    // ── Better Auth ───────────────────────────────────────────────────
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().min(1),
    BETTER_AUTH_API_KEY: z.string().min(1),
    // ── Transactional email (password-reset codes) ───────────────────
    // HTTP provider (Resend). Chosen over SMTP because Workers has no outbound
    // TCP — an SMTP transport cannot run there. See packages/auth/src/email.ts.
    EMAIL_API_KEY: z.string().min(1),
    EMAIL_FROM: z.string().min(1),
    // ── Cloudflare R2 (image storage) ─────────────────────────────────
    // Public base URL for the R2 bucket (custom domain or the r2.dev subdomain).
    R2_PUBLIC_URL: z.string().min(1),
    // ── Cloudinary (image storage) ────────────────────────────────────
    // Cloudinary credentials for unsigned/signed uploads.
    CLOUDINARY_CLOUD_NAME: z.string().min(1),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),
    CORS_ORIGIN: z.string().min(1).default("*"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
};
let envInstance = null;
function getEnv() {
    if (!envInstance) {
        envInstance = createEnv({
            server: serverEnvSchema,
            runtimeEnv: process.env,
            emptyStringAsUndefined: true,
            skipValidation: !!process.env.SKIP_ENV_VALIDATION || !!process.env.CF_WORKERS,
        });
    }
    return envInstance;
}
export const env = new Proxy({}, {
    get(_target, prop) {
        return getEnv()[prop];
    },
});
