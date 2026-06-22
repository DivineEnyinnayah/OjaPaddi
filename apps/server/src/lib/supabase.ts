import { createClient } from "@supabase/supabase-js";
import { env } from "@ojapaddi/env/server";

export const supabase = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

export const supabaseAnon = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.SUPABASE_ANON_KEY
);
