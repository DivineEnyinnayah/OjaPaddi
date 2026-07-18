import { db } from "@ojapaddi/db";
import { businesses, users } from "@ojapaddi/db/schema";
import { eq, or } from "drizzle-orm";
import { supabase, supabaseAnon } from "../lib/supabase";
import { env } from "@ojapaddi/env/server";

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

export async function completeRegistration(reg: RegistrationData, onb?: Partial<OnboardingData>) {
  console.log("[AUTH] Complete registration attempt for:", reg.email);

  // Check if email or phone is already registered in our database
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
    if (hasEmail) {
      throw new Error("Email is already registered");
    }
    throw new Error("Phone number is already registered");
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: reg.email,
    password: reg.password,
    options: {
      data: {
        full_name: reg.fullName,
        phone: reg.phone,
      },
    },
  });

  if (authError) {
    console.error("[AUTH] Supabase signup failed:", authError.message);
    throw new Error(authError.message);
  }

  const userId = authData.user?.id;
  if (!userId) {
    throw new Error("User registration failed: No user ID returned from Supabase");
  }

  try {
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        email: reg.email,
        fullName: reg.fullName,
        phone: reg.phone || undefined,
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

    console.log("[AUTH] Registration and onboarding completed successfully for:", reg.email);

    return {
      user: {
        id: userId,
        email: reg.email,
        fullName: reg.fullName,
        businessName: onb?.businessName || `${reg.fullName}'s Shop`,
        whatsappNumber: onb?.whatsappNumber || null,
      },
      access_token: authData.session?.access_token,
      refresh_token: authData.session?.refresh_token,
    };
  } catch (dbError: unknown) {
    const message = dbError instanceof Error ? dbError.message : String(dbError);
    const cause = dbError instanceof Error && dbError.cause ? dbError.cause : null;
    console.error("[AUTH] Database transaction failed for user:", reg.email, message);
    if (cause) {
      console.error("[AUTH] DB error cause:", JSON.stringify(cause, null, 2));
    }

    try {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.error("[AUTH] Failed to cleanup Supabase user after DB failure:", deleteError.message);
      } else {
        console.log("[AUTH] Successfully cleaned up orphaned Supabase user:", reg.email);
      }
    } catch (cleanupError) {
      console.error("[AUTH] Exception during Supabase user cleanup:", cleanupError);
    }

    throw new Error(`Database setup failed: ${message}`);
  }
}

export async function loginUser(email: string, password: string) {
  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user || !data.session) {
    throw new Error("Login failed: No user or session returned");
  }

  const userId = data.user.id;

  const [userRow] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      businessName: businesses.name,
      whatsappNumber: businesses.whatsappNumber,
    })
    .from(users)
    .leftJoin(businesses, eq(businesses.userId, users.id))
    .where(eq(users.id, userId));

  return {
    user: {
      id: userId,
      email: data.user.email!,
      fullName: userRow?.fullName || data.user.user_metadata?.full_name || "",
      businessName: userRow?.businessName || "",
      whatsappNumber: userRow?.whatsappNumber || "",
    },
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  };
}

export async function logoutUser(_refreshToken: string) {
  const { error } = await supabaseAnon.auth.signOut({ scope: 'global' });
  if (error) {
    throw new Error(error.message);
  }
}

export async function refreshAccessToken(refreshToken: string) {
  // Direct HTTP call to Supabase Auth refresh endpoint.
  // The SDK's setSession() throws "Auth session missing!" in server contexts
  // because it expects a browser-like session store. The raw API works fine.
  const response = await fetch(
    `${env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: env.SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }
  );

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as any;
    throw new Error(
      err.error_description || err.message || "Refresh token invalid or expired"
    );
  }

  const session = (await response.json()) as any;

  if (!session.access_token) {
    throw new Error("Refresh failed: No session returned");
  }

  const userId: string | undefined = session.user?.id;
  let userName = session.user?.user_metadata?.full_name || "";
  let businessName = "";
  let whatsappNumber = "";

  if (userId) {
    const [userRow] = await db
      .select({
        fullName: users.fullName,
        businessName: businesses.name,
        whatsappNumber: businesses.whatsappNumber,
      })
      .from(users)
      .leftJoin(businesses, eq(businesses.userId, users.id))
      .where(eq(users.id, userId));

    if (userRow) {
      userName = userRow.fullName || userName;
      businessName = userRow.businessName || "";
      whatsappNumber = userRow.whatsappNumber || "";
    }
  }

  return {
    user: {
      id: userId,
      email: session.user?.email || "",
      fullName: userName,
      businessName,
      whatsappNumber,
    },
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  };
}

export async function forgotPassword(email: string) {
  const { error } = await supabaseAnon.auth.resetPasswordForEmail(email);
  if (error) {
    throw new Error(error.message);
  }
}

export async function resetPassword(_token: string, newPassword: string) {
  const { error } = await supabaseAnon.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(error.message);
  }
}
