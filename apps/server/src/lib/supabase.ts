import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazy-initialized clients for Cloudflare Workers (binding-based)
let supabaseClient: SupabaseClient | null = null;
let supabaseAnonClient: SupabaseClient | null = null;

function getSupabaseUrl(): string {
  return process.env.EXPO_PUBLIC_SUPABASE_URL || "";
}

function getServiceRoleKey(): string {
  // In Cloudflare Workers, secrets come from process.env via nodejs_compat_populate_process_env
  // In local dev, they come from .env via the env package
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

function getAnonKey(): string {
  return process.env.SUPABASE_ANON_KEY || "";
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!supabaseClient) {
      supabaseClient = createClient(getSupabaseUrl(), getServiceRoleKey());
    }
    return (supabaseClient as any)[prop];
  },
});

export const supabaseAnon = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!supabaseAnonClient) {
      supabaseAnonClient = createClient(getSupabaseUrl(), getAnonKey());
    }
    return (supabaseAnonClient as any)[prop];
  },
});
