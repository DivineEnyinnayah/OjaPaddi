import type { Database } from "@ojapaddi/db";
import type { R2BucketLike } from "./services/storageService";

export type Bindings = {
  CORS_ORIGIN: string;
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN?: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  R2_PUBLIC_URL: string;
  /** R2 bucket binding for product images and shop logos. */
  IMAGES: R2BucketLike;
  [key: string]: any;
};

/** The authenticated user, as resolved from the Better Auth session. */
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  fullName?: string | null;
  phone?: string | null;
  plan: string;
  image?: string | null;
  emailVerified: boolean;
};

export type Variables = {
  db: Database;
  user: AuthUser;
  businessId: string;
  validatedBody: any;
};

export type HonoEnv = {
  Bindings: Bindings;
  Variables: Variables;
};