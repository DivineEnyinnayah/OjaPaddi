# OjaPaddi — Waitlist

The OjaPaddi waitlist landing page. Visitors drop their name and email, and
each signup lands in a **Google Sheet** you can open anytime and collect from
at the end of the month.

Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Zod ·
googleapis (service account).

---

## Quick start

```bash
bun install
bun run dev
```

Open http://localhost:3000

**Dev mode:** with no Google credentials configured, signups are written to
`data/waitlist.json` (gitignored) so the full flow works locally with zero
setup. The API returns `409` for duplicate emails, `429` past the rate limit,
and renders a friendly success state on submit.

---

## Connect Google Sheets (production)

One-time setup (~5 minutes). You'll need a Google Cloud project.

### 1. Create a spreadsheet

1. Go to https://sheets.new — name it **OjaPaddi Waitlist**.
2. Leave the first row for headers. The app writes them automatically if
   the sheet is blank, but you can pre-fill row 1 with:
   `Timestamp | Name | Email`
3. Copy the spreadsheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit`

### 2. Create a service account

1. Go to https://console.cloud.google.com/apis/credentials
2. Create Credentials → **Service Account** → name it `ojapaddi-waitlist`.
3. Select the account → **Keys** → **Add Key** → **Create new key** →
   **JSON**. A key file downloads. Keep it safe — it's a credential.
4. Enable the Google Sheets API:
   https://console.cloud.google.com/apis/library/sheets.googleapis.com

### 3. Share the sheet with the service account

1. Open your spreadsheet → **Share** (top right).
2. Add the service account email (found in the JSON key file under
   `client_email`, ends in `@<project>.iam.gserviceaccount.com`).
3. Role: **Editor**. Send. No notification needed.

### 4. Configure the app

Create `.env.local` (never commit it):

```env
GOOGLE_SERVICE_ACCOUNT_JSON=./path/to/ojapaddi-waitlist-key.json
WAITLIST_SPREADSHEET_ID=THIS_IS_THE_ID
WAITLIST_SHEET_NAME=Sheet1
```

`GOOGLE_SERVICE_ACCOUNT_JSON` accepts either a file path or the raw JSON
contents of the key file (paste it as a single line, replacing newlines with
`\n` — fine for Vercel env vars).

Restart the dev server, submit the form once — the row appears in your sheet.

---

## Collecting the list at the end of the month

- **Open the sheet** — every signup is a row: `Timestamp | Name | Email`.
- **Export as CSV**: File → Download → Comma-separated values (.csv), or use
  the waitlist's own export: nothing to install, the sheet is the source of
  truth.

---

## Deploying

### Vercel (recommended)

```bash
npx vercel
```

Then set the three env vars in Project → Settings → Environment Variables:
`GOOGLE_SERVICE_ACCOUNT_JSON`, `WAITLIST_SPREADSHEET_ID`,
`WAITLIST_SHEET_NAME`.

> On Vercel, the app fails loudly (500) if storage isn't configured — it will
> never silently drop signups into an ephemeral file. Locally or self-hosted,
> it falls back to `data/waitlist.json` (persistent on disk).

---

## API

`POST /api/waitlist`

```json
{ "name": "Mama Tope", "email": "tope@example.com" }
```

| Status | Meaning |
|--------|---------|
| 201    | Added to the waitlist |
| 400    | Validation error (`error.message` has details) |
| 409    | Email already registered |
| 429    | Rate limited (10/min per IP) |
| 500    | Storage error |

Security notes: rate-limited per IP, honeypot field against bots, zod
validation server-side, service account scoped to spreadsheet write only
(never use a user OAuth token for a deployed site).
