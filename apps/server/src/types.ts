import type { Database } from "@ojapaddi/db";
import type { User } from "@supabase/supabase-js";

export type Bindings = {
  HYPERDRIVE: {
    connectionString: string;
  };
  EXPO_PUBLIC_SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  CORS_ORIGIN: string;
  [key: string]: any;
};

export type Variables = {
  db: Database;
  user: User;
  businessId: string;
  validatedBody: any;
};

export type HonoEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
