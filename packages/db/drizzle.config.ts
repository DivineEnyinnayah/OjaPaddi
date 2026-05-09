import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres:tLxj4cxKUraXMaeX@db.obtteivclhfwlucwrtsf.supabase.co:5432/postgres",
  },
});
