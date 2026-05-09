import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

// Load .env from apps/server/.env
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../apps/server/.env") });

export const env = createEnv({
	server: {
		DATABASE_URL: z.string(),
		CORS_ORIGIN: z.string(),
		BETTER_AUTH_SECRET: z.string(),
		BETTER_AUTH_URL: z.string(),
		NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
		PORT: z.coerce.number().default(3000),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
