import { defineConfig } from "drizzle-kit";

const dbUrl = process.env.TURSO_DATABASE_URL;

if (!dbUrl) {
  throw new Error("TURSO_DATABASE_URL must be set (loaded via --env-file=apps/server/.env)");
}

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "turso",
  dbCredentials: {
    url: dbUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});