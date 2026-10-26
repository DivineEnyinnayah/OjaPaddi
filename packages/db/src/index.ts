import { env } from "@ojapaddi/env/server";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient, type Client } from "@libsql/client";
import * as schema from "./schema";

export type Database = LibSQLDatabase<typeof schema>;

let clientInstance: Client | null = null;

/**
 * Returns the shared libSQL client.
 *
 * libSQL speaks HTTP/WebSocket, so there is no connection pool to manage and the
 * same client works unchanged on Cloudflare Workers and in local Node dev.
 * A `file:` URL (e.g. `file:local.db`) makes this a plain local SQLite file.
 */
export function getClient(): Client {
  return (clientInstance ??= createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  }));
}

/** Creates a Database instance bound to the shared client. */
export function createDb(): Database {
  return drizzle(getClient(), { schema });
}