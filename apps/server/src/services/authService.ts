import { createClient } from "@supabase/supabase-js";
import { env } from "@ojapaddi/env/server";
import { db } from "@ojapaddi/db";
import { businesses, users } from "@ojapaddi/db/schema";

const supabase = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL!,
  env.SUPABASE_SERVICE_ROLE_KEY!
);

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

export async function completeRegistration(reg: RegistrationData, onb: OnboardingData) {
  console.log("[AUTH] Complete registration attempt for:", reg.email);
  
  // 1. Supabase Signup
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

  // 2. Database inserts in a transaction
  try {
    await db.transaction(async (tx) => {
      // Insert user
      await tx.insert(users).values({
        id: userId,
        email: reg.email,
        fullName: reg.fullName,
        phone: reg.phone || undefined,
      });

      // Insert business
      await tx.insert(businesses).values({
        userId: userId,
        name: onb.businessName,
        category: onb.category,
        whatsappNumber: onb.whatsappNumber,
        city: onb.city,
        state: onb.state,
      });
    });

    console.log("[AUTH] Registration and onboarding completed successfully for:", reg.email);

    return {
      userId,
      email: reg.email,
      fullName: reg.fullName,
      accessToken: authData.session?.access_token,
      refreshToken: authData.session?.refresh_token
    };
  } catch (dbError: any) {
    console.error("[AUTH] Database transaction failed for user:", reg.email, dbError);
    // In case DB transaction fails after Supabase signup, we should ideally 
    // clean up the Supabase user, but for now, we just throw error.
    throw new Error(`Database setup failed: ${dbError.message}`);
  }
}

export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user || !data.session) {
    throw new Error("Login failed: No user or session returned");
  }

  return {
    user: data.user,
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  };
}

export async function logoutUser(_refreshToken: string) {
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) {
    throw new Error(error.message);
  }
}

export async function refreshAccessToken(refreshToken: string) {
  const { data, error } = await supabase.auth.setSession({
    access_token: "", // We only have the refresh token
    refresh_token: refreshToken,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session) {
    throw new Error("Refresh failed: No session returned");
  }

  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  };
}

export async function forgotPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) {
    throw new Error(error.message);
  }
}

export async function resetPassword(_token: string, newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(error.message);
  }
}
