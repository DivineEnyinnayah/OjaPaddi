import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const serverEnvSchema = {
  // Optional in Cloudflare Workers (use Hyperdrive binding instead)
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_URL: z.string().min(1).optional(),
  CORS_ORIGIN: z.string().min(1).default("*"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  // Optional — only needed for local storage
  SUPABASE_STORAGE_URL: z.string().url().optional(),
};

type ServerEnv = {
  [K in keyof typeof serverEnvSchema]: z.infer<(typeof serverEnvSchema)[K]>;
};

let envInstance: ServerEnv | null = null;

function getEnv(): ServerEnv {
  if (!envInstance) {
    envInstance = createEnv({
      server: serverEnvSchema,
      runtimeEnv: process.env,
      emptyStringAsUndefined: true,
      skipValidation: !!process.env.SKIP_ENV_VALIDATION || !!process.env.CF_WORKERS,
    }) as ServerEnv;
  }
  return envInstance;
}

export const env = new Proxy({} as ServerEnv, {
  get(_target, prop: string | symbol) {
    return (getEnv() as any)[prop];
  },
});
