import { readFileSync } from "node:fs";
import { google, sheets_v4 } from "googleapis";
import type { WaitlistBackend, WaitlistEntry } from "./types";

/**
 * Google Sheets backend — production storage for the waitlist.
 *
 * Requires env vars:
 *   GOOGLE_SERVICE_ACCOUNT_JSON — path to the service account key file,
 *     OR the raw JSON contents of the key file.
 *   WAITLIST_SPREADSHEET_ID   — the long ID from the spreadsheet URL.
 *   WAITLIST_SHEET_NAME       — tab name (defaults to "Sheet1").
 *
 * The spreadsheet must be shared with the service account email
 * (role: Editor) so the app can append rows.
 */

const SHEET_NAME = process.env.WAITLIST_SHEET_NAME ?? "Sheet1";
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function loadCredentials(): { clientEmail: string; privateKey: string } {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON is not set — cannot use the Sheets backend."
    );
  }

  let parsed: unknown;
  // Accept either a file path or the raw JSON contents.
  if (
    raw.trim().startsWith("{") ||
    raw.includes("\\n") ||
    raw.includes("private_key")
  ) {
    parsed = JSON.parse(raw);
  } else {
    parsed = JSON.parse(readFileSync(raw, "utf8"));
  }

  const obj = parsed as {
    client_email?: string;
    private_key?: string;
  };
  if (!obj.client_email || !obj.private_key) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email or private_key."
    );
  }
  return { clientEmail: obj.client_email, privateKey: obj.private_key };
}

let clientPromise: Promise<sheets_v4.Sheets> | null = null;

function getClient(): Promise<sheets_v4.Sheets> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const { clientEmail, privateKey } = loadCredentials();
      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: SCOPES,
      });
      const sheets = google.sheets({ version: "v4", auth });
      await ensureHeader(sheets);
      return sheets;
    })();
  }
  return clientPromise;
}

/** Writes the header row if the sheet is blank — makes the site
 *  self-healing for a freshly created spreadsheet. */
async function ensureHeader(sheets: sheets_v4.Sheets) {
  const spreadsheetId = requireSpreadsheetId();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A1:C1`,
  });
  const values = res.data.values;
  if (!values || values.length === 0 || !values[0]?.some(Boolean)) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A1:C1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [["Timestamp", "Name", "Email"]],
      },
    });
  }
}

function requireSpreadsheetId(): string {
  const id = process.env.WAITLIST_SPREADSHEET_ID;
  if (!id) {
    throw new Error(
      "WAITLIST_SPREADSHEET_ID is not set — cannot use the Sheets backend."
    );
  }
  return id;
}

export const sheetsBackend: WaitlistBackend = {
  async hasEmail(email) {
    const sheets = await getClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: requireSpreadsheetId(),
      range: `${SHEET_NAME}!C2:C100000`,
    });
    const emails = (res.data.values ?? [])
      .flat()
      .map((e) => String(e).trim().toLowerCase());
    return emails.includes(email);
  },

  async append(entry: WaitlistEntry) {
    const sheets = await getClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: requireSpreadsheetId(),
      range: `${SHEET_NAME}!A:C`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [[entry.createdAt, entry.name, entry.email]],
      },
    });
  },
};
