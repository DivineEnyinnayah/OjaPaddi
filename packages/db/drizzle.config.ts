import { defineConfig } from "drizzle-kit";

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("DATABASE_URL or DIRECT_URL must be set (loaded via --env-file=apps/server/.env)");
}

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});
