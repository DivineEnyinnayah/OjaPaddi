
import * as schema from "./schema";

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { env } from "@ojapaddi/env/server";

export function createDb() {
	const sql = neon(env.DATABASE_URL || "");
	return drizzle(sql, { schema });
}
