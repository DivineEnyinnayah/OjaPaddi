import { localBackend } from "./local-backend";
import { sheetsBackend } from "./sheets-backend";
import type { WaitlistBackend } from "./types";

/**
 * Picks the storage backend:
 *  - Google Sheets when credentials are configured (production).
 *  - Local JSON file otherwise — safe for dev and self-hosted runs
 *    (data/waitlist.json persists on disk).
 *  - On Vercel/serverless (ephemeral FS) with no Sheets config, fail
 *    loudly instead of silently dropping signups on every redeploy.
 */
export function getBackend(): WaitlistBackend {
  const hasSheetsConfig =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON &&
    process.env.WAITLIST_SPREADSHEET_ID;

  if (hasSheetsConfig) {
    return sheetsBackend;
  }
  if (process.env.VERCEL) {
    throw new Error(
      "Waitlist storage is not configured: set GOOGLE_SERVICE_ACCOUNT_JSON and WAITLIST_SPREADSHEET_ID."
    );
  }
  return localBackend;
}
