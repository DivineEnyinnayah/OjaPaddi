import { env } from "@ojapaddi/env/server";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
let clientInstance = null;
/**
 * Returns the shared libSQL client.
 *
 * libSQL speaks HTTP/WebSocket, so there is no connection pool to manage and the
 * same client works unchanged on Cloudflare Workers and in local Node dev.
 * A `file:` URL (e.g. `file:local.db`) makes this a plain local SQLite file.
 */
export function getClient() {
    return (clientInstance ??= createClient({
        url: env.TURSO_DATABASE_URL,
        authToken: env.TURSO_AUTH_TOKEN,
    }));
}
/** Creates a Database instance bound to the shared client. */
export function createDb() {
    return drizzle(getClient(), { schema });
}
