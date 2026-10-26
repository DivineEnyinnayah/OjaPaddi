import { promises as fs } from "node:fs";
import path from "node:path";
/**
 * Local JSON fallback — used for development when Google Sheets
 * credentials are not configured. Writes to data/waitlist.json
 * (gitignored). Swap to the Sheets backend in production.
 */
const FILE = path.join(process.cwd(), "data", "waitlist.json");
async function readAll() {
    try {
        const raw = await fs.readFile(FILE, "utf8");
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
}
export const localBackend = {
    async hasEmail(email) {
        const all = await readAll();
        return all.some((e) => e.email === email);
    },
    async append(entry) {
        const all = await readAll();
        all.push(entry);
        await fs.mkdir(path.dirname(FILE), { recursive: true });
        await fs.writeFile(FILE, JSON.stringify(all, null, 2) + "\n", "utf8");
    },
};
