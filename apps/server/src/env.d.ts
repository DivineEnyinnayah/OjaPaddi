// Cloudflare Worker environment declarations
// This file tells TypeScript about the bindings available in Workers

interface CfEnv {
  // Bindings
  HYPERDRIVE: {
    connectionString: string;
  };

  // Vars (from wrangler.json)
  CORS_ORIGIN: string;
  EXPO_PUBLIC_SUPABASE_URL: string;

  // Secrets (set via `wrangler secret put`)
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends CfEnv {}
  }
}

export {};
