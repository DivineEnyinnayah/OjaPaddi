/**
 * One-time image migration: Supabase Storage -> Cloudflare R2.
 *
 *   pnpm --filter @ojapaddi/server migrate:images
 *   pnpm --filter @ojapaddi/server migrate:images -- --dry-run
 *
 * Products store `image_url` as a *storage key* (e.g.
 * `products/<businessId>/<file>.jpg`), not a URL — `resolveImageUrl` prefixes it
 * with R2_PUBLIC_URL on read. Because the R2 bucket uses the same key namespace,
 * this script copies the bytes across WITHOUT rewriting any database rows.
 *
 * R2 access goes through the Wrangler CLI so no extra AWS SDK dependency and no
 * hand-rolled SigV4 signing is needed.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { execFileSync } from "child_process";
import { tmpdir } from "os";
import { join } from "path";
import { getClient } from "@ojapaddi/db";
// pnpm forwards a bare "--" through to the script, so filter it out rather
// than relying on exact argv contents.
const ARGS = process.argv.slice(2).filter((a) => a !== "--");
const DRY_RUN = ARGS.includes("--dry-run");
const ROOT = new URL("../../../../", import.meta.url).pathname;
for (const f of ["apps/server/.env", "apps/server/.dev.vars", ".env", ".env.local"]) {
    try {
        for (const line of readFileSync(ROOT + f, "utf8").split("\n")) {
            const m = line.match(/^([A-Z_]+)=(.*)$/);
            if (m && process.env[m[1]] === undefined) {
                process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
            }
        }
    }
    catch {
        /* optional */
    }
}
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "products";
const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "ojapaddi-images";
// @ojapaddi/db validates the whole env on first use; this script only needs the
// database, so give the other required vars inert values if they're absent.
process.env.R2_PUBLIC_URL ??= "http://localhost:8787/ojapaddi-images";
process.env.BETTER_AUTH_SECRET ??= "migration-only-secret-at-least-32-chars";
process.env.BETTER_AUTH_URL ??= "http://localhost:3001";
if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
    process.exit(1);
}
const MIME = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif",
};
function contentTypeFor(key) {
    const ext = key.split(".").pop()?.toLowerCase() ?? "";
    return MIME[ext] ?? "application/octet-stream";
}
const workDir = join(tmpdir(), "ojapaddi-image-migration");
mkdirSync(workDir, { recursive: true });
const db = getClient();
async function main() {
    const rows = await db.execute({
        sql: `SELECT id, name, image_url FROM products WHERE image_url IS NOT NULL`,
    });
    // Only keys need migrating. Absolute URLs are either already public or
    // expired signed links that we cannot meaningfully copy.
    const keys = rows.rows
        .map((r) => ({ id: r.id, name: r.name, url: String(r.image_url) }))
        .filter((r) => !r.url.startsWith("http"));
    const external = rows.rows.length - keys.length;
    console.log(`${DRY_RUN ? "DRY RUN — no uploads" : "MIGRATING"}: Supabase Storage -> R2\n` +
        `  ${keys.length} storage key(s) to copy` +
        (external > 0 ? `, ${external} already an absolute URL (left untouched)` : "") +
        `\n  source bucket: ${BUCKET}   target bucket: ${R2_BUCKET}\n`);
    if (keys.length === 0) {
        console.log("Nothing to migrate.");
        return;
    }
    let copied = 0;
    const failed = [];
    for (const row of keys) {
        const key = row.url;
        process.stdout.write(`  ${key} ... `);
        try {
            // The Supabase buckets were private, so the service-role key is required.
            const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(key)}`, {
                headers: {
                    Authorization: `Bearer ${SERVICE_KEY}`,
                    apikey: SERVICE_KEY,
                },
            });
            if (!res.ok) {
                failed.push({ key, reason: `HTTP ${res.status}` });
                console.log(`FAILED (HTTP ${res.status})`);
                continue;
            }
            const bytes = Buffer.from(await res.arrayBuffer());
            const tmpFile = join(workDir, key.replace(/[^\w.-]+/g, "_"));
            writeFileSync(tmpFile, bytes);
            if (DRY_RUN) {
                console.log(`would copy ${bytes.length} bytes`);
                copied++;
                continue;
            }
            execFileSync("npx", ["wrangler", "r2", "object", "put", R2_BUCKET, key, "--file", tmpFile, "--content-type", contentTypeFor(key)], { stdio: ["ignore", "ignore", "pipe"], cwd: ROOT });
            rmSync(tmpFile, { force: true });
            copied++;
            console.log(`copied ${bytes.length} bytes`);
        }
        catch (e) {
            failed.push({ key, reason: e?.message?.slice(0, 120) ?? String(e) });
            console.log(`FAILED (${e?.message?.slice(0, 80) ?? e})`);
        }
    }
    console.log(`\n${DRY_RUN ? "[dry run] " : ""}copied ${copied}/${keys.length}`);
    if (failed.length > 0) {
        console.error(`\n✗ ${failed.length} failed:`);
        for (const f of failed)
            console.error(`   - ${f.key}: ${f.reason}`);
    }
    if (!DRY_RUN && copied > 0) {
        console.log(`\n✓ ${copied} object(s) now in R2 under their original keys.\n` +
            `  No database rows were changed — image_url already stores the bare key.`);
    }
    if (failed.length > 0)
        process.exit(1);
}
main()
    .catch((e) => {
    console.error("\n✗ Image migration failed:", e?.message ?? e);
    process.exit(1);
})
    .finally(async () => {
    if (existsSync(workDir))
        rmSync(workDir, { recursive: true, force: true });
    await db.close();
});
