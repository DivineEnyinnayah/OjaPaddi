import type { Database } from "@ojapaddi/db";
import crypto from "node:crypto";
import { account, businesses, user, verification } from "@ojapaddi/db/schema";
import { auth } from "@ojapaddi/auth";
import { and, eq, or, sql } from "drizzle-orm";
import { sendEmail } from "@ojapaddi/auth/email";

/**
 * Raised when a user account exists but has never set a password — the state
 * every user was left in by the Supabase migration, since bcrypt hashes could
 * not be copied out of GoTrue.
 *
 * The route maps this to HTTP 401 with code `PASSWORD_RESET_REQUIRED`, which the
 * mobile app uses to route to the set-password screen.
 */
export class PasswordResetRequiredError extends Error {
  readonly code = "PASSWORD_RESET_REQUIRED";
  constructor(readonly email: string) {
    super("This account has not set a password yet");
    this.name = "PasswordResetRequiredError";
  }
}

/**
 * Auth service — Better Auth behind the legacy REST contract.
 *
 * IMPORTANT CONTRACT NOTE
 * The mobile client persists `refresh_token` and replays it to `/auth/refresh`.
 * Better Auth issues a single long-lived session token rather than a separate
 * access/refresh pair, so both fields carry that same session token. The app
 * needs no changes: `access_token` is used as the Bearer credential and
 * `refresh_token` still re-mints the same credential. This also fixes the old
 * bug where `/auth/refresh` returned camelCase `refreshToken` while the client
 * destructured `refresh_token`, which silently produced `undefined`.
 */

interface RegistrationData {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

interface OnboardingData {
  businessName: string;
  category: string;
  whatsappNumber: string;
  city: string;
  state: string;
}

/** Pulls the profile fields the app hydrates its auth store from. */
async function hydrateProfile(db: Database, userId: string) {
  const [row] = await db
    .select({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      name: user.name,
      plan: user.plan,
      businessName: businesses.name,
      whatsappNumber: businesses.whatsappNumber,
    })
    .from(user)
    .leftJoin(businesses, eq(businesses.userId, user.id))
    .where(eq(user.id, userId))
    .limit(1);

  return {
    id: row?.id ?? userId,
    email: row?.email ?? "",
    fullName: row?.fullName || row?.name || "",
    plan: row?.plan || "free",
    businessName: row?.businessName || "",
    whatsappNumber: row?.whatsappNumber || "",
  };
}

/** Builds the response body the mobile app's `lib/api.ts` expects. */
function authResponse(profile: Awaited<ReturnType<typeof hydrateProfile>>, token: string) {
  return {
    user: profile,
    access_token: token,
    refresh_token: token,
  };
}

export async function completeRegistration(
  db: Database,
  reg: RegistrationData,
  onb?: Partial<OnboardingData>
) {
  const email = reg.email.toLowerCase();

  const existing = await db
    .select({ email: user.email, phone: user.phone })
    .from(user)
    .where(reg.phone ? or(eq(user.email, email), eq(user.phone, reg.phone)) : eq(user.email, email))
    .limit(1);

  if (existing.length > 0) {
    const hasEmail = existing.some((u) => u.email?.toLowerCase() === email);
    if (hasEmail) throw new Error("Email is already registered");
    throw new Error("Phone number is already registered");
  }

  const result = await auth.api.signUpEmail({
    body: {
      email,
      password: reg.password,
      name: reg.fullName,
      fullName: reg.fullName,
      phone: reg.phone,
    },
  });

  const userId = result?.user?.id;
  const token = result?.token;
  if (!userId || !token) throw new Error("User registration failed");

  const businessName = onb?.businessName || `${reg.fullName}'s Shop`;

  try {
    await db.insert(businesses).values({
      userId,
      name: businessName,
      category: onb?.category || null,
      whatsappNumber: onb?.whatsappNumber || null,
      city: onb?.city || null,
      state: onb?.state || null,
    });
  } catch (dbError: unknown) {
    // Compensating rollback: Better Auth already committed the user row, so
    // remove it directly rather than leaving an orphaned account with no
    // business. Deleting `user` cascades to session/account (FK ON DELETE).
    try {
      await db.delete(user).where(eq(user.id, userId));
    } catch {}
    const message = dbError instanceof Error ? dbError.message : String(dbError);
    throw new Error(`Database setup failed: ${message}`);
  }

  return authResponse(
    { id: userId, email, fullName: reg.fullName, plan: "free", businessName, whatsappNumber: onb?.whatsappNumber || "" },
    token
  );
}

export async function loginUser(db: Database, email: string, password: string) {
  const normalizedEmail = email.toLowerCase();

  try {
    const result = await auth.api.signInEmail({
      body: { email: normalizedEmail, password },
    });

    const userId = result?.user?.id;
    const token = result?.token;
    if (!userId || !token) throw new Error("Invalid email or password");

    return authResponse(await hydrateProfile(db, userId), token);
  } catch (e) {
    // Distinguish "this account exists but has never set a password" (our
    // Supabase migration left every user in that state) from a genuine wrong
    // password. The client uses this to route the user to the set-password
    // screen instead of showing a dead end.
    if (await hasPasswordlessAccount(db, normalizedEmail)) {
      throw new PasswordResetRequiredError(normalizedEmail);
    }
    throw e;
  }
}

/**
 * True when a `user` row exists for this email but has no `account` row holding
 * a password — i.e. a migrated user who has not set one yet.
 */
async function hasPasswordlessAccount(db: Database, email: string): Promise<boolean> {
  const [row] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!row) return false;

  const [credential] = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, row.id), eq(account.providerId, "credential")))
    .limit(1);

  return !credential;
}

/**
 * Emails a password-reset code.
 *
 * Bypasses Better Auth's internal background queue to ensure delivery on
 * Cloudflare Workers. Manually manages the verification token.
 */
export async function requestPasswordResetCode(db: Database, email: string) {
  const normalizedEmail = email.toLowerCase();

  const [known] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, normalizedEmail))
    .limit(1);

  if (!known) return;

  // Generate a 6-digit code for the user and a long secure token for the API
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const token = crypto.randomBytes(32).toString("hex");
  const value = `${code}:${token}`;

  // Store in verification table (expires in 10 minutes)
  await db.insert(verification).values({
    id: crypto.randomUUID(),
    identifier: normalizedEmail,
    value,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendEmail({
    to: normalizedEmail,
    subject: "Reset your OjaPaddi password",
    text: [
      "Hi,",
      "",
      "Use this code to set a new password for your OjaPaddi account:",
      "",
      `    ${code}`,
      "",
      "It expires in 10 minutes.",
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
  });
}

/** Validates a reset code and sets the new password. */
export async function resetPassword(db: Database, token: string, newPassword: string) {
  console.log(`[AUTH] Attempting reset with code: ${token}`);
  
  // The 'token' passed from the app is the 6-digit code.
  // We look for a verification record that starts with this code.
  const [v] = await db.select()
    .from(verification)
    .where(and(
      sql`value LIKE ${token + ":%"}`,
      sql`expires_at > ${Date.now()}`
    ))
    .limit(1);

  if (!v) {
    console.error(`[AUTH] No valid verification record found for code: ${token}`);
    throw new Error("Invalid or expired verification code");
  }

  console.log(`[AUTH] Found matching token: ${v.value.split(":")[1].slice(0, 5)}...`);

  const [, longToken] = v.value.split(":");

  try {
    await auth.api.resetPassword({
      body: { token: longToken, newPassword },
    });
    console.log(`[AUTH] Better Auth successfully reset password for ${v.identifier}`);
  } catch (e: any) {
    console.error(`[AUTH] Better Auth rejected token ${longToken.slice(0, 5)}...: ${e.message}`);
    throw e;
  }

  // Cleanup
  await db.delete(verification).where(eq(verification.id, v.id));
}

/**
 * The stored "refresh token" is a live session token, so re-reading the
 * session both validates it and re-issues the current credential.
 */
export async function refreshAccessToken(db: Database, refreshToken: string) {
  const session = await auth.api.getSession({
    headers: new Headers({ Authorization: `Bearer ${refreshToken}` }),
  });

  const userId = session?.user?.id;
  if (!userId) throw new Error("Refresh token invalid or expired");

  const headers = new Headers({ Authorization: `Bearer ${refreshToken}` });
  // Sliding expiry: extend the session on refresh so an active user is never
  // logged out mid-use, matching the previous 30-day rolling window.
  const refreshed = await auth.api.getSession({ headers, query: { disableRefresh: false } });

  const token = refreshed?.session?.token ?? refreshToken;

  return authResponse(await hydrateProfile(db, userId), token);
}

export async function logoutUser(refreshToken: string) {
  try {
    await auth.api.revokeSession({
      body: { token: refreshToken },
      headers: new Headers({ Authorization: `Bearer ${refreshToken}` }),
    });
  } catch {
    // Logging out must be idempotent: a stale or already-revoked token is a
    // successful logout from the client's point of view.
  }
}

/**
 * Issues a password-reset token.
 *
 * NOTE: no email transport is wired up yet, so no message is actually sent.
 * Until `sendResetPassword` is configured, the token is logged server-side so
 * the flow can be exercised. See the migration notes.
 */
// ── Helpers used by the data migration ────────────────────────────────

/** True when a Better Auth credential record already exists for this email. */
export async function userExistsByEmail(db: Database, email: string) {
  const rows = await db.select({ id: user.id }).from(user).where(eq(user.email, email.toLowerCase())).limit(1);
  return rows.length > 0;
}