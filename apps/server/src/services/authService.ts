import { createClient } from "@supabase/supabase-js";
import { env } from "@ojapaddi/env/server";
import { db } from "@ojapaddi/db";
import { businesses } from "@ojapaddi/db/schema";

const supabase = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL!,
  env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function registerUser(data: {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
        phone: data.phone,
      },
    },
  });

  if (authError) {
    throw new Error(authError.message);
  }

  const userId = authData.user?.id;
  if (!userId) {
    throw new Error("User registration failed: No user ID returned");
  }

  // Auto-create business shell as per PRD
  await db.insert(businesses).values({
    userId: userId,
    name: `${data.fullName}'s Business`,
  });

  return { 
    userId, 
    email: data.email, 
    fullName: data.fullName,
    accessToken: authData.session?.access_token,
    refreshToken: authData.session?.refresh_token
  };
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
  // In Supabase, password reset is usually handled via a link that sets the session.
  // This implementation assumes the token is passed through.
  // Note: This might need adjustment based on how the frontend handles the reset flow.
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(error.message);
  }
}
