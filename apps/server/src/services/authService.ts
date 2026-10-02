import type { Database } from "@ojapaddi/db";
import { businesses, users, refreshTokens } from "@ojapaddi/db/schema";
import { eq, and, or, lt } from "drizzle-orm";
import { supabase, supabaseAnon } from "../lib/supabase";
import { createHash } from "crypto";

// ── Refresh Token Helpers ──────────────────────────────────────────────

const TOKEN_EXPIRY_DAYS = 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function storeRefreshToken(db: Database, userId: string, refreshToken: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(refreshToken),
    expiresAt,
  });
}

async function verifyAndRotateRefreshToken(
  db: Database,
  userId: string,
  oldRefreshToken: string,
  newRefreshToken: string
): Promise<boolean> {
  const oldHash = hashToken(oldRefreshToken);
  const newHash = hashToken(newRefreshToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

  const deleted = await db
    .delete(refreshTokens)
    .where(and(eq(refreshTokens.userId, userId), eq(refreshTokens.tokenHash, oldHash)))
    .returning();

  if (deleted.length === 0) {
    return false;
  }

  await db.insert(refreshTokens).values({
    userId,
    tokenHash: newHash,
    expiresAt,
  });

  return true;
}

async function revokeRefreshToken(db: Database, refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
}

async function cleanupExpiredTokens(db: Database) {
  await db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, new Date()));
}

// ── Auth Service ──────────────────────────────────────────────────────

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

export async function completeRegistration(db: Database, reg: RegistrationData, onb?: Partial<OnboardingData>) {
  const existingUsers = await db
    .select({ email: users.email, phone: users.phone })
    .from(users)
    .where(
      reg.phone
        ? or(eq(users.email, reg.email), eq(users.phone, reg.phone))
        : eq(users.email, reg.email)
    );

  if (existingUsers.length > 0) {
    const hasEmail = existingUsers.some(u => u.email.toLowerCase() === reg.email.toLowerCase());
    if (hasEmail) throw new Error("Email is already registered");
    throw new Error("Phone number is already registered");
  }

  const { data, error: authError } = await supabase.auth.signUp({
    email: reg.email,
    password: reg.password,
    options: {
      data: {
        full_name: reg.fullName,
        phone: reg.phone,
      },
    },
  });

  if (authError) throw new Error(authError.message);

  const userId = data.user?.id;
  if (!userId) throw new Error("User registration failed: No user ID returned from Supabase");

  try {
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        email: reg.email,
        fullName: reg.fullName,
        phone: reg.phone || undefined,
        plan: 'free',
      });

      await tx.insert(businesses).values({
        userId: userId,
        name: onb?.businessName || `${reg.fullName}'s Shop`,
        category: onb?.category || null,
        whatsappNumber: onb?.whatsappNumber || null,
        city: onb?.city || null,
        state: onb?.state || null,
      });
    });

    if (data.session?.refresh_token) {
      await storeRefreshToken(db, userId, data.session.refresh_token);
    }

    return {
      user: {
        id: userId,
        email: reg.email,
        fullName: reg.fullName,
        plan: 'free' as const,
        businessName: onb?.businessName || `${reg.fullName}'s Shop`,
        whatsappNumber: onb?.whatsappNumber || null,
      },
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
    };
  } catch (dbError: unknown) {
    const message = dbError instanceof Error ? dbError.message : String(dbError);
    try { await supabase.auth.admin.deleteUser(userId); } catch {}
    throw new Error(`Database setup failed: ${message}`);
  }
}

export async function loginUser(db: Database, email: string, password: string) {
  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!data.user || !data.session) throw new Error("Login failed: No user or session returned");

  const userId = data.user.id;

  const [userRow] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      plan: users.plan,
      businessName: businesses.name,
      whatsappNumber: businesses.whatsappNumber,
    })
    .from(users)
    .leftJoin(businesses, eq(businesses.userId, users.id))
    .where(eq(users.id, userId));

  if (data.session.refresh_token) {
    await storeRefreshToken(db, userId, data.session.refresh_token);
  }

  return {
    user: {
      id: userId,
      email: data.user.email!,
      fullName: userRow?.fullName || data.user.user_metadata?.full_name || "",
      plan: userRow?.plan || 'free',
      businessName: userRow?.businessName || "",
      whatsappNumber: userRow?.whatsappNumber || "",
    },
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  };
}

export async function logoutUser(db: Database, refreshToken: string) {
  await revokeRefreshToken(db, refreshToken);
  const { error } = await supabaseAnon.auth.signOut({ scope: "global" });
  if (error) throw new Error(error.message);
}

export async function refreshAccessToken(db: Database, refreshToken: string) {
  await cleanupExpiredTokens(db).catch(() => {});

  const tokenHash = hashToken(refreshToken);
  const [existingToken] = await db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));

  if (!existingToken) throw new Error("Refresh token invalid or expired");

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }
  );

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as any;
    throw new Error(err.error_description || err.message || "Refresh token invalid or expired");
  }

  const session = (await response.json()) as any;
  if (!session.access_token) throw new Error("Refresh failed: No session returned");

  const userId: string | undefined = session.user?.id;
  let userName = session.user?.user_metadata?.full_name || "";
  let businessName = "";
  let whatsappNumber = "";
  let plan = 'free';

  if (userId) {
    const [userRow] = await db
      .select({
        fullName: users.fullName,
        plan: users.plan,
        businessName: businesses.name,
        whatsappNumber: businesses.whatsappNumber,
      })
      .from(users)
      .leftJoin(businesses, eq(businesses.userId, users.id))
      .where(eq(users.id, userId));

    if (userRow) {
      userName = userRow.fullName || userName;
      plan = userRow.plan || 'free';
      businessName = userRow.businessName || "";
      whatsappNumber = userRow.whatsappNumber || "";
    }
  }

  const newRefreshToken = session.refresh_token;
  if (userId && newRefreshToken) {
    const rotated = await verifyAndRotateRefreshToken(db, userId, refreshToken, newRefreshToken);
    if (!rotated) throw new Error("Refresh token rotation failed");
  }

  return {
    user: {
      id: userId,
      email: session.user?.email || "",
      fullName: userName,
      plan,
      businessName,
      whatsappNumber,
    },
    access_token: session.access_token,
    refresh_token: newRefreshToken,
  };
}

export async function forgotPassword(email: string) {
  const { error } = await supabaseAnon.auth.resetPasswordForEmail(email);
  if (error) throw new Error(error.message);
}

export async function resetPassword(token: string, newPassword: string) {
  const { data, error: verifyError } = await supabaseAnon.auth.verifyOtp({
    token_hash: token,
    type: "recovery",
  });

  if (verifyError || !data.user) throw new Error(verifyError?.message || "Invalid or expired reset token");

  const { error } = await supabase.auth.admin.updateUserById(data.user.id, {
    password: newPassword,
  });

  if (error) throw new Error(error.message);
}
