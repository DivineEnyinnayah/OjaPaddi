import { env } from "@ojapaddi/env/server";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 1,
});

export function createDb() {
  return drizzle(pool, { schema });
}

export const db = createDb();
