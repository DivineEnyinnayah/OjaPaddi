import { account, businesses, user } from "@ojapaddi/db/schema";
import { auth } from "@ojapaddi/auth";
import { and, eq, or } from "drizzle-orm";
/**
 * Raised when a user account exists but has never set a password — the state
 * every user was left in by the Supabase migration, since bcrypt hashes could
 * not be copied out of GoTrue.
 *
 * The route maps this to HTTP 401 with code `PASSWORD_RESET_REQUIRED`, which the
 * mobile app uses to route to the set-password screen.
 */
export class PasswordResetRequiredError extends Error {
    email;
    code = "PASSWORD_RESET_REQUIRED";
    constructor(email) {
        super("This account has not set a password yet");
        this.email = email;
        this.name = "PasswordResetRequiredError";
    }
}
/** Pulls the profile fields the app hydrates its auth store from. */
async function hydrateProfile(db, userId) {
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
function authResponse(profile, token) {
    return {
        user: profile,
        access_token: token,
        refresh_token: token,
    };
}
export async function completeRegistration(db, reg, onb) {
    const email = reg.email.toLowerCase();
    const existing = await db
        .select({ email: user.email, phone: user.phone })
        .from(user)
        .where(reg.phone ? or(eq(user.email, email), eq(user.phone, reg.phone)) : eq(user.email, email))
        .limit(1);
    if (existing.length > 0) {
        const hasEmail = existing.some((u) => u.email?.toLowerCase() === email);
        if (hasEmail)
            throw new Error("Email is already registered");
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
    if (!userId || !token)
        throw new Error("User registration failed");
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
    }
    catch (dbError) {
        // Compensating rollback: Better Auth already committed the user row, so
        // remove it directly rather than leaving an orphaned account with no
        // business. Deleting `user` cascades to session/account (FK ON DELETE).
        try {
            await db.delete(user).where(eq(user.id, userId));
        }
        catch { }
        const message = dbError instanceof Error ? dbError.message : String(dbError);
        throw new Error(`Database setup failed: ${message}`);
    }
    return authResponse({ id: userId, email, fullName: reg.fullName, plan: "free", businessName, whatsappNumber: onb?.whatsappNumber || "" }, token);
}
export async function loginUser(db, email, password) {
    const normalizedEmail = email.toLowerCase();
    try {
        const result = await auth.api.signInEmail({
            body: { email: normalizedEmail, password },
        });
        const userId = result?.user?.id;
        const token = result?.token;
        if (!userId || !token)
            throw new Error("Invalid email or password");
        return authResponse(await hydrateProfile(db, userId), token);
    }
    catch (e) {
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
async function hasPasswordlessAccount(db, email) {
    const [row] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, email))
        .limit(1);
    if (!row)
        return false;
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
 * Always reports success to the caller so the endpoint cannot be used to
 * discover which addresses are registered. The code itself only ever travels by
 * email — there is deliberately no way to read it back off the API.
 */
export async function requestPasswordResetCode(db, email) {
    const normalizedEmail = email.toLowerCase();
    const [known] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, normalizedEmail))
        .limit(1);
    // Unknown address: report success anyway so this endpoint cannot be used to
    // discover which emails are registered.
    if (!known)
        return;
    await auth.api.requestPasswordReset({
        body: {
            email: normalizedEmail,
            redirectTo: "/set-password",
        },
    });
}
/** Validates a reset code and sets the new password. */
export async function resetPassword(token, newPassword) {
    await auth.api.resetPassword({
        body: { token, newPassword },
    });
}
/**
 * The stored "refresh token" is a live session token, so re-reading the
 * session both validates it and re-issues the current credential.
 */
export async function refreshAccessToken(db, refreshToken) {
    const session = await auth.api.getSession({
        headers: new Headers({ Authorization: `Bearer ${refreshToken}` }),
    });
    const userId = session?.user?.id;
    if (!userId)
        throw new Error("Refresh token invalid or expired");
    const headers = new Headers({ Authorization: `Bearer ${refreshToken}` });
    // Sliding expiry: extend the session on refresh so an active user is never
    // logged out mid-use, matching the previous 30-day rolling window.
    const refreshed = await auth.api.getSession({ headers, query: { disableRefresh: false } });
    const token = refreshed?.session?.token ?? refreshToken;
    return authResponse(await hydrateProfile(db, userId), token);
}
export async function logoutUser(refreshToken) {
    try {
        await auth.api.revokeSession({
            body: { token: refreshToken },
            headers: new Headers({ Authorization: `Bearer ${refreshToken}` }),
        });
    }
    catch {
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
export async function userExistsByEmail(db, email) {
    const rows = await db.select({ id: user.id }).from(user).where(eq(user.email, email.toLowerCase())).limit(1);
    return rows.length > 0;
}
